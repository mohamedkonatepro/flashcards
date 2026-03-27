"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useFlashCards } from "@/context/FlashCardContext";

export default function FillBlank() {
  const { cards, direction, loading } = useFlashCards();

  // Only cards that have phrases
  const phraseCards = useMemo(
    () => cards.filter((c) => c.french_phrase && c.arabic_phrase),
    [cards]
  );

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [shake, setShake] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shuffle on mount
  const shuffled = useMemo(() => {
    const arr = [...phraseCards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [phraseCards]);

  const card = shuffled[index];

  const getBlankData = useCallback(() => {
    if (!card) return { phrase: "", answer: "", hint: "", phraseLang: "ar", answerLang: "ar" };

    // Always show Arabic phrase with blank — answer is always the Arabic word
    // Hint is always the French translation
    const phrase = card.arabic_phrase.replace(card.arabic_word, "______");
    return {
      phrase: phrase.includes("______") ? phrase : `${card.arabic_phrase} → ______`,
      answer: card.arabic_word,
      hint: card.french_word,
      phraseLang: "ar" as const,
      answerLang: "ar" as const,
    };
  }, [card]);

  const { phrase, answer, hint, phraseLang, answerLang } = getBlankData();

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .trim()
      // Remove Arabic diacritics for comparison
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/\s+/g, " ");

  const handleSubmit = () => {
    if (!input.trim() || revealed) return;

    const correct = normalize(input) === normalize(answer);
    setIsCorrect(correct);
    setRevealed(true);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));

    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleNext = () => {
    const nextIndex = index + 1 >= shuffled.length ? 0 : index + 1;
    setIndex(nextIndex);
    setInput("");
    setRevealed(false);
    setIsCorrect(null);
    setShowTranslation(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Chargement...</span>
      </div>
    );
  }

  if (shuffled.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <span className="text-4xl">📭</span>
        <span className="text-gray-400 text-lg text-center">
          Aucune carte avec phrase disponible
        </span>
      </div>
    );
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full mx-auto max-w-md px-1">
      {/* Score */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {index + 1}/{shuffled.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400">✓ {score.correct}</span>
          <span className="text-red-400">✗ {score.total - score.correct}</span>
          <span className={`font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400"}`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Phrase card — tap to see French translation */}
      <div
        className={`w-full rounded-2xl p-6 cursor-pointer active:scale-[0.98] transition-transform ${shake ? "animate-shake" : ""}`}
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          boxShadow: "0 12px 30px rgba(79, 70, 229, 0.2)",
        }}
        onClick={() => setShowTranslation(!showTranslation)}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300/50 mb-3 flex items-center justify-between">
          <span>Complète le mot manquant</span>
          <span>{showTranslation ? "▲ Masquer" : "▼ Voir traduction"}</span>
        </div>

        <p
          className="text-2xl text-center leading-relaxed text-white font-arabic"
          dir="rtl"
        >
          {phrase}
        </p>

        {/* French translation — shown on tap */}
        {showTranslation && card && (
          <p className="text-center text-sm text-indigo-200/70 mt-4 pt-3 border-t border-indigo-400/20">
            {card.french_phrase}
          </p>
        )}

        {hint && (
          <p className="text-center text-xs text-indigo-300/40 mt-3">
            Indice : <span className="text-indigo-300/60">{hint}</span>
          </p>
        )}
      </div>

      {/* Input */}
      <div className="w-full flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              revealed ? handleNext() : handleSubmit();
            }
          }}
          placeholder={answerLang === "ar" ? "اكتب الكلمة..." : "Tape le mot..."}
          dir={answerLang === "ar" ? "rtl" : "ltr"}
          className={`flex-1 px-4 py-3 rounded-xl bg-gray-800 border text-white text-center text-lg outline-none transition-colors ${
            answerLang === "ar" ? "font-arabic" : ""
          } ${
            revealed
              ? isCorrect
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-red-500 bg-red-500/10"
              : "border-gray-700 focus:border-indigo-500"
          }`}
          disabled={revealed}
          autoComplete="off"
          autoCapitalize="off"
        />
        <button
          onClick={revealed ? handleNext : handleSubmit}
          className={`px-5 py-3 rounded-xl text-white font-medium text-sm transition-all active:scale-95 ${
            revealed
              ? "bg-indigo-600 hover:bg-indigo-500"
              : "bg-indigo-600 hover:bg-indigo-500"
          }`}
        >
          {revealed ? "→" : "OK"}
        </button>
      </div>

      {/* Result feedback */}
      {revealed && (
        <div
          className={`w-full rounded-xl p-4 text-center ${
            isCorrect
              ? "bg-emerald-500/10 border border-emerald-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          {isCorrect ? (
            <p className="text-emerald-400 font-medium">Correct ! 🎉</p>
          ) : (
            <div>
              <p className="text-red-400 font-medium mb-2">La bonne réponse :</p>
              <p
                className={`text-2xl font-bold text-white ${answerLang === "ar" ? "font-arabic" : ""}`}
                dir={answerLang === "ar" ? "rtl" : "ltr"}
              >
                {answer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
