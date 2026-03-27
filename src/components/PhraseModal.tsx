"use client";

import { useState } from "react";
import { useFlashCards } from "@/context/FlashCardContext";

interface Props {
  onClose: () => void;
}

export default function PhraseModal({ onClose }: Props) {
  const { cards } = useFlashCards();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [direction, setDirection] = useState<"fr" | "ar">("fr");

  const phrasesCards = cards.filter((c) => c.french_phrase || c.arabic_phrase);

  const filtered = phrasesCards.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.french_word.toLowerCase().includes(q) ||
      c.arabic_word.includes(search) ||
      c.french_phrase.toLowerCase().includes(q) ||
      c.arabic_phrase.includes(search)
    );
  });

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">💬 Phrases</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setDirection("fr")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              direction === "fr" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            Français
          </button>
          <button
            onClick={() => setDirection("ar")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              direction === "ar" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            العربية
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un mot ou une phrase..."
          className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-white text-sm border border-gray-700 focus:border-indigo-500 outline-none mb-4"
        />

        <p className="text-xs text-gray-500 mb-3">{filtered.length} phrase(s)</p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filtered.map((card) => (
            <div
              key={card.id}
              onClick={() => setExpandedId(expandedId === card.id ? null : card.id)}
              className="bg-gray-800 rounded-xl p-3 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className={`font-medium ${direction === "ar" ? "font-arabic" : ""}`} dir={direction === "ar" ? "rtl" : "ltr"}>
                  {direction === "fr" ? card.french_word : card.arabic_word}
                </span>
                <span className="text-gray-500 text-xs">
                  {expandedId === card.id ? "▲" : "▼"}
                </span>
              </div>

              {expandedId === card.id && (
                <div className="mt-3 space-y-2 text-sm">
                  {card.french_phrase && (
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <span className="text-[10px] uppercase text-gray-500">Français</span>
                      <p className="text-gray-200">{card.french_phrase}</p>
                    </div>
                  )}
                  {card.arabic_phrase && (
                    <div className="bg-gray-700/50 rounded-lg p-2" dir="rtl">
                      <span className="text-[10px] uppercase text-gray-500">العربية</span>
                      <p className="text-gray-200 font-arabic">{card.arabic_phrase}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
