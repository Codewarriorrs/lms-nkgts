"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Award,
  ChevronLeft,
  Image as ImageIcon
} from "lucide-react";
import { API_URL } from "@/lib/api";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

interface LatsolStatus {
  modul_id: number;
  judul: string;
  urutan: number;
  slug: string;
  unlocked: boolean;
  alasan_terkunci?: string;
  completed: boolean;
  nilai?: number;
  poin?: number;
  bisa_ulang?: boolean;
  latsol_bisa_ulang?: boolean;
}

interface Question {
  id: number;
  pertanyaan: string;
  pilihan: string[];
  poin: number;
  image_url: string | null;
  jawaban_benar?: number;
  pembahasan?: string | null;
}

export default function SoalPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusList, setStatusList] = useState<LatsolStatus[]>([]);
  
  // Exam state
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [activeModuleJudul, setActiveModuleJudul] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewScoreInfo, setReviewScoreInfo] = useState<{ nilai: number; poin: number } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  // Result state
  const [examResult, setExamResult] = useState<any | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }), [token]);

  const loadStatus = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/latsol/status-siswa`, { headers });
      if (res.ok) {
        setStatusList(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [token]);

  const handleStartExam = async (moduleId: number, judul: string, isReview: boolean = false, nilai: number = 0, poin: number = 0) => {
    if (!token) return;
    try {
      setLoading(true);
      setExamResult(null);
      setAnswers({});
      setIsReviewMode(isReview);
      if (isReview) {
        setReviewScoreInfo({ nilai, poin });
      } else {
        setReviewScoreInfo(null);
      }
      const res = await fetch(`${API_URL}/latsol/modules/${moduleId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
        setActiveModuleId(moduleId);
        setActiveModuleJudul(judul);
      } else {
        alert("Gagal memuat soal latihan.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: number, optionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitExam = async () => {
    if (!activeModuleId || !token) return;
    
    // Validate that all questions are answered
    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      if (!confirm(`Ada ${unanswered.length} soal belum dijawab. Tetap kumpulkan?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        modul_teori_id: activeModuleId,
        jawaban: questions.map((q) => ({
          soal_id: q.id,
          jawaban_siswa: answers[q.id] !== undefined ? answers[q.id] : -1, // -1 means skipped
        })),
      };

      const res = await fetch(`${API_URL}/latsol/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setExamResult(data);
        loadStatus(); // refresh unlock sequence
      } else {
        alert("Gagal mengumpulkan lembar jawaban kuis.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitExam = () => {
    setActiveModuleId(null);
    setExamResult(null);
    setQuestions([]);
    setAnswers({});
  };

  if (currentUser?.role === "admin" || currentUser?.role === "guru") {
    return <TeacherDashboard tab="latsol" />;
  }

  if (loading && statusList.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── RENDER MODE 1: LEMBAR UJIAN (EXAM SHEET / REVIEW) ──
  if (activeModuleId !== null) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto space-y-6">
        
        {/* Exam Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <button 
            onClick={handleExitExam}
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 font-bold"
          >
            <ChevronLeft size={16} /> Kembali ke Menu
          </button>
          <div className="text-right">
            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {isReviewMode ? "Pembahasan Ujian" : "Ujian Modul"}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
            {isReviewMode ? "Kunci & Pembahasan Latsol" : "Latihan Soal"}: {activeModuleJudul}
          </h1>
          <p className="text-neutral-400 text-xs font-semibold mt-1">
            {isReviewMode 
              ? "Ulas kembali pembahasan dan kunci jawaban modul ini." 
              : "Isi lembar kuis evaluasi di bawah ini dengan memilih satu jawaban paling tepat."}
          </p>
        </div>

        {isReviewMode && reviewScoreInfo && (
          <div className="bg-white rounded-2xl border border-neutral-150 p-5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <p className="text-neutral-400 text-[10px] font-bold uppercase">Nilai Pengerjaan</p>
              <h3 className="text-neutral-900 font-black text-lg">Skor: {reviewScoreInfo.nilai}%</h3>
            </div>
            <div className="text-right">
              <span className="bg-success/10 text-success text-xs font-black px-3 py-1 rounded-full border border-success/30">
                +{reviewScoreInfo.poin} Poin Diperoleh
              </span>
            </div>
          </div>
        )}

        {/* Results view if submitted */}
        {examResult ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 md:p-8 text-center space-y-5 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Award size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-neutral-900 text-lg">Lembar Jawaban Dikoreksi</h3>
              <p className="text-neutral-400 text-xs">Evaluasi komprehensif Anda untuk modul ini telah disimpan.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto bg-neutral-50 p-4 rounded-xl text-xs font-bold text-neutral-600 border border-neutral-100/50">
              <div className="space-y-0.5">
                <p className="text-neutral-400 text-[10px]">Benar</p>
                <p className="text-success text-lg font-black">{examResult.total_benar} / {examResult.total_soal}</p>
              </div>
              <div className="space-y-0.5 border-x border-neutral-200">
                <p className="text-neutral-400 text-[10px]">Skor Akhir</p>
                <p className="text-primary text-lg font-black">{examResult.skor}%</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-neutral-400 text-[10px]">Poin Didapat</p>
                <p className="text-neutral-900 text-lg font-black">+{examResult.total_poin} Poin</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setExamResult(null);
                  setIsReviewMode(true);
                  setReviewScoreInfo({ nilai: examResult.skor, poin: examResult.total_poin });
                }}
                className="bg-primary hover:bg-primary-light text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-md shadow-primary/15 inline-block"
              >
                Lihat Pembahasan
              </button>
              <button
                onClick={handleExitExam}
                className="bg-white hover:bg-neutral-50 text-neutral-850 text-xs font-bold px-6 py-2.5 rounded-xl transition border border-neutral-200 inline-block"
              >
                Kembali ke Daftar Latsol
              </button>
            </div>
          </div>
        ) : (
          /* Question sheet */
          <div className="space-y-6">
            {questions.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-12">Belum ada butir soal di modul ini.</p>
            ) : (
              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const selectedOpt = answers[q.id];
                  return (
                    <div key={q.id} className="bg-white border border-neutral-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
                      
                      {/* Question Text */}
                      <div className="flex items-start gap-3 text-sm">
                        <span className="font-bold text-neutral-400 shrink-0">{idx + 1}.</span>
                        <div className="space-y-1">
                          <p className="font-bold text-neutral-850 leading-relaxed">{q.pertanyaan}</p>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Nilai: {q.poin} Poin</p>
                        </div>
                      </div>

                      {/* Question Image */}
                      {q.image_url && (
                        <div className="pl-6">
                          <img src={q.image_url} alt="Ilustrasi Soal" className="max-h-48 rounded-xl border border-neutral-100 object-contain bg-neutral-50/50 p-2" />
                        </div>
                      )}

                      {/* Options List */}
                      <div className="pl-6 space-y-2.5">
                        {q.pilihan.map((opsi, oIdx) => {
                          const isSelected = isReviewMode ? oIdx === q.jawaban_benar : selectedOpt === oIdx;
                          return (
                            <div 
                              key={oIdx}
                              onClick={isReviewMode ? undefined : () => handleSelectAnswer(q.id, oIdx)}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer select-none transition ${
                                isSelected 
                                  ? (isReviewMode ? "bg-success/5 border-success/40 text-success font-bold" : "bg-primary/5 border-primary/40 text-primary font-semibold") 
                                  : (isReviewMode ? "border-neutral-100 text-neutral-400 opacity-60 pointer-events-none" : "border-neutral-100 hover:bg-neutral-50 text-neutral-700")
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                isSelected 
                                  ? (isReviewMode ? "border-success bg-success text-white" : "border-primary bg-primary text-white") 
                                  : "border-neutral-300 bg-white text-neutral-400"
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                              <span className="leading-snug">{opsi}</span>
                            </div>
                          );
                        })}
                      </div>

                      {isReviewMode && q.pembahasan && (
                        <div className="mt-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 pl-6 ml-6">
                          <p className="font-bold text-neutral-800 mb-1">Pembahasan:</p>
                          <p className="leading-relaxed">{q.pembahasan}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Submit Panel */}
                {!isReviewMode && (
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSubmitExam}
                      disabled={submitting}
                      className="bg-primary hover:bg-primary-light text-white text-xs font-bold px-8 py-3 rounded-xl transition shadow-md shadow-primary/10 disabled:opacity-50"
                    >
                      {submitting ? "Mengirim Jawaban..." : "Submit Ujian"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── RENDER MODE 2: DAFTAR MODUL LATSOL (MODULES LIST) ──
  return (
    <div className="px-6 py-8 space-y-6 w-full max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          Soal Latihan Evaluasi
        </h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">
          Uji pemahaman komprehensif Anda pada setiap modul. Kerjakan secara berurutan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {statusList.map((m) => (
          <div 
            key={m.modul_id}
            className={`bg-white rounded-2xl border p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition shadow-2xs ${
              m.unlocked ? "border-neutral-100" : "border-neutral-100 bg-neutral-50/50 opacity-70"
            }`}
          >
            {/* Left part: Title & prerequisites alerts */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-widest">Modul {m.urutan}</span>
                {m.completed && (
                  <span className="bg-success/10 text-success text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    Selesai
                  </span>
                )}
              </div>
              <h3 className="font-bold text-neutral-900 text-base truncate">{m.judul}</h3>
              
              {!m.unlocked && m.alasan_terkunci && (
                <div className="inline-flex items-center gap-1.5 p-2 rounded bg-danger/5 border border-danger/10 text-[10px] font-semibold text-danger leading-snug">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{m.alasan_terkunci}</span>
                </div>
              )}
            </div>

            {/* Right part: stats & start action button */}
            <div className="flex items-center gap-4 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-start">
              {m.completed && m.nilai !== undefined && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">Skor Evaluasi</p>
                  <p className="font-black text-sm text-primary mt-0.5">{m.nilai}% ({m.poin ?? 0} Poin)</p>
                </div>
              )}

              {m.unlocked ? (
                m.completed ? (
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartExam(m.modul_id, m.judul, true, m.nilai ?? 0, m.poin ?? 0)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-250 text-neutral-700 transition"
                      >
                        Lihat Pembahasan
                      </button>
                      {m.bisa_ulang || m.latsol_bisa_ulang ? (
                        <button
                          onClick={() => handleStartExam(m.modul_id, m.judul, false)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-light text-white transition shadow-md shadow-primary/10"
                        >
                          Ulangi Latsol <ArrowRight size={13} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60"
                          title="Menunggu izin guru untuk mengulang"
                        >
                          Ulangi Latsol
                        </button>
                      )}
                    </div>
                    {!(m.bisa_ulang || m.latsol_bisa_ulang) && (
                      <span className="text-[9px] text-neutral-400 font-semibold italic">Butuh izin guru untuk mengulang</span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartExam(m.modul_id, m.judul, false)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-light text-white transition shadow-md shadow-primary/10 shrink-0"
                  >
                    Mulai Latsol <ArrowRight size={13} />
                  </button>
                )
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-200 text-neutral-500 shrink-0 select-none">
                  <Lock size={13} /> Terkunci
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
