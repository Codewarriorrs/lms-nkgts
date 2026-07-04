"use client";

import { BookOpen } from "lucide-react";

export default function MateriPage() {
  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          Materi Pelatihan
        </h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">
          Akses modul teori soft skill problem solving berbasis metodologi Kaizen.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <BookOpen size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-neutral-900 font-bold text-base">Modul Materi</h3>
          <p className="text-neutral-400 text-xs max-w-sm">
            Daftar modul teori Kaizen sedang disinkronkan dengan kurikulum Toyota. Halaman ini akan segera menampilkan daftar modul membaca Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
