"use client";

import React, { useState } from "react";
import { FilePlus } from "lucide-react";

interface SampleFile {
  name: string;
  url: string;
}

export default function UploadCard({ title, sample }: { title: string; sample?: SampleFile }) {
  const [selected, setSelected] = useState<File | null>(null);
  const [uploads, setUploads] = useState<Array<{ name: string; url?: string }>>([]);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) setSelected(f);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setUploads((s) => [...s, { name: selected.name }]);
    setSelected(null);
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setComments((c) => [...c, comment.trim()]);
    setComment("");
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm w-full">
      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 h-full flex flex-col items-start justify-center gap-3">
            <div className="w-full text-xs font-bold text-neutral-400 uppercase tracking-[0.1em]">Contoh</div>
            {sample ? (
              <a href={sample.url} target="_blank" rel="noreferrer" className="w-full text-sm font-semibold text-neutral-800 hover:underline">
                {sample.name}
              </a>
            ) : (
              <div className="text-xs text-neutral-400">Belum ada contoh</div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-neutral-900 font-bold">{title}</h3>
            <div className="text-sm text-neutral-400">Unggah file dan submit</div>
          </div>

          <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 flex flex-col gap-3">
            <label className="flex items-center gap-3">
              <input type="file" onChange={handleFile} className="hidden" />
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-semibold cursor-pointer">
                <FilePlus size={16} /> Pilih Berkas
              </div>
              <div className="text-sm text-neutral-600 truncate">{selected ? selected.name : "Belum memilih berkas"}</div>
            </label>
            <div className="flex items-center gap-3">
              <button onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-4 py-2 text-sm font-bold">
                Submit
              </button>
              <div className="text-sm text-neutral-500">{uploads.length} berkas terkirim</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-neutral-700">Komentar</div>
            <div className="mt-2 space-y-2">
              {comments.length === 0 ? (
                <div className="text-xs text-neutral-400">Belum ada komentar</div>
              ) : (
                comments.map((c, i) => (
                  <div key={i} className="rounded-lg bg-neutral-50 p-2 text-sm text-neutral-700">{c}</div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis komentar..." className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
              <button onClick={handleAddComment} className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-2 text-sm font-semibold">Kirim</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
