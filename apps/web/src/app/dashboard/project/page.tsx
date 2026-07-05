"use client";

import { FolderKanban } from "lucide-react";

export default function ProjectPage() {
  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          Project Kaizen
        </h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">
          Daftarkan ide perbaikan dan laporkan progress project kelompok Anda.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent-dark">
          <FolderKanban size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-neutral-900 font-bold text-base">Manajemen Proyek Kaizen</h3>
          <p className="text-neutral-400 text-xs max-w-sm">
            Gunakan modul ini untuk mengisi lembar observasi, perumusan 8 langkah Kaizen, serta mengunggah laporan final untuk dinilai.
          </p>
        </div>
      </div>
    </div>
  );
}
