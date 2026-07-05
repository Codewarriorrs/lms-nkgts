"use client";

import { ClipboardList } from "lucide-react";

export default function SoalPage() {
  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          Soal Latihan
        </h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">
          Uji pemahaman materi teori Kaizen melalui kuis pilihan ganda & essay.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
          <ClipboardList size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-neutral-900 font-bold text-base">Soal Kuis</h3>
          <p className="text-neutral-400 text-xs max-w-sm">
            Kuis latihan soal akan terbuka secara otomatis setelah Anda menyelesaikan modul teori terkait di menu Materi.
          </p>
        </div>
      </div>
    </div>
  );
}
