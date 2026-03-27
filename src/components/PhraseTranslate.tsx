"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useFlashCards } from "@/context/FlashCardContext";

export default function PhraseTranslate() {
  const { cards, loading } = useFlashCards();

  // Cards with phrases, shuffled, alternating FR→AR and AR→FR
  const exercises = useMemo(() => {
    const withPhrases = cards.filter((c) => c.french_phrase && c.arabic_phrase);
    const shuffled = [...withPhrases].sort(() => Math.random() - 0.5);
    return shuffled.map((card, i) => ({
      card,
      // Alternate: even = FR→AR, odd = AR→FR
      showArabic: i % 2 === 1,
    }));
  }, [cards]);

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [shake, setShake] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const exercise = exercises[index];

  const normalize = useCallback((s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[\u064B-\u065F\u0670]/g, "") // Remove Arabic diacritics
      .replace(/[.,!?;:'"«»""'']/g, "") // Remove punctuation
      .replace(/\s+/g, " "),
  []);

  const checkAnswer = useCallback(() => {
    if (!input.trim() || revealed || !exercise) return;

    const answer = exercise.showArabic
      ? exercise.card.french_phrase
      : exercise.card.arabic_phrase;

    const normalizedInput = normalize(input);
    const normalizedAnswer = normalize(answer);

    // Check similarity — allow some tolerance
    const correct = normalizedInput === normalizedAnswer;

    // Also check if at least 70% of words match
    const inputWords = normalizedInput.split(" ").filter(Boolean);
    const answerWords = normalizedAnswer.split(" ").filter(Boolean);
    const matchCount = inputWords.filter((w) => answerWords.includes(w)).length;
    const similarity = answerWords.length > 0 ? matchCount / answerWords.length : 0;
    const closeEnough = similarity >= 0.7;

    setIsCorrect(correct || closeEnough);
    setRevealed(true);
    setScore((s) => ({
      correct: s.correct + (correct || closeEnough ? 1 : 0),
      total: s.total + 1,
    }));

    if (!correct && !closeEnough) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [input, revealed, exercise, normalize]);

  const next = useCallback(() => {
    const nextIdx = index + 1 >= exercises.length ? 0 : index + 1;
    setIndex(nextIdx);
    setInput("");
    setRevealed(false);
    setIsCorrect(null);
    setShowHint(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [index, exercises.length]);

  const skip = useCallback(() => {
    setScore((s) => ({ ...s, total: s.total + 1 }));
    next();
  }, [next]);

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

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <span className="text-4xl">📭</span>
        <span className="text-gray-400 text-lg text-center">Aucune phrase disponible</span>
      </div>
    );
  }

  if (!exercise) return null;

  const { card, showArabic } = exercise;
  const question = showArabic ? card.arabic_phrase : card.french_phrase;
  const answer = showArabic ? card.french_phrase : card.arabic_phrase;
  const questionLang = showArabic ? "ar" : "fr";
  const answerLang = showArabic ? "fr" : "ar";
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // Hint: show the key word translation
  const hintWord = showArabic ? card.french_word : card.arabic_word;
  const hintFrom = showArabic ? card.arabic_word : card.french_word;

  return (
    <div className="flex flex-col items-center gap-3 w-full mx-auto max-w-md px-1">
      {/* Score */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{index + 1}/{exercises.length}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${showArabic ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"}`}>
            {showArabic ? "AR → FR" : "FR → AR"}
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

      {/* Question phrase */}
      <div
        className={`w-full rounded-2xl p-5 ${shake ? "animate-shake" : ""}`}
        style={{
          background: showArabic
            ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
            : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          boxShadow: showArabic
            ? "0 12px 30px rgba(5, 150, 105, 0.2)"
            : "0 12px 30px rgba(79, 70, 229, 0.2)",
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-3 text-white">
          Traduis cette phrase
        </div>
        <p
          className={`text-center leading-relaxed text-white ${questionLang === "ar" ? "font-arabic text-2xl" : "text-xl"}`}
          dir={questionLang === "ar" ? "rtl" : "ltr"}
        >
          {question}
        </p>
      </div>

      {/* Hint button */}
      {!revealed && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          {showHint ? `💡 ${hintFrom} = ${hintWord}` : "💡 Indice"}
        </button>
      )}

      {/* Input */}
      <div className="w-full">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              revealed ? next() : checkAnswer();
            }
          }}
          placeholder={answerLang === "ar" ? "اكتب الترجمة..." : "Écris la traduction..."}
          dir={answerLang === "ar" ? "rtl" : "ltr"}
          rows={2}
          className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white text-center text-lg outline-none transition-colors resize-none ${
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
      </div>

      {/* Action buttons */}
      <div className="w-full flex gap-2">
        {!revealed ? (
          <>
            <button
              onClick={skip}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-800 text-gray-400 border border-gray-700 active:scale-95 transition-all"
            >
              Passer →
            </button>
            <button
              onClick={checkAnswer}
              disabled={!input.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white active:scale-95 transition-all disabled:opacity-40"
            >
              Vérifier ✓
            </button>
          </>
        ) : (
          <button
            onClick={next}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white active:scale-95 transition-all"
          >
            Suivant →
          </button>
        )}
      </div>

      {/* Result */}
      {revealed && (
        <div
          className={`w-full rounded-xl p-4 ${
            isCorrect
              ? "bg-emerald-500/10 border border-emerald-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          {isCorrect ? (
            <p className="text-emerald-400 font-medium text-center">Correct ! 🎉</p>
          ) : (
            <div>
              <p className="text-red-400 font-medium text-center mb-2">La bonne réponse :</p>
              <p
                className={`text-xl font-bold text-white text-center ${answerLang === "ar" ? "font-arabic text-2xl" : ""}`}
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
