"use client";

import { Briefcase } from "lucide-react";

export default function TugasPage() {
  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          Tugas Praktek
        </h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">
          Kumpulkan hasil observasi lapangan dan tugas implementasi Kaizen Anda.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Briefcase size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-neutral-900 font-bold text-base">Unggah Laporan Tugas</h3>
          <p className="text-neutral-400 text-xs max-w-sm">
            Halaman pengunggahan berkas tugas (format PDF/Gambar) sedang disiapkan. Anda dapat memantau penilaian guru setelah mengumpulkan tugas.
          </p>
        </div>
      </div>
    </div>
  );
}
