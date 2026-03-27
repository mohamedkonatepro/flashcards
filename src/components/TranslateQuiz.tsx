"use client";

import { useState, useMemo, useCallback } from "react";
import { useFlashCards } from "@/context/FlashCardContext";
import { FlashCard } from "@/types";

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TranslateQuiz() {
  const { cards, direction, loading } = useFlashCards();

  const phraseCards = useMemo(
    () => cards.filter((c) => c.french_phrase && c.arabic_phrase),
    [cards]
  );

  const shuffled = useMemo(() => shuffleArr(phraseCards), [phraseCards]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const card = shuffled[index];

  // Generate 4 options (1 correct + 3 wrong)
  const options = useMemo(() => {
    if (!card) return [];

    const correctPhrase =
      direction === "fr-ar" ? card.arabic_phrase : card.french_phrase;

    // Get 3 random wrong answers
    const others = phraseCards
      .filter((c) => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => (direction === "fr-ar" ? c.arabic_phrase : c.french_phrase));

    // Combine and shuffle
    return shuffleArr([correctPhrase, ...others]);
  }, [card, direction, phraseCards]);

  const correctAnswer =
    card && (direction === "fr-ar" ? card.arabic_phrase : card.french_phrase);

  const handleSelect = useCallback(
    (option: string) => {
      if (selected) return; // Already answered
      setSelected(option);
      const correct = option === correctAnswer;
      setIsCorrect(correct);
      setScore((s) => ({
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
      }));
    },
    [selected, correctAnswer]
  );

  const handleNext = () => {
    const nextIndex = index + 1 >= shuffled.length ? 0 : index + 1;
    setIndex(nextIndex);
    setSelected(null);
    setIsCorrect(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Chargement...</span>
      </div>
    );
  }

  if (phraseCards.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <span className="text-4xl">📭</span>
        <span className="text-gray-400 text-lg text-center px-4">
          Il faut au moins 4 cartes avec phrases pour le QCM
        </span>
      </div>
    );
  }

  if (!card) return null;

  const questionPhrase =
    direction === "fr-ar" ? card.french_phrase : card.arabic_phrase;
  const questionLang = direction === "fr-ar" ? "fr" : "ar";
  const answerLang = direction === "fr-ar" ? "ar" : "fr";
  const pct =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full mx-auto max-w-md px-1">
      {/* Score */}
      <div className="flex items-center justify-between w-full">
        <span className="text-xs text-gray-500">
          {index + 1}/{shuffled.length}
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400">✓ {score.correct}</span>
          <span className="text-red-400">✗ {score.total - score.correct}</span>
          <span
            className={`font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400"}`}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Question phrase */}
      <div
        className="w-full rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          boxShadow: "0 12px 30px rgba(79, 70, 229, 0.2)",
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300/50 mb-3">
          Trouve la traduction
        </div>
        <p
          className={`text-xl text-center leading-relaxed text-white ${questionLang === "ar" ? "font-arabic text-2xl" : ""}`}
          dir={questionLang === "ar" ? "rtl" : "ltr"}
        >
          {questionPhrase}
        </p>
      </div>

      {/* Options */}
      <div className="w-full flex flex-col gap-2.5">
        {options.map((option, i) => {
          const isThis = selected === option;
          const isAnswer = option === correctAnswer;
          let bg = "bg-gray-800/80 border-gray-700 hover:border-gray-600";
          let textColor = "text-white";

          if (selected) {
            if (isAnswer) {
              bg = "bg-emerald-500/15 border-emerald-500";
              textColor = "text-emerald-300";
            } else if (isThis && !isCorrect) {
              bg = "bg-red-500/15 border-red-500";
              textColor = "text-red-300";
            } else {
              bg = "bg-gray-800/40 border-gray-800";
              textColor = "text-gray-600";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className={`w-full px-4 py-3.5 rounded-xl border text-left transition-all active:scale-[0.98] ${bg} ${textColor}`}
              dir={answerLang === "ar" ? "rtl" : "ltr"}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold border ${
                    selected && isAnswer
                      ? "border-emerald-500 text-emerald-400"
                      : selected && isThis && !isCorrect
                      ? "border-red-500 text-red-400"
                      : "border-gray-600 text-gray-500"
                  }`}
                >
                  {selected && isAnswer ? "✓" : selected && isThis && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                </span>
                <span
                  className={`flex-1 text-sm leading-relaxed ${answerLang === "ar" ? "font-arabic text-base" : ""}`}
                >
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Next button */}
      {selected && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm transition-all active:scale-95 hover:bg-indigo-500"
        >
          Suivant →
        </button>
      )}
    </div>
  );
}
