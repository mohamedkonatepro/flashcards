"use client";

import { useState, useRef } from "react";
import { useFlashCards } from "@/context/FlashCardContext";
import * as XLSX from "xlsx";

interface Props {
  onClose: () => void;
}

export default function UploadModal({ onClose }: Props) {
  const { addCards } = useFlashCards();
  const [result, setResult] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [manualFr, setManualFr] = useState("");
  const [manualAr, setManualAr] = useState("");
  const [manualPhFr, setManualPhFr] = useState("");
  const [manualPhAr, setManualPhAr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

      const firstRow = rawRows[0] || [];
      const headerLower = firstRow.map((h) => String(h).toLowerCase().trim());
      const hasHeader = headerLower.some(
        (h) =>
          h.includes("français") ||
          h.includes("francais") ||
          h.includes("arabe") ||
          h.includes("mot") ||
          h.includes("phrase") ||
          h.includes("french") ||
          h.includes("arabic")
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

      const newCards = dataRows
        .filter((row) => row.length > 0 && String(row[colMap.frWord] || "").trim())
        .map((row) => ({
          french_word: String(row[colMap.frWord] || "").trim(),
          arabic_word: String(row[colMap.arWord] || "").trim(),
          french_phrase: String(row[colMap.frPhrase] || "").trim(),
          arabic_phrase: String(row[colMap.arPhrase] || "").trim(),
        }));

      const added = await addCards(newCards);
      setResult(`${added} mot(s) ajouté(s), ${newCards.length - added} doublon(s) ignoré(s)`);
    } catch {
      setResult("Erreur lors de la lecture du fichier. Vérifie le format.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleManualAdd = async () => {
    if (!manualFr.trim() || !manualAr.trim()) return;
    setUploading(true);
    const added = await addCards([
      {
        french_word: manualFr.trim(),
        arabic_word: manualAr.trim(),
        french_phrase: manualPhFr.trim(),
        arabic_phrase: manualPhAr.trim(),
      },
    ]);
    if (added > 0) {
      setResult("Mot ajouté !");
      setManualFr("");
      setManualAr("");
      setManualPhFr("");
      setManualPhAr("");
    } else {
      setResult("Ce mot existe déjà");
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Ajouter des mots</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            Importer un fichier (.xlsx, .csv)
          </label>
          <p className="text-xs text-gray-500 mb-1">
            Format : Mot (Français) | Mot (Arabe) | Phrase (Français) | Phrase (Arabe)
          </p>
          <p className="text-xs text-gray-600 mb-2">
            En-têtes auto-détectées. Doublons ignorés.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            disabled={uploading}
            className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-sm disabled:opacity-50"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Ajouter manuellement</h3>
          <input
            value={manualFr}
            onChange={(e) => setManualFr(e.target.value)}
            placeholder="Mot français"
            className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-white text-sm border border-gray-700 focus:border-indigo-500 outline-none"
          />
          <input
            value={manualAr}
            onChange={(e) => setManualAr(e.target.value)}
            placeholder="كلمة بالعربية"
            dir="rtl"
            className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-white text-sm border border-gray-700 focus:border-indigo-500 outline-none font-arabic"
          />
          <input
            value={manualPhFr}
            onChange={(e) => setManualPhFr(e.target.value)}
            placeholder="Phrase en français (optionnel)"
            className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-white text-sm border border-gray-700 focus:border-indigo-500 outline-none"
          />
          <input
            value={manualPhAr}
            onChange={(e) => setManualPhAr(e.target.value)}
            placeholder="جملة بالعربية (اختياري)"
            dir="rtl"
            className="w-full bg-gray-800 rounded-lg px-3 py-2.5 text-white text-sm border border-gray-700 focus:border-indigo-500 outline-none font-arabic"
          />
          <button
            onClick={handleManualAdd}
            disabled={!manualFr.trim() || !manualAr.trim() || uploading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-40"
          >
            {uploading ? "Ajout en cours..." : "Ajouter"}
          </button>
        </div>

        {result && (
          <div className="mt-4 p-3 rounded-lg bg-gray-800 text-sm text-center text-green-400">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
