"use client";

import Link from "next/link";
import UploadCard from "@/components/project/UploadCard";
import { ArrowLeft } from "lucide-react";

export default function ProposalPage() {
  const sample = { name: "Contoh Proposal.pdf", url: "#" };

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kumpulkan Proposal</h1>
          <p className="text-neutral-400 text-xs mt-1">Unggah proposal proyek kelompok Anda di halaman ini.</p>
        </div>
        <Link href="/dashboard/project" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-800">
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>

      <div className="max-w-6xl w-full">
        <UploadCard title="Proposal" sample={sample} />
      </div>
    </div>
  );
}
