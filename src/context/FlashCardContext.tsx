"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { FlashCard, ViewMode, Direction } from "@/types";
import { supabase } from "@/lib/supabase";

interface FlashCardContextType {
  cards: FlashCard[];
  filteredCards: FlashCard[];
  viewMode: ViewMode;
  direction: Direction;
  currentIndex: number;
  loading: boolean;
  setViewMode: (mode: ViewMode) => void;
  setDirection: (dir: Direction) => void;
  setCurrentIndex: (i: number) => void;
  markAs: (id: string, status: FlashCard["status"]) => void;
  addCards: (newCards: Pick<FlashCard, "french_word" | "arabic_word" | "french_phrase" | "arabic_phrase">[]) => Promise<number>;
  deleteCard: (id: string) => void;
  stats: { total: number; review: number; memorized: number; new_: number };
}

const FlashCardContext = createContext<FlashCardContextType | null>(null);

export function useFlashCards() {
  const ctx = useContext(FlashCardContext);
  if (!ctx) throw new Error("useFlashCards must be inside FlashCardProvider");
  return ctx;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFilteredIds(cards: FlashCard[], viewMode: ViewMode): string[] {
  switch (viewMode) {
    case "review":
      return cards.filter((c) => c.status === "review").map((c) => c.id);
    case "memorized":
      return cards.filter((c) => c.status === "memorized").map((c) => c.id);
    default:
      return cards.map((c) => c.id);
  }
}

export function FlashCardProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [direction, setDirection] = useState<Direction>("fr-ar");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load cards from Supabase
  const fetchCards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase fetch error:", error);
      }
      if (data) {
        setCards(data as FlashCard[]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Shuffle order stored separately — only reshuffled when viewMode changes
  const [shuffledOrder, setShuffledOrder] = useState<string[]>([]);
  const prevViewModeRef = useRef(viewMode);

  // Reshuffle when viewMode changes or on first load
  useEffect(() => {
    const ids = getFilteredIds(cards, viewMode);
    setShuffledOrder(shuffleArray(ids));
    setCurrentIndex(0);
    prevViewModeRef.current = viewMode;
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // When cards change (e.g. markAs), update the order without reshuffling:
  // - keep existing cards in their current order
  // - remove cards that no longer match the filter
  // - append any new matching cards at the end
  useEffect(() => {
    const validIds = new Set(getFilteredIds(cards, viewMode));
    setShuffledOrder((prev) => {
      const kept = prev.filter((id) => validIds.has(id));
      const newIds = [...validIds].filter((id) => !prev.includes(id));
      return [...kept, ...newIds];
    });
  }, [cards, viewMode]);

  const filteredCards = React.useMemo(() => {
    const cardMap = new Map(cards.map((c) => [c.id, c]));
    return shuffledOrder.map((id) => cardMap.get(id)).filter(Boolean) as FlashCard[];
  }, [cards, shuffledOrder]);

  const markAs = useCallback(async (id: string, status: FlashCard["status"]) => {
    // Optimistic update
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status, last_reviewed: new Date().toISOString(), review_count: c.review_count + 1 }
          : c
      )
    );

    await supabase
      .from("flashcards")
      .update({
        status,
        last_reviewed: new Date().toISOString(),
        review_count: cards.find((c) => c.id === id)!.review_count + 1,
      })
      .eq("id", id);
  }, [cards]);

  const addCards = useCallback(
    async (newCards: Pick<FlashCard, "french_word" | "arabic_word" | "french_phrase" | "arabic_phrase">[]): Promise<number> => {
      // Filter out empty entries
      const validCards = newCards.filter(
        (c) => c.french_word.trim() && c.arabic_word.trim()
      );

      if (validCards.length === 0) return 0;

      // Use upsert with onConflict to handle duplicates at DB level
      const toInsert = validCards.map((c) => ({
        french_word: c.french_word.trim(),
        arabic_word: c.arabic_word.trim(),
        french_phrase: (c.french_phrase || "").trim(),
        arabic_phrase: (c.arabic_phrase || "").trim(),
        status: "new" as const,
        review_count: 0,
      }));

      // Insert one by one to skip duplicates (unique index will reject them)
      let added = 0;
      for (const card of toInsert) {
        const { error } = await supabase.from("flashcards").insert(card);
        if (!error) added++;
      }

      // Refresh from DB
      await fetchCards();
      return added;
    },
    [fetchCards]
  );

  const deleteCard = useCallback(async (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("flashcards").delete().eq("id", id);
  }, []);

  const stats = React.useMemo(() => ({
    total: cards.length,
    review: cards.filter((c) => c.status === "review").length,
    memorized: cards.filter((c) => c.status === "memorized").length,
    new_: cards.filter((c) => c.status === "new").length,
  }), [cards]);

  return (
    <FlashCardContext.Provider
      value={{
        cards,
        filteredCards,
        viewMode,
        direction,
        currentIndex,
        loading,
        setViewMode,
        setDirection,
        setCurrentIndex,
        markAs,
        addCards,
        deleteCard,
        stats,
      }}
    >
      {children}
    </FlashCardContext.Provider>
  );
}
