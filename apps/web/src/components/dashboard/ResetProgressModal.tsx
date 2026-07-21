"use client";

import { useState } from "react";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/api";

interface ResetProgressModalProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ResetProgressModal({
  isOpen,
  userId,
  userName,
  onClose,
  onSuccess,
}: ResetProgressModalProps) {
  const [startModule, setStartModule] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/${userId}/reset-progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startFromModule: startModule,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mereset progres belajar.");
      }

      onSuccess(data.message || `Progres belajar berhasil direset mulai dari Modul ${startModule}!`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modulesList = [
    { id: 1, name: "Modul 1: Budaya Kaizen" },
    { id: 2, name: "Modul 2: Budaya 5R" },
    { id: 3, name: "Modul 3: Potensi Bahaya" },
    { id: 4, name: "Modul 4: 7 Waste (Pemborosan)" },
    { id: 5, name: "Modul 5: 8 Langkah Penyelesaian Masalah" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-2xl border border-neutral-100 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 z-10 mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 leading-snug">
                Reset Progres Belajar
              </h3>
              <p className="text-xs text-neutral-500">
                Siswa: <span className="font-semibold text-neutral-700">{userName}</span>
              </p>
            </div>
          </div>

          <hr className="border-neutral-100" />

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700">
              Pilih Titik Awal Reset:
            </label>
            <select
              value={startModule}
              onChange={(e) => setStartModule(parseInt(e.target.value, 10))}
              className="w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              {modulesList.map((m) => (
                <option key={m.id} value={m.id}>
                  Mulai dari {m.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              * Opsi ini akan menghapus data progres membaca materi, kuis (latsol), dan pengumpulan tugas praktik untuk modul terpilih serta modul-modul setelahnya. Modul sebelum titik awal reset akan tetap utuh.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleResetSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-warning hover:bg-warning/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Mereset...
                </>
              ) : (
                "Reset Progres"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
