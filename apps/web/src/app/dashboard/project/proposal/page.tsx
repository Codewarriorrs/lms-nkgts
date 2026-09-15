"use client";

import UploadCard from "@/components/project/UploadCard";
import { BackButton } from "@/components/ui/BackButton";

export default function ProposalPage() {
  const sample = { name: "TemplateProposal.pdf", url: "/TemplateProposal.pdf" };

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">Kumpulkan Proposal</h1>
          <p className="text-neutral-400 text-xs mt-1">Unggah proposal proyek kelompok Anda di halaman ini.</p>
        </div>
        <BackButton href="/dashboard/project" label="Kembali ke Proyek" variant="outline" size="sm" />
      </div>

      <div className="max-w-6xl w-full">
        <UploadCard title="Proposal" sample={sample} />
      </div>
    </div>
  );
}
