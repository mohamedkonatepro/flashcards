export interface FlashCard {
  id: string;
  french_word: string;
  arabic_word: string;
  french_phrase: string;
  arabic_phrase: string;
  status: "new" | "review" | "memorized";
  last_reviewed: string | null;
  review_count: number;
  created_at: string;
}

export type ViewMode = "all" | "review" | "memorized" | "shuffle";
export type Direction = "fr-ar" | "ar-fr";
export type AppTab = "cards" | "translate";
