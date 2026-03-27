"use client";

import { useState } from "react";
import { useFlashCards } from "@/context/FlashCardContext";
import UploadModal from "./UploadModal";
import PhraseModal from "./PhraseModal";

export default function TopBar() {
  const { direction, setDirection, stats } = useFlashCards();
  const [showUpload, setShowUpload] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-white">🇸🇦 Flashcards</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPhrase(true)}
              className="p-2 rounded-lg bg-gray-800 text-sm"
              title="Phrases"
            >
              💬
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="p-2 rounded-lg bg-gray-800 text-sm"
              title="Importer"
            >
              📤
            </button>
            <button
              onClick={() => setDirection(direction === "fr-ar" ? "ar-fr" : "fr-ar")}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
            >
              {direction === "fr-ar" ? "FR → AR" : "AR → FR"}
            </button>
          </div>
        </div>
        {/* Stats bar */}
        <div className="flex justify-center gap-4 pb-2 text-xs text-gray-500 max-w-lg mx-auto">
          <span>📚 {stats.total}</span>
          <span>🆕 {stats.new_}</span>
          <span>🔁 {stats.review}</span>
          <span>✅ {stats.memorized}</span>
        </div>
      </header>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {showPhrase && <PhraseModal onClose={() => setShowPhrase(false)} />}
    </>
  );
}
