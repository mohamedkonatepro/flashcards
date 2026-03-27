"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  const filteredCards = React.useMemo(() => {
    switch (viewMode) {
      case "review":
        return cards.filter((c) => c.status === "review");
      case "memorized":
        return cards.filter((c) => c.status === "memorized");
      case "shuffle":
        return shuffleArray(cards);
      default:
        return cards;
    }
  }, [cards, viewMode]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [viewMode]);

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
