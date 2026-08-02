"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import {
  FileText,
  Award,
  Calendar,
  AlertCircle,
  TrendingUp,
  Heart,
  CheckCircle,
  MessageSquare
} from "lucide-react";

interface GradeDetail {
  id: string;
  siswa_id: string;
  penilai_id: string;
  nilai: number;
  detail_nilai: Record<string, number>;
  catatan: string | null;
  rekomendasi: string;
  created_at: string;
  updated_at: string;
  siswa: {
    nama: string;
    email: string;
    nis: string | null;
    kelas: string | null;
    sekolah: {
      nama_sekolah: string;
    } | null;
  };
}

const gradingCriteria = [
  {
    category: "A. Disiplin",
    indicators: [
      { id: "A1", text: "Kehadiran memenuhi 90% dari total durasi magang" },
      { id: "A2", text: "Datang tepat waktu" },
      { id: "A3", text: "Mematuhi peraturan lokasi magang" },
      { id: "A4", text: "Patuh terhadap K3 dan menerapkan 5R" },
    ]
  },
  {
    category: "B. Empati dan Etika",
    indicators: [
      { id: "B1", text: "Peka terhadap masalah" },
      { id: "B2", text: "Menghargai dan membantu rekan kerja" },
      { id: "B3", text: "Dapat bekerja sama (kooperatif) dengan baik" },
      { id: "B4", text: "Beretika sopan dan jujur" },
    ]
  },
  {
    category: "C. Kritis dan Komunikatif",
    indicators: [
      { id: "C1", text: "Aktif bertanya untuk memahami proses kerja" },
      { id: "C2", text: "Mampu mengidentifikasi akar masalah" },
      { id: "C3", text: "Dapat mengkomunikasikan hasil pekerjaannya" },
      { id: "C4", text: "Bertanggung jawab atas pekerjaannya" },
    ]
  },
  {
    category: "D. Kreatif dan Terampil",
    indicators: [
      { id: "D1", text: "Memiliki ide/cara baru dalam bekerja" },
      { id: "D2", text: "Memahami penggunaan alat kerja" },
      { id: "D3", text: "Bekerja dengan teliti dan cermat" },
      { id: "D4", text: "Memahami dan menerapkan prosedur kerja" },
    ]
  },
  {
    category: "E. Inovatif dan Inisiatif",
    indicators: [
      { id: "E1", text: "Dapat memberikan usulan perbaikan" },
      { id: "E2", text: "Mampu merealisasikan ide perbaikan" },
      { id: "E3", text: "Aktif mencari solusi dan perbaikan" },
      { id: "E4", text: "Memiliki kemauan untuk mempelajari hal baru" },
    ]
  }
];

export default function NilaiPklPage() {
  const router = useRouter();
  const [grade, setGrade] = useState<GradeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchMyGrade = async () => {
      try {
        const res = await fetch(`${API_URL}/nilai-pkl/my-grade`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Gagal memuat nilai PKL");
        }

        setGrade(data.data);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyGrade();
  }, [router]);

  if (loading) {
    return (
      <div className="px-6 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-neutral-200 rounded" />
        <div className="h-4 w-96 bg-neutral-200 rounded" />
        <div className="h-64 bg-white rounded-2xl border border-neutral-100" />
      </div>
    );
  }

  if (errorMsg || !grade) {
    return (
      <div className="px-6 py-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-4 border border-amber-100">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-neutral-800">Penilaian Belum Tersedia</h2>
        <p className="text-neutral-500 text-sm mt-2">
          {errorMsg || "Laporan hasil belajar dan penilaian PKL Anda belum diterbitkan oleh Pembimbing Magang."}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-primary/10"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const formattedDate = new Date(grade.updated_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="px-6 py-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2.5">
            <FileText className="text-primary h-7 w-7" />
            Laporan Hasil Belajar PKL
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Transkrip evaluasi kompetensi magang (DEKKI) pada program National Kaizen Goes to School.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-bold bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
          <Calendar size={14} />
          <span>Diterbitkan: {formattedDate}</span>
        </div>
      </div>

      {/* Student Personal Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-neutral-400 block font-bold uppercase">Nama Lengkap</span>
          <span className="text-base font-extrabold text-neutral-800">{grade.siswa.nama}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-400 block font-bold uppercase">Nomor Induk Siswa (NIS)</span>
          <span className="text-base font-extrabold text-neutral-800">{grade.siswa.nis || "-"}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-400 block font-bold uppercase">Kelas / Jurusan</span>
          <span className="text-base font-extrabold text-neutral-800">{grade.siswa.kelas || "-"}</span>
        </div>
        <div>
          <span className="text-xs text-neutral-400 block font-bold uppercase">Sekolah Pengirim</span>
          <span className="text-base font-extrabold text-neutral-800">
            {grade.siswa.sekolah?.nama_sekolah || "PT Toyota-Astra Motor (TAM)"}
          </span>
        </div>
      </div>

      {/* Grade Overview and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-6 rounded-3xl shadow-lg flex flex-col justify-between min-h-[160px]">
          <div>
            <Award className="h-8 w-8 text-white/30" />
            <span className="text-xs font-bold text-white/80 block mt-2">Skor Akhir Evaluasi</span>
          </div>
          <div className="flex items-baseline gap-1 mt-4">
            <span className="text-5xl font-black">{grade.nilai}</span>
            <span className="text-lg text-white/60">/ 100</span>
          </div>
        </div>

        {/* Recommendation Card */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <span className="text-xs text-neutral-400 block font-bold uppercase">Status Rekomendasi Kelulusan</span>
              <h3 className="text-lg font-black text-emerald-800 mt-0.5">{grade.rekomendasi}</h3>
            </div>
          </div>
          <p className="text-neutral-500 text-xs mt-3 leading-relaxed">
            *Rekomendasi kelulusan didasarkan atas akumulasi nilai sikap, keterampilan kerja, kepatuhan K3/5R, serta keaktifan duga bahaya & perbaikan (Kaizen).
          </p>
        </div>
      </div>

      {/* Score Details Breakdown Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
          <TrendingUp className="text-primary h-5 w-5" />
          <h3 className="font-extrabold text-neutral-800 text-sm">Rincian Nilai Kompetensi (DEKKI)</h3>
        </div>
        <div className="divide-y divide-neutral-100">
          {gradingCriteria.map((cat) => (
            <div key={cat.category} className="p-6 space-y-4">
              <h4 className="font-extrabold text-neutral-800 text-sm border-l-4 border-primary pl-3">
                {cat.category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                {cat.indicators.map((ind) => {
                  const scoreVal = grade.detail_nilai[ind.id] || 4;
                  return (
                    <div key={ind.id} className="flex items-center justify-between bg-neutral-50/50 px-4 py-3 rounded-xl border border-neutral-100">
                      <span className="text-xs text-neutral-600 font-semibold">{ind.text}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-neutral-400 mr-1">Skor:</span>
                        <span className="font-black text-sm text-primary bg-primary/10 w-7 h-7 rounded-lg flex items-center justify-center">
                          {scoreVal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentor Feedback & Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mentor Feedback */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm md:col-span-2 space-y-3">
          <h4 className="font-bold text-neutral-800 text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            Catatan Evaluasi Pembimbing
          </h4>
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-150 text-neutral-600 text-sm italic leading-relaxed">
            "{grade.catatan || "Tidak ada catatan khusus dari pembimbing magang."}"
          </div>
        </div>

        {/* Signature Box */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between items-center text-center min-h-[200px]">
          <div>
            <span className="text-xs text-neutral-400 block font-bold uppercase">Disahkan Oleh</span>
            <span className="text-sm font-extrabold text-neutral-700 block mt-1">Pembimbing Industri / Guru</span>
          </div>
          <div className="w-32 border-b border-dashed border-neutral-350 my-6" />
          <div>
            <span className="text-xs text-neutral-500 font-bold">N-KGTS Committee</span>
            <span className="text-[10px] text-neutral-400 block">PT Toyota-Astra Motor (TAM)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
