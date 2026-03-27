"use client";

import { useState, useRef, useCallback } from "react";
import { useFlashCards } from "@/context/FlashCardContext";
import { FlashCard } from "@/types";

function CardFace({
  card,
  direction,
  showPhrase,
  flipped,
  interactive = false,
}: {
  card: FlashCard;
  direction: "fr-ar" | "ar-fr";
  showPhrase: boolean;
  flipped: boolean;
  interactive?: boolean;
}) {
  const front = direction === "fr-ar" ? card.french_word : card.arabic_word;
  const back = direction === "fr-ar" ? card.arabic_word : card.french_word;
  const frontPhrase = direction === "fr-ar" ? card.french_phrase : card.arabic_phrase;
  const backPhrase = direction === "fr-ar" ? card.arabic_phrase : card.french_phrase;
  const frontLang = direction === "fr-ar" ? "Français" : "العربية";
  const backLang = direction === "fr-ar" ? "العربية" : "Français";
  const isArabicFront = direction === "ar-fr";
  const isArabicBack = direction === "fr-ar";

  return (
    <div className="w-full h-full" style={{ perspective: "1200px" }}>
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped && interactive ? "rotateY(180deg)" : "rotateY(0)",
          transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl text-white flex flex-col items-center justify-center p-6 pt-8 overflow-visible"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)",
            boxShadow: "0 20px 40px rgba(79, 70, 229, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-10"
            style={{ background: "radial-gradient(circle at 30% 20%, white 0%, transparent 50%)" }}
          />
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-4 font-medium">{frontLang}</span>
          <span
            className={`text-3xl font-bold text-center mt-1 ${isArabicFront ? "font-arabic" : ""}`}
            dir={isArabicFront ? "rtl" : "ltr"}
          >
            {front}
          </span>
          {showPhrase && interactive && frontPhrase && (
            <p
              className={`mt-5 opacity-90 text-center leading-relaxed max-w-[90%] ${isArabicFront ? "font-arabic text-xl" : "text-lg"}`}
              dir={isArabicFront ? "rtl" : "ltr"}
            >
              {frontPhrase}
            </p>
          )}
          {interactive && (
            <span className="absolute bottom-4 text-[10px] opacity-30 tracking-wider">TOUCHE POUR RETOURNER</span>
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl text-white flex flex-col items-center justify-center p-6 pt-8 overflow-visible"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #0f766e 100%)",
            boxShadow: "0 20px 40px rgba(5, 150, 105, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-10"
            style={{ background: "radial-gradient(circle at 30% 20%, white 0%, transparent 50%)" }}
          />
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-4 font-medium">{backLang}</span>
          <span
            className={`text-3xl font-bold text-center mt-1 ${isArabicBack ? "font-arabic" : ""}`}
            dir={isArabicBack ? "rtl" : "ltr"}
          >
            {back}
          </span>
          {showPhrase && interactive && backPhrase && (
            <p
              className={`mt-5 opacity-90 text-center leading-relaxed max-w-[90%] ${isArabicBack ? "font-arabic text-xl" : "text-lg"}`}
              dir={isArabicBack ? "rtl" : "ltr"}
            >
              {backPhrase}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FlashCardView() {
  const { filteredCards, direction, currentIndex, setCurrentIndex, markAs, loading } = useFlashCards();
  const [flipped, setFlipped] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const [, forceRender] = useState(0);

  // ALL swipe logic in refs to avoid stale closures
  const dragXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isLockedRef = useRef(false); // hard lock to prevent double-fire
  const justArrivedRef = useRef(false); // skip transition on first frame after swap
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const SWIPE_THRESHOLD = 60;
  const VELOCITY_THRESHOLD = 0.3;
  const EXIT_DURATION = 180;

  const render = useCallback(() => {
    forceRender((n) => n + 1);
  }, []);

  const goToCard = useCallback((newIndex: number, dir: "left" | "right") => {
    if (isLockedRef.current) return; // HARD lock
    isLockedRef.current = true;
    isDraggingRef.current = false;

    // Animate current card out
    dragXRef.current = dir === "left" ? -420 : 420;
    render();

    setTimeout(() => {
      // New card appears instantly — no transition on first frame
      justArrivedRef.current = true;
      setFlipped(false);
      setShowPhrase(false);
      setCurrentIndex(newIndex);
      dragXRef.current = 0;
      isDraggingRef.current = false;
      render();

      // Double rAF: guarantees the browser painted the "no transition" frame
      // before we re-enable transitions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          justArrivedRef.current = false;
          isLockedRef.current = false;
          render();
        });
      });
    }, EXIT_DURATION);
  }, [setCurrentIndex, render]);

  const finishSwipe = useCallback(() => {
    if (isLockedRef.current) return;

    const dx = dragXRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    const velocity = Math.abs(dx) / Math.max(elapsed, 1);
    const shouldSwipe = Math.abs(dx) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

    if (shouldSwipe && dx > 0 && currentIndex > 0) {
      goToCard(currentIndex - 1, "right");
    } else if (shouldSwipe && dx < 0 && currentIndex < filteredCards.length - 1) {
      goToCard(currentIndex + 1, "left");
    } else {
      // Snap back
      dragXRef.current = 0;
      isDraggingRef.current = false;
      render();
    }
  }, [currentIndex, filteredCards.length, goToCard, render]);

  // --- Touch handlers ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isLockedRef.current) return;
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
    dragXRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || isLockedRef.current) return;
    dragXRef.current = e.touches[0].clientX - startXRef.current;
    // Use rAF to batch renders
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
  }, [render]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || isLockedRef.current) return;
    finishSwipe();
  }, [finishSwipe]);

  // --- Mouse handlers ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLockedRef.current) return;
    startXRef.current = e.clientX;
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
    dragXRef.current = 0;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || isLockedRef.current) return;
    dragXRef.current = e.clientX - startXRef.current;
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
  }, [render]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    finishSwipe();
  }, [finishSwipe]);

  const handleCardClick = useCallback(() => {
    if (Math.abs(dragXRef.current) < 5 && !isLockedRef.current) {
      setFlipped((f) => !f);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Chargement...</span>
      </div>
    );
  }

  if (filteredCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <span className="text-4xl">📭</span>
        <span className="text-gray-400 text-lg">Aucune carte dans cette catégorie</span>
      </div>
    );
  }

  const card = filteredCards[currentIndex] || filteredCards[0];
  if (!card) return null;

  const prevCard = currentIndex > 0 ? filteredCards[currentIndex - 1] : null;
  const nextCard = currentIndex < filteredCards.length - 1 ? filteredCards[currentIndex + 1] : null;

  const dx = dragXRef.current;
  const dragging = isDraggingRef.current;
  const locked = isLockedRef.current;

  // Which bg card to show
  const bgCard = dx > 0 ? prevCard : dx < 0 ? nextCard : nextCard || prevCard;

  // Main card style
  const dragProgress = Math.min(Math.abs(dx) / 200, 1);
  const rotation = dx * 0.06;

  const justArrived = justArrivedRef.current;

  const currentStyle: React.CSSProperties = locked
    ? {
        transform: `translateX(${dx}px) rotate(${dx * 0.04}deg)`,
        opacity: 1 - dragProgress * 0.4,
        transition: `all ${EXIT_DURATION}ms cubic-bezier(0.2, 0, 0, 1)`,
        pointerEvents: "none",
      }
    : dragging
    ? {
        transform: `translateX(${dx}px) rotate(${rotation}deg)`,
        transition: "none",
        cursor: "grabbing",
      }
    : justArrived
    ? {
        // Card just swapped in — NO transition, sit immediately in place
        transform: "translateX(0) rotate(0deg)",
        transition: "none",
        cursor: "grab",
      }
    : {
        transform: "translateX(0) rotate(0deg)",
        transition: "all 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
        cursor: "grab",
      };

  // Background card — visually IDENTICAL to main card
  // Same size, same opacity, same shadow — only z-index differs
  const bgStyle: React.CSSProperties = {
    transform: "none",
    opacity: 1,
    transition: "none",
  };

  const statusColor =
    card.status === "memorized" ? "bg-emerald-500" : card.status === "review" ? "bg-amber-500" : "bg-gray-500";
  const statusLabel =
    card.status === "memorized" ? "Mémorisé" : card.status === "review" ? "À revoir" : "Nouveau";
  const progress = filteredCards.length > 1 ? (currentIndex / (filteredCards.length - 1)) * 100 : 100;

  return (
    <div
      className="flex flex-col items-center gap-3 w-full mx-auto max-w-md select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Progress bar */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 font-medium whitespace-nowrap flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
          <span>{statusLabel}</span>
          <span className="text-gray-600">·</span>
          <span>{currentIndex + 1}/{filteredCards.length}</span>
        </div>
      </div>

      {/* Card stack */}
      <div className="relative w-full" style={{ height: "220px" }}>
        {/* Background card — real next/prev */}
        {bgCard && (
          <div className="absolute inset-0 z-0" style={bgStyle}>
            <CardFace card={bgCard} direction={direction} showPhrase={false} flipped={false} />
          </div>
        )}

        {/* Main card */}
        <div
          className="absolute inset-0 z-10"
          style={currentStyle}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClick={handleCardClick}
        >
          <CardFace card={card} direction={direction} showPhrase={showPhrase} flipped={flipped} interactive />
        </div>
      </div>

      {/* Phrase toggle */}
      {(card.french_phrase || card.arabic_phrase) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPhrase(!showPhrase);
          }}
          className="text-xs text-indigo-400/80 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
        >
          <span>{showPhrase ? "◉" : "○"}</span>
          <span>{showPhrase ? "Masquer la phrase" : "Voir la phrase"}</span>
        </button>
      )}

      {/* Navigation dots */}
      <div className="flex items-center gap-1.5">
        {filteredCards.length <= 20 ? (
          filteredCards.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === currentIndex) return;
                goToCard(i, i > currentIndex ? "left" : "right");
              }}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-6 h-1.5 bg-indigo-500" : "w-1.5 h-1.5 bg-gray-700 hover:bg-gray-600"
              }`}
            />
          ))
        ) : (
          <span className="text-[10px] text-gray-600">{currentIndex + 1} sur {filteredCards.length}</span>
        )}
      </div>

      {/* Status buttons */}
      <div className="flex gap-2 w-full">
        <button
          onClick={() => markAs(card.id, "review")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
            card.status === "review"
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
              : "bg-gray-800/80 text-amber-400 border border-amber-500/20 hover:border-amber-500/40"
          }`}
        >
          🔁 À revoir
        </button>
        <button
          onClick={() => markAs(card.id, "memorized")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
            card.status === "memorized"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "bg-gray-800/80 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40"
          }`}
        >
          ✅ Mémorisé
        </button>
        <button
          onClick={() => markAs(card.id, "new")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
            card.status === "new"
              ? "bg-gray-500 text-white shadow-lg shadow-gray-500/25"
              : "bg-gray-800/80 text-gray-400 border border-gray-500/20 hover:border-gray-500/40"
          }`}
        >
          ↩ Reset
        </button>
      </div>
    </div>
  );
}
