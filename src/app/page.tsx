"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FlashCardProvider } from "@/context/FlashCardContext";
import TopBar from "@/components/TopBar";
import NavBar from "@/components/NavBar";
import type { AppTab } from "@/types";

const FlashCardView = dynamic(() => import("@/components/FlashCardView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
      Chargement...
    </div>
  ),
});

const FillBlank = dynamic(() => import("@/components/FillBlank"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
      Chargement...
    </div>
  ),
});

const TranslateQuiz = dynamic(() => import("@/components/TranslateQuiz"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
      Chargement...
    </div>
  ),
});

export default function Home() {
  const [tab, setTab] = useState<AppTab>("cards");

  return (
    <FlashCardProvider>
      <TopBar />
      <main className="fixed inset-0 top-[88px] bottom-[72px] flex flex-col items-center justify-center px-4 overflow-y-auto">
        {tab === "cards" && <FlashCardView />}
        {tab === "fill-blank" && <FillBlank />}
        {tab === "translate-quiz" && <TranslateQuiz />}
      </main>
      <NavBar tab={tab} setTab={setTab} />
    </FlashCardProvider>
  );
}
