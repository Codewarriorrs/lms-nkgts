"use client";

import Link from "next/link";
import { FileText, FileCheck } from "lucide-react";

export default function ProjectPage() {
  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Project Kaizen</h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">Pilih jenis pengumpulan yang ingin Anda lakukan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link href="/dashboard/project/proposal" className="block">
          <div className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-accent-dark">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-neutral-900 font-bold">Kumpulkan Proposal</h3>
                <p className="text-neutral-400 text-xs mt-1">Unggah proposal proyek kelompok Anda.</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/project/laporan" className="block">
          <div className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-accent-dark">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="text-neutral-900 font-bold">Kumpulkan Laporan</h3>
                <p className="text-neutral-400 text-xs mt-1">Unggah laporan akhir proyek kelompok Anda.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
