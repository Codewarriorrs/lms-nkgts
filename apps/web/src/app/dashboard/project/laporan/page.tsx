"use client";

import UploadCard from "@/components/project/UploadCard";
import { BackButton } from "@/components/ui/BackButton";

export default function LaporanPage() {
  const sample = { name: "TemplateLaporan.pdf", url: "/TemplateLaporan.pdf" };

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kumpulkan Laporan</h1>
          <p className="text-neutral-400 text-xs mt-1">Unggah laporan akhir proyek kelompok Anda di halaman ini.</p>
        </div>
        <BackButton href="/dashboard/project" label="Kembali ke Proyek" variant="outline" size="sm" />
      </div>

      <div className="max-w-6xl w-full">
        <UploadCard title="Laporan" sample={sample} />
      </div>
    </div>
  );
}
