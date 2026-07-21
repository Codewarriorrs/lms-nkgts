"use client";

import React, { useState, useEffect } from "react";
import { FilePlus, Download, CheckCircle2, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api";

import { uploadFileOrBase64 } from "@/utils/upload";

interface SampleFile {
  name: string;
  url: string;
}

export default function UploadCard({ title, sample }: { title: string; sample?: SampleFile }) {
  const [selected, setSelected] = useState<File | null>(null);
  const [dbSubmission, setDbSubmission] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const tipe = title.toLowerCase(); // "proposal" atau "laporan"

  const fetchStatus = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/project-kaizen/status-siswa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const match = data.find((item: any) => item.tipe === tipe);
        if (match) {
          setDbSubmission(match);
          setComment(match.catatan_siswa || "");
        }
      }
    } catch (err) {
      console.error("Gagal memuat status proyek:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [tipe, token]);

  const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];

  const validateFile = (file: File): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert("Hanya berkas format PDF (.pdf) atau Word (.doc, .docx) yang diizinkan untuk diunggah!");
      return false;
    }
    return true;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      if (validateFile(f)) {
        setSelected(f);
      } else {
        e.target.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    if (!selected || !token) return;
    if (!validateFile(selected)) return;
    try {
      setSubmitting(true);
      const fileUrl = await uploadFileOrBase64(selected, "project");
      const res = await fetch(`${API_URL}/project-kaizen/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tipe,
          file_name: selected.name,
          file_url: fileUrl,
          catatan_siswa: comment
        })
      });
      if (res.ok) {
        setSelected(null);
        fetchStatus();
      } else {
        alert("Gagal mengunggah berkas proyek.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm flex items-center justify-center h-44">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm w-full space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Sample File */}
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 h-full flex flex-col items-start justify-center gap-3">
            <div className="w-full text-xs font-bold text-neutral-400 uppercase tracking-[0.1em]">Unduh Template</div>
            {sample ? (
              <a href={sample.url} target="_blank" rel="noreferrer" className="w-full text-sm font-semibold text-neutral-800 hover:underline">
                {sample.name}
              </a>
            ) : (
              <div className="text-xs text-neutral-400">Belum ada contoh</div>
            )}
          </div>
        </div>

        {/* Right Column: Upload form and Status info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-neutral-900 font-bold text-base">Unggah Berkas {title}</h3>
            <span className="text-xs text-neutral-400">Format PDF / Dokumen</span>
          </div>

          {/* Submission status alert if exists */}
          {dbSubmission && (
            <div className="p-4 rounded-xl border border-success/20 bg-success/5 text-xs text-success-dark flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-neutral-850">Berkas Berhasil Terkirim</p>
                <p className="text-neutral-500 mt-0.5">Nama: <strong className="font-semibold text-neutral-700">{dbSubmission.file_name}</strong></p>
                <p className="text-neutral-400 text-[10px] mt-1">Dikirim pada: {new Date(dbSubmission.submitted_at).toLocaleString("id-ID")}</p>
              </div>
            </div>
          )}

          {/* Form input */}
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 flex flex-col gap-3">
            <label className="flex items-center gap-3">
              <input 
                type="file" 
                onChange={handleFile} 
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                className="hidden" 
              />
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-200 text-xs font-bold cursor-pointer select-none">
                <FilePlus size={14} /> {dbSubmission ? "Ganti Berkas" : "Pilih Berkas"}
              </div>
              <div className="text-xs text-neutral-600 truncate">{selected ? selected.name : "Belum memilih berkas"}</div>
            </label>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Komentar / Catatan Kelompok</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tulis catatan atau deskripsi ringkas..."
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary text-neutral-800"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-4 py-2.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {submitting ? "Mengunggah..." : "Submit Tugas"}
              </button>
            </div>
          </div>

          {/* Teacher evaluation detail */}
          {dbSubmission && (dbSubmission.nilai !== null || dbSubmission.catatan_guru || dbSubmission.file_revisi_name) && (
            <div className="border border-neutral-100 rounded-xl p-4 space-y-3 bg-neutral-50/20 text-xs">
              <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-neutral-400" /> Hasil Evaluasi Guru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="space-y-0.5">
                  <p className="text-neutral-400 font-semibold text-[10px]">Nilai Proyek</p>
                  <p className="font-bold text-neutral-900">
                    {dbSubmission.nilai !== null ? `${dbSubmission.nilai} / 100` : "Belum Dinilai"}
                  </p>
                </div>
                {dbSubmission.catatan_guru && (
                  <div className="space-y-0.5">
                    <p className="text-neutral-400 font-semibold text-[10px]">Catatan / Masukan Guru</p>
                    <p className="text-neutral-700 italic">"{dbSubmission.catatan_guru}"</p>
                  </div>
                )}
              </div>

              {dbSubmission.file_revisi_name && (
                <div className="border-t border-neutral-100 pt-3 flex items-center justify-between gap-3 bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <div className="space-y-0.5">
                    <p className="text-primary font-bold text-[10px] uppercase">Berkas Perbaikan / Revisi Guru</p>
                    <p className="font-semibold text-neutral-800">{dbSubmission.file_revisi_name}</p>
                  </div>
                  <a
                    href={dbSubmission.file_revisi_url}
                    download={dbSubmission.file_revisi_name}
                    className="inline-flex items-center gap-1 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg font-bold"
                  >
                    <Download size={13} /> Unduh
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
