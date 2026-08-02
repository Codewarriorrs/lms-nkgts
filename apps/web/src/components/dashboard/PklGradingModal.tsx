"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api";

interface PklGradingModalProps {
  isOpen: boolean;
  student: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const gradingCriteria = [
  {
    category: "A. Disiplin",
    indicators: [
      { id: "A1", text: "1. Kehadiran memenuhi 90% dari total durasi magang" },
      { id: "A2", text: "2. Datang tepat waktu" },
      { id: "A3", text: "3. Mematuhi peraturan lokasi magang" },
      { id: "A4", text: "4. Patuh terhadap K3 dan menerapkan 5R" },
    ]
  },
  {
    category: "B. Empati dan Etika",
    indicators: [
      { id: "B1", text: "1. Peka terhadap masalah" },
      { id: "B2", text: "2. Menghargai dan membantu rekan kerja" },
      { id: "B3", text: "3. Dapat bekerja sama (kooperatif) dengan baik" },
      { id: "B4", text: "4. Beretika sopan dan jujur" },
    ]
  },
  {
    category: "C. Kritis dan Komunikatif",
    indicators: [
      { id: "C1", text: "1. Aktif bertanya untuk memahami proses kerja" },
      { id: "C2", text: "2. Mampu mengidentifikasi akar masalah" },
      { id: "C3", text: "3. Dapat mengkomunikasikan hasil pekerjaannya" },
      { id: "C4", text: "4. Bertanggung jawab atas pekerjaannya" },
    ]
  },
  {
    category: "D. Kreatif dan Terampil",
    indicators: [
      { id: "D1", text: "1. Memiliki ide/cara baru dalam bekerja" },
      { id: "D2", text: "2. Memahami penggunaan alat kerja" },
      { id: "D3", text: "3. Bekerja dengan teliti dan cermat" },
      { id: "D4", text: "4. Memahami dan menerapkan prosedur kerja" },
    ]
  },
  {
    category: "E. Inovatif dan Inisiatif",
    indicators: [
      { id: "E1", text: "1. Dapat memberikan usulan perbaikan" },
      { id: "E2", text: "2. Mampu merealisasikan ide perbaikan" },
      { id: "E3", text: "3. Aktif mencari solusi dan perbaikan" },
      { id: "E4", text: "4. Memiliki kemauan untuk mempelajari hal baru" },
    ]
  }
];

export function PklGradingModal({ isOpen, student, onClose, onSuccess }: PklGradingModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [catatan, setCatatan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("Direkomendasikan");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      // Initialize default scores of 4 for all indicators if not graded, or load if present
      const initialScores: Record<string, number> = {};
      const detail = student.nilai_pkl?.detail_nilai || {};
      
      gradingCriteria.forEach((cat) => {
        cat.indicators.forEach((ind) => {
          initialScores[ind.id] = detail[ind.id] !== undefined ? detail[ind.id] : 4;
        });
      });
      setScores(initialScores);
      setCatatan(student.nilai_pkl?.catatan || "");
      setRekomendasi(student.nilai_pkl?.rekomendasi || "Direkomendasikan");
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // Calculate Total Score (Sum of all 20 indicators, max 100)
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);

  const handleScoreChange = (id: string, val: number) => {
    setScores((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/nilai-pkl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siswa_id: student.id,
          nilai: totalScore,
          detail_nilai: scores,
          catatan,
          rekomendasi,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan penilaian PKL");
      }

      onSuccess(data.message || "Penilaian PKL berhasil disimpan!");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl border border-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Form Penilaian PKL (DEKKI)</h3>
            <p className="text-sm text-neutral-500">
              Siswa: <span className="font-semibold text-neutral-700">{student.nama}</span> ({student.sekolah?.nama_sekolah || student.school}) | Kelas: {student.kelas || "-"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Criteria Categories */}
          <div className="space-y-6">
            {gradingCriteria.map((cat) => (
              <div key={cat.category} className="border border-neutral-100 rounded-xl overflow-hidden">
                <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-100">
                  <h4 className="font-bold text-neutral-800 text-sm">{cat.category}</h4>
                </div>
                <div className="divide-y divide-neutral-100">
                  {cat.indicators.map((ind) => (
                    <div key={ind.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <span className="text-sm text-neutral-700 font-medium">{ind.text}</span>
                      
                      {/* Score Selector (1-5) */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {[1, 2, 3, 4, 5].map((val) => {
                          const isSelected = scores[ind.id] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleScoreChange(ind.id, val)}
                              className={`
                                w-9 h-9 rounded-lg font-bold text-sm transition-all
                                ${
                                  isSelected
                                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                }
                              `}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">Rekomendasi Kelulusan</label>
              <select
                value={rekomendasi}
                onChange={(e) => setRekomendasi(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
              >
                <option value="Sangat Direkomendasikan">Sangat Direkomendasikan</option>
                <option value="Direkomendasikan">Direkomendasikan</option>
                <option value="Direkomendasikan dengan Pembinaan">Direkomendasikan dengan Pembinaan</option>
                <option value="Belum Direkomendasikan">Belum Direkomendasikan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">
                Skor Akhir Magang (Otomatis)
              </label>
              <div className="px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between">
                <span className="text-sm text-neutral-500 font-medium">Akumulasi Skor (20 - 100)</span>
                <span className="text-xl font-black text-primary">{totalScore} / 100</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-neutral-700 mb-2">Catatan Pembimbing</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                placeholder="Tuliskan catatan evaluasi kualitatif siswa selama pelaksanaan PKL..."
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-sm transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : (
              <>
                <Save size={16} />
                Simpan Penilaian
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
