"use client";

import { useFlashCards } from "@/context/FlashCardContext";
import { ViewMode, AppTab } from "@/types";

const cardTabs: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: "all", label: "Tous", icon: "📚" },
  { mode: "review", label: "À revoir", icon: "🔁" },
  { mode: "memorized", label: "Mémorisés", icon: "✅" },
  { mode: "shuffle", label: "Mélanger", icon: "🔀" },
];

const appTabs: { id: AppTab; label: string; icon: string }[] = [
  { id: "cards", label: "Cartes", icon: "🃏" },
  { id: "fill-blank", label: "Trou", icon: "✏️" },
  { id: "translate-quiz", label: "QCM", icon: "🧠" },
];

export default function NavBar({
  tab,
  setTab,
}: {
  tab: AppTab;
  setTab: (t: AppTab) => void;
}) {
  const { viewMode, setViewMode, stats } = useFlashCards();

  const getCount = (mode: ViewMode) => {
    switch (mode) {
      case "review": return stats.review;
      case "memorized": return stats.memorized;
      case "all":
      case "shuffle": return stats.total;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 safe-area-bottom">
      {/* App-level tabs */}
      <div className="flex justify-around items-center max-w-lg mx-auto border-b border-gray-800/50">
        {appTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-1.5 text-xs transition-colors ${
              tab === t.id ? "text-indigo-400" : "text-gray-600"
            }`}
          >
            <span className="text-base">{t.icon}</span>
            <span className="mt-0.5 text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Card sub-tabs (only when on cards tab) */}
      {tab === "cards" && (
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {cardTabs.map((ct) => (
            <button
              key={ct.mode}
              onClick={() => setViewMode(ct.mode)}
              className={`flex flex-col items-center py-1.5 px-3 text-xs transition-colors ${
                viewMode === ct.mode ? "text-indigo-400" : "text-gray-500"
              }`}
            >
              <span className="text-sm">{ct.icon}</span>
              <span className="mt-0.5 text-[10px]">{ct.label}</span>
              <span className="text-[9px] opacity-60">{getCount(ct.mode)}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
