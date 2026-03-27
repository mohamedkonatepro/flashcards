/**
 * Seed script: reads data.xlsx from project root and inserts into Supabase.
 * Run: npx tsx scripts/seed.ts
 *
 * Make sure to copy your Excel file first:
 *   cp ~/Downloads/Vocabulaire_Arabe_Francais_fixed.xlsx ~/Documents/flashcards/data.xlsx
 */

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://kovzlfikdepxzuzmkpfa.supabase.co";
const SUPABASE_KEY = "sb_publishable_3Vwkcbl9VwIy9eolifYg_w_RTWTq-DX";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  const filePath = resolve(__dirname, "../data.xlsx");

  let buf: Buffer;
  try {
    buf = readFileSync(filePath);
  } catch {
    console.error("File not found: data.xlsx");
    console.error("Run: cp ~/Downloads/Vocabulaire_Arabe_Francais_fixed.xlsx ~/Documents/flashcards/data.xlsx");
    process.exit(1);
  }

  const wb = XLSX.read(buf);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

  // Detect header
  const firstRow = rawRows[0] || [];
  const headerLower = firstRow.map((h) => String(h).toLowerCase().trim());
  const hasHeader = headerLower.some(
    (h) => h.includes("français") || h.includes("arabe") || h.includes("mot") || h.includes("phrase")
  );

  const colMap = { frWord: 0, arWord: 1, frPhrase: 2, arPhrase: 3 };
  if (hasHeader) {
    headerLower.forEach((h, i) => {
      if ((h.includes("mot") || h.includes("word")) && (h.includes("fran") || h.includes("french"))) colMap.frWord = i;
      else if ((h.includes("mot") || h.includes("word")) && h.includes("arab")) colMap.arWord = i;
      else if ((h.includes("phrase") || h.includes("sentence")) && (h.includes("fran") || h.includes("french"))) colMap.frPhrase = i;
      else if ((h.includes("phrase") || h.includes("sentence")) && h.includes("arab")) colMap.arPhrase = i;
    });
  }

  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;

  const cards = dataRows
    .filter((row) => row.length > 0 && String(row[colMap.frWord] || "").trim())
    .map((row) => ({
      french_word: String(row[colMap.frWord] || "").trim(),
      arabic_word: String(row[colMap.arWord] || "").trim(),
      french_phrase: String(row[colMap.frPhrase] || "").trim(),
      arabic_phrase: String(row[colMap.arPhrase] || "").trim(),
      status: "new",
      review_count: 0,
    }));

  console.log(`Found ${cards.length} words to insert...`);

  let added = 0;
  let skipped = 0;

  for (const card of cards) {
    const { error } = await supabase.from("flashcards").insert(card);
    if (error) {
      skipped++;
    } else {
      added++;
    }
  }

  console.log(`Done! ${added} added, ${skipped} skipped (duplicates)`);
}

seed();
