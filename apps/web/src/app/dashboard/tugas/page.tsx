"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Lock, 
  Unlock, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Camera, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { uploadFileOrBase64 } from "@/utils/upload";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

interface Submisi {
  id: string;
  tanggal: string;
  area_pengisian: string;
  keterangan: string;
  detail_jawaban: any;
  nilai: number | null;
  catatan_guru: string | null;
  submitted_at: string;
}

interface TugasPraktek {
  id: number;
  judul: string;
  deskripsi: string;
  urutan: number;
  submisi: Submisi[];
}

const RUANG_OPTIONS = [
  "Ruang Kelas",
  "Ruang Praktek",
  "Ruang Perpustakaan",
  "Ruang Aula",
  "Ruang UKS",
  "Kamar Mandi",
  "Lobby Sekolah",
  "Area Parkir"
];

const CHECKLIST_ITEMS = {
  ringkas: [
    { key: "ringkas_sampah", label: "Ditemukan adanya sampah dan/potensi bahaya" },
    { key: "ringkas_barang", label: "Ada barang-barang yang tidak diperlukan" },
    { key: "ringkas_alat", label: "Adanya perlengkapan atau peralatan yang tidak diperlukan" }
  ],
  rapi: [
    { key: "rapi_lokasi", label: "Tidak ada kejelasan penempatan barang" },
    { key: "rapi_kuantitas", label: "Kuantitas minimum dan maksimum barang tidak jelas" },
    { key: "rapi_penempatan", label: "Barang-barang tidak ditempatkan sesuai lokasinya" },
    { key: "rapi_label", label: "Tidak ada penanda (label) untuk tempat kerja, ruangan, dan perlengkapan" }
  ],
  resik: [
    { key: "resik_alat", label: "Perlengkapan dan peralatan kebersihan tidak mudah didapat" },
    { key: "resik_kotor", label: "Peralatan tidak bersih, berdebu dan kotor" },
    { key: "resik_perbaikan", label: "Peralatan yang membutuhkan perbaikan tidak diberi tanda" },
    { key: "resik_debu", label: "Tempat kerja berdebu dan kotoran menempel" },
    { key: "resik_visual", label: "Alat kontrol visual tidak bersih dan/rusak" },
    { key: "resik_lain", label: "Permasalahan kebersihan lainya masih ada" }
  ],
  rawat: [
    { key: "rawat_checklist", label: "Cek list kebersihan tidak ada" },
    { key: "rawat_standard_view", label: "Standard tidak diketahui atau tidak terlihat" },
    { key: "rawat_kuantitas_limit", label: "Standard atau batasan kuantitas tidak jelas atau tidak ada" },
    { key: "rawat_visual_info", label: "Alat kontrol visual tidak memadai informasinya" },
    { key: "rawat_cari_barang", label: "Barang tidak bisa ditemukan dalam waktu 30 detik" }
  ],
  rajin: [
    { key: "rajin_standard", label: "Ada kondisi tidak konsisten dengan standard yang ada" },
    { key: "rajin_kuantitas", label: "Ada jumlah item yang tidak lengkap sesuai standard kuantitasnya" },
    { key: "rajin_perintah", label: "Tidak melakukan jika tidak diperintahkan untuk ringkas, rapi dan resik" }
  ]
};

export default function TugasPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tasks, setTasks] = useState<TugasPraktek[]>([]);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
      setToastTimeoutId(null);
    }, 3000);
    setToastTimeoutId(timer);
  };

  // Form states per Submenu
  const [ruangS1, setRuangS1] = useState("Ruang Kelas");
  const [S1_rutin, setS1_rutin] = useState("");
  const [S1_tidakRutin, setS1_tidakRutin] = useState("");
  const [S1_tidakPerlu, setS1_tidakPerlu] = useState<string[]>([]);
  const [S1_tidakPerluInput, setS1_tidakPerluInput] = useState("");
  const [activePill, setActivePill] = useState<string | null>(null);
  const [pillAssignments, setPillAssignments] = useState<Record<string, "recycle" | "relocation" | "dispose">>({});
  const [fotoS1, setFotoS1] = useState<string>("");
  const [uploadingS1, setUploadingS1] = useState(false);

  const [S2_recycle, setS2_recycle] = useState("");
  const [S2_relocation, setS2_relocation] = useState("");
  const [S2_dispose, setS2_dispose] = useState("");
  const [fotoS2, setFotoS2] = useState<string>("");
  const [uploadingS2, setUploadingS2] = useState(false);

  const [ruangS3, setRuangS3] = useState("Ruang Kelas");
  const [checklistS3, setChecklistS3] = useState<Record<string, { status: "ADA" | "TIDAK ADA"; catatan: string }>>({});
  const [fotoS3, setFotoS3] = useState<string>("");
  const [uploadingS3, setUploadingS3] = useState(false);

  const [bahayaRumahS4, setBahayaRumahS4] = useState<any[]>(
    Array(5).fill(null).map(() => ({ temuan: "", kategori: "FIRE", frekuensi: 3, dampak: 1, penyebab: "" }))
  );
  const [bahayaSekolahS4, setBahayaSekolahS4] = useState<any[]>(
    Array(5).fill(null).map(() => ({ temuan: "", kategori: "FIRE", frekuensi: 3, dampak: 1, penyebab: "" }))
  );
  const [fotoS4, setFotoS4] = useState<string>("");
  const [uploadingS4, setUploadingS4] = useState(false);

  const [wasteSekolahS5, setWasteSekolahS5] = useState<any[]>(
    Array(5).fill(null).map(() => ({ temuan: "", kategori: "Menunggu" }))
  );
  const [wasteRumahS5, setWasteRumahS5] = useState<any[]>(
    Array(5).fill(null).map(() => ({ temuan: "", kategori: "Menunggu" }))
  );
  const [fotoS5, setFotoS5] = useState<string>("");
  const [uploadingS5, setUploadingS5] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Initialize checklist S3 options
  useEffect(() => {
    const initial: Record<string, { status: "ADA" | "TIDAK ADA"; catatan: string }> = {};
    Object.values(CHECKLIST_ITEMS).forEach((group) => {
      group.forEach((item) => {
        initial[item.key] = { status: "TIDAK ADA", catatan: "" };
      });
    });
    setChecklistS3(initial);
  }, []);

  const loadStatus = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tugas-praktek/status-siswa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Gagal memuat status tugas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (token && currentUser?.role === "siswa") {
      loadStatus();
    } else if (currentUser && currentUser.role !== "siswa") {
      setLoading(false);
    }
  }, [token, currentUser]);

  // Pull Submenu 1 read-only values for Submenu 2
  const S1_tidakPerluRefValue = useMemo<string[]>(() => {
    const s1 = tasks.find((t) => t.id === 1);
    const submisi = s1?.submisi?.[0];
    if (submisi?.detail_jawaban) {
      const val = submisi.detail_jawaban.barang_tidak_diperlukan;
      if (Array.isArray(val)) return val;
      if (typeof val === "string") return val.split("\n").map(s => s.trim()).filter(Boolean);
      return [];
    }
    return S1_tidakPerlu;
  }, [tasks, S1_tidakPerlu]);

  // Check if Checklist 5R has any "ADA" (NOT OK) items
  const s3HasNotOk = useMemo(() => {
    const activeSubmisi = tasks.find((t) => t.id === 3)?.submisi?.[0];
    const source = activeSubmisi?.detail_jawaban?.checklist || checklistS3;
    return Object.values(source).some((v: any) => v.status === "ADA");
  }, [tasks, checklistS3]);

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (currentUser?.role === "guru" || currentUser?.role === "admin") {
    return <TeacherDashboard tab="tugas" />;
  }

  // Handle Photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, submenuId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (submenuId === 1) { setUploadingS1(true); }
      else if (submenuId === 2) { setUploadingS2(true); }
      else if (submenuId === 3) { setUploadingS3(true); }
      else if (submenuId === 4) { setUploadingS4(true); }
      else if (submenuId === 5) { setUploadingS5(true); }

      const url = await uploadFileOrBase64(file, `tugas-praktek-s${submenuId}`);
      if (url) {
        if (submenuId === 1) { setFotoS1(url); }
        else if (submenuId === 2) { setFotoS2(url); }
        else if (submenuId === 3) { setFotoS3(url); }
        else if (submenuId === 4) { setFotoS4(url); }
        else if (submenuId === 5) { setFotoS5(url); }
      }
    } catch (error) {
      showToast("Gagal mengunggah foto.", "error");
    } finally {
      if (submenuId === 1) { setUploadingS1(false); }
      else if (submenuId === 2) { setUploadingS2(false); }
      else if (submenuId === 3) { setUploadingS3(false); }
      else if (submenuId === 4) { setUploadingS4(false); }
      else if (submenuId === 5) { setUploadingS5(false); }
    }
  };

  // Handle Form Submission
  const handleFormSubmit = async (submenuId: number) => {
    if (!token) return;

    let payload: any = {};
    let area = "";

    if (submenuId === 1) {
      if (!fotoS1) { showToast("Wajib mengunggah foto dokumentasi kondisi awal!", "error"); return; }
      area = ruangS1;
      payload = {
        ruang: ruangS1,
        barang_rutin: S1_rutin,
        barang_tidak_rutin: S1_tidakRutin,
        barang_tidak_diperlukan: S1_tidakPerlu,
        foto_url: fotoS1
      };
    } else if (submenuId === 2) {
      if (!fotoS2) { showToast("Wajib mengunggah foto bukti pembersihan!", "error"); return; }
      payload = {
        barang_tidak_diperlukan_ref: S1_tidakPerluRefValue,
        recycle: S2_recycle,
        relocation: S2_relocation,
        dispose: S2_dispose,
        foto_url: fotoS2
      };
    } else if (submenuId === 3) {
      if (!fotoS3) { showToast("Wajib mengunggah foto ruangan terkini!", "error"); return; }
      area = ruangS3;
      payload = {
        ruang: ruangS3,
        checklist: checklistS3,
        foto_url: fotoS3
      };
    } else if (submenuId === 4) {
      if (!fotoS4) { showToast("Wajib mengunggah foto potensi bahaya!", "error"); return; }
      payload = {
        bahaya_rumah: bahayaRumahS4.map((row) => ({
          ...row,
          skor: row.frekuensi * row.dampak,
          risiko: (row.frekuensi * row.dampak) >= 10 ? "Resiko Tinggi" : (row.frekuensi * row.dampak) >= 5 ? "Resiko Sedang" : "Resiko Rendah"
        })),
        bahaya_sekolah: bahayaSekolahS4.map((row) => ({
          ...row,
          skor: row.frekuensi * row.dampak,
          risiko: (row.frekuensi * row.dampak) >= 10 ? "Resiko Tinggi" : (row.frekuensi * row.dampak) >= 5 ? "Resiko Sedang" : "Resiko Rendah"
        })),
        foto_url: fotoS4
      };
    } else if (submenuId === 5) {
      if (!fotoS5) { showToast("Wajib mengunggah foto bukti pemborosan!", "error"); return; }
      payload = {
        pemborosan_sekolah: wasteSekolahS5,
        pemborosan_rumah: wasteRumahS5,
        foto_url: fotoS5
      };
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/tugas-praktek/${submenuId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tanggal: new Date().toISOString().slice(0, 10),
          area_pengisian: area || "Observasi",
          keterangan: `Submisi Tugas Praktik Submenu ${submenuId}`,
          detail_jawaban: payload
        })
      });

      if (res.ok) {
        showToast("Tugas berhasil dikirim!", "success");
        await loadStatus();
      } else {
        const errorData = await res.json();
        showToast(errorData.message || "Kesalahan server", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Kesalahan jaringan saat mengirim tugas.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getTabStatusLabel = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    const hasSubmisi = task?.submisi && task.submisi.length > 0;
    if (hasSubmisi) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
          <CheckCircle size={10} /> Selesai
        </span>
      );
    }
    const idx = tasks.findIndex((t) => t.id === id);
    const locked = idx > 0 && !(tasks[idx - 1]?.submisi && tasks[idx - 1].submisi.length > 0);
    if (locked) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400">
          <Lock size={10} /> Terkunci
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
        <Unlock size={10} /> Terbuka
      </span>
    );
  };

  const isTabLocked = (id: number) => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === 0) return false;
    return idx > 0 && !(tasks[idx - 1]?.submisi && tasks[idx - 1].submisi.length > 0);
  };

  const getSubmisiData = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    return task?.submisi?.[0] || null;
  };

  const renderGradeInfo = (submisi: Submisi) => {
    if (submisi.nilai === null) {
      return (
        <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-4 flex items-center gap-3">
          <Info size={18} className="text-neutral-400" />
          <div className="text-xs text-neutral-600">
            <span className="font-bold block text-neutral-800">Menunggu Penilaian</span>
            Tugas Anda telah berhasil dikirim dan sedang menunggu koreksi & feedback dari Guru.
          </div>
        </div>
      );
    }
    return (
      <div className="bg-success/5 rounded-2xl border border-success/10 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Hasil Evaluasi Guru</h4>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Nilai Tugas</span>
            <span className="text-lg font-black text-success">{submisi.nilai} / 100</span>
          </div>
        </div>
        {submisi.catatan_guru && (
          <div className="text-xs text-neutral-600 border-t border-success/10 pt-2.5">
            <span className="font-bold text-neutral-800 block mb-1">Catatan Guru:</span>
            "{submisi.catatan_guru}"
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Tugas Praktik</h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">
          Kumpulkan implementasi nyata kurikulum Budaya Kaizen di sekolah dan rumah secara bertahap.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3.5fr] gap-6 items-start">
          {/* Sidebar Menu Tahapan */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-4 space-y-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible shrink-0 gap-2 lg:gap-0">
            {[
              { id: 1, label: "1. Ringkas 1 - Memilah" },
              { id: 2, label: "2. Ringkas 2 - Memilah" },
              { id: 3, label: "3. Checklist 5R" },
              { id: 4, label: "4. Potensi Bahaya" },
              { id: 5, label: "5. Mencari Pemborosan" }
            ].map((tab) => {
              const locked = isTabLocked(tab.id);
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  disabled={locked && activeTab !== tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl transition text-xs font-bold whitespace-nowrap lg:whitespace-normal group ${
                    active 
                      ? "bg-primary text-white" 
                      : locked 
                        ? "opacity-40 cursor-not-allowed bg-neutral-50 text-neutral-400" 
                        : "hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="ml-2 flex-shrink-0">
                    {getTabStatusLabel(tab.id)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-6">
            {/* SUBMENU 1: RINGKAS 1 - MEMILAH */}
            {activeTab === 1 && (
              <div className="space-y-5">
                <div className="border-b pb-3">
                  <h2 className="text-lg font-bold text-neutral-900">Ringkas 1: Memilah Barang</h2>
                  <p className="text-neutral-400 text-xs mt-1">Identifikasi barang-barang di sekitar area terpilih dan klasifikasikan kegunaannya.</p>
                </div>

                {(() => {
                  const submisi = getSubmisiData(1);
                  if (submisi) {
                    const answers = submisi.detail_jawaban || {};
                    return (
                      <div className="space-y-4">
                        {renderGradeInfo(submisi)}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">Lokasi/Ruang</span>
                              <p className="text-sm font-bold text-neutral-800">{answers.ruang}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">Barang diperlukan & rutin dipakai</span>
                              <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border mt-1 whitespace-pre-wrap">{answers.barang_rutin}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">Barang diperlukan & tidak rutin dipakai</span>
                              <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border mt-1 whitespace-pre-wrap">{answers.barang_tidak_rutin}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">Barang tidak diperlukan</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {Array.isArray(answers.barang_tidak_diperlukan) ? (
                                  answers.barang_tidak_diperlukan.map((tag: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center text-xs font-semibold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full border">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border w-full whitespace-pre-wrap">{answers.barang_tidak_diperlukan || "-"}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Foto Kondisi Awal</span>
                            {answers.foto_url ? (
                              <img src={answers.foto_url} alt="Kondisi Awal" className="rounded-2xl max-h-64 object-cover border w-full" />
                            ) : (
                              <p className="text-xs text-neutral-400">Tidak ada foto</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-600">Pilih Ruangan Observasi</label>
                            <select 
                              value={ruangS1} 
                              onChange={(e) => setRuangS1(e.target.value)}
                              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                              {RUANG_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-600">Barang yang diperlukan & rutin dipakai</label>
                            <textarea 
                              value={S1_rutin}
                              onChange={(e) => setS1_rutin(e.target.value)}
                              rows={3}
                              maxLength={1000}
                              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="Tuliskan barang yang selalu/rutin digunakan..."
                            />
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-neutral-400">Maksimal 1.000 karakter</span>
                              <span className={`text-[10px] font-bold ${S1_rutin.length >= 900 ? "text-red-500 font-extrabold" : "text-neutral-400"}`}>
                                {S1_rutin.length} / 1000 karakter
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-600">Barang yang diperlukan & tidak rutin dipakai</label>
                            <textarea 
                              value={S1_tidakRutin}
                              onChange={(e) => setS1_tidakRutin(e.target.value)}
                              rows={3}
                              maxLength={1000}
                              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="Tuliskan barang yang jarang digunakan..."
                            />
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-neutral-400">Maksimal 1.000 karakter</span>
                              <span className={`text-[10px] font-bold ${S1_tidakRutin.length >= 900 ? "text-red-500 font-extrabold" : "text-neutral-400"}`}>
                                {S1_tidakRutin.length} / 1000 karakter
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-600">Barang yang tidak diperlukan</label>
                            <div className="border rounded-xl p-2.5 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-primary/20 bg-white min-h-[90px]">
                              {S1_tidakPerlu.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full border">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setS1_tidakPerlu((prev) => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="text-neutral-400 hover:text-neutral-600 focus:outline-none font-bold text-xs"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                value={S1_tidakPerluInput}
                                onChange={(e) => setS1_tidakPerluInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();
                                    const val = S1_tidakPerluInput.trim().replace(/,$/, "");
                                    if (val && !S1_tidakPerlu.includes(val)) {
                                      const newTags = [...S1_tidakPerlu, val];
                                      if (newTags.join(", ").length <= 1000) {
                                        setS1_tidakPerlu(newTags);
                                        setS1_tidakPerluInput("");
                                      } else {
                                        showToast("Total karakter tag melebihi 1000!", "error");
                                      }
                                    }
                                  }
                                }}
                                className="flex-1 min-w-[120px] text-sm focus:outline-none border-none p-0.5"
                                placeholder="Ketik nama barang lalu tekan Enter / Koma..."
                              />
                            </div>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-neutral-400">Tekan Enter atau tanda koma (,) untuk menambahkan tag</span>
                              <span className={`text-[10px] font-bold ${S1_tidakPerlu.join(", ").length >= 900 ? "text-red-500 font-extrabold" : "text-neutral-400"}`}>
                                {S1_tidakPerlu.join(", ").length} / 1000 karakter
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Media Upload */}
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 text-center min-h-[300px]">
                          {fotoS1 ? (
                            <div className="space-y-3 w-full">
                              <img src={fotoS1} alt="Kondisi Awal" className="rounded-2xl max-h-52 object-cover border mx-auto" />
                              <button 
                                onClick={() => setFotoS1("")}
                                className="text-xs font-bold text-danger hover:underline"
                              >
                                Ganti Foto
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Camera className="mx-auto text-neutral-400" size={32} />
                              <div>
                                <span className="font-bold text-sm text-neutral-700 block">Dokumentasi Awal</span>
                                <span className="text-xs text-neutral-400 block mt-1">Unggah foto kondisi ruangan sebelum dirapikan</span>
                              </div>
                              <label className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-4 py-2.5 text-xs font-bold cursor-pointer transition shadow-sm">
                                <Upload size={14} />
                                {uploadingS1 ? "Mengunggah..." : "Pilih File"}
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingS1}
                                  onChange={(e) => handlePhotoChange(e, 1)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <button
                          disabled={submitting || !S1_rutin.trim() || !fotoS1}
                          onClick={() => handleFormSubmit(1)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-5 py-2.5 text-xs font-bold transition shadow-sm disabled:opacity-50"
                        >
                          {submitting ? "Mengirim..." : "Kumpulkan"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUBMENU 2: RINGKAS 2 - MEMILAH */}
            {activeTab === 2 && (
              <div className="space-y-5">
                <div className="border-b pb-3">
                  <h2 className="text-lg font-bold text-neutral-900">Ringkas 2: Tindakan Pemilahan</h2>
                  <p className="text-neutral-400 text-xs mt-1">Lakukan aksi nyata pembersihan terhadap barang-barang yang tidak diperlukan.</p>
                </div>

                {(() => {
                  const submisi = getSubmisiData(2);
                  if (submisi) {
                    const answers = submisi.detail_jawaban || {};
                    return (
                      <div className="space-y-4">
                        {renderGradeInfo(submisi)}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">Referensi Barang tidak diperlukan (S1)</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {Array.isArray(answers.barang_tidak_diperlukan_ref) ? (
                                  answers.barang_tidak_diperlukan_ref.map((tag: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center text-xs font-semibold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full border">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-sm text-neutral-500 bg-neutral-50 p-2 rounded-xl border mt-1 italic">{answers.barang_tidak_diperlukan_ref || "Tidak ada"}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">Recycle (Daur Ulang)</span>
                              <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border mt-1 whitespace-pre-wrap">{answers.recycle}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">Relocation (Pindah ke area khusus)</span>
                              <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border mt-1 whitespace-pre-wrap">{answers.relocation}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">Dispose (Buang)</span>
                              <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border mt-1 whitespace-pre-wrap">{answers.dispose}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Foto Bukti Pembersihan</span>
                            {answers.foto_url ? (
                              <img src={answers.foto_url} alt="Pemilahan" className="rounded-2xl max-h-64 object-cover border w-full" />
                            ) : (
                              <p className="text-xs text-neutral-400">Tidak ada foto</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Read-only reference from S1 */}
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase block">
                          Daftar Barang Tidak Diperlukan (Dari Tahap 1) - Klik Barang untuk Memilah Otomatis
                        </span>
                        
                        <div className="flex flex-wrap gap-2">
                          {S1_tidakPerluRefValue.length > 0 ? (
                            S1_tidakPerluRefValue.map((item, idx) => {
                              const assignment = pillAssignments[item];
                              const isSelected = activePill === item;
                              
                              return (
                                <div key={idx} className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setActivePill(isSelected ? null : item)}
                                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition cursor-pointer ${
                                      assignment === "recycle"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : assignment === "relocation"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : assignment === "dispose"
                                            ? "bg-orange-50 text-orange-700 border-orange-200"
                                            : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                                    }`}
                                  >
                                    {assignment && (
                                      <CheckCircle size={12} className="shrink-0" />
                                    )}
                                    <span>{item}</span>
                                    {assignment && (
                                      <span className="text-[9px] opacity-75 uppercase">
                                        ({assignment === "recycle" ? "Recycle" : assignment === "relocation" ? "Relocate" : "Dispose"})
                                      </span>
                                    )}
                                  </button>

                                  {/* Popover Action Menu */}
                                  {isSelected && (
                                    <div className="absolute left-0 mt-2 z-30 bg-white border border-neutral-100 rounded-xl shadow-xl p-2.5 flex items-center gap-1.5 whitespace-nowrap min-w-[280px]">
                                      <span className="text-[10px] font-bold text-neutral-400 mr-1">Aksi:</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setS2_recycle((prev) => {
                                            const line = `- ${item}: `;
                                            if (prev.includes(line)) return prev;
                                            return prev ? `${prev}\n${line}` : line;
                                          });
                                          setPillAssignments((prev) => ({ ...prev, [item]: "recycle" }));
                                          setActivePill(null);
                                        }}
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-1 rounded-lg border border-emerald-100 transition"
                                      >
                                        Recycle
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setS2_relocation((prev) => {
                                            const line = `- ${item}: `;
                                            if (prev.includes(line)) return prev;
                                            return prev ? `${prev}\n${line}` : line;
                                          });
                                          setPillAssignments((prev) => ({ ...prev, [item]: "relocation" }));
                                          setActivePill(null);
                                        }}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-1 rounded-lg border border-blue-100 transition"
                                      >
                                        Relocate
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setS2_dispose((prev) => {
                                            const line = `- ${item}: `;
                                            if (prev.includes(line)) return prev;
                                            return prev ? `${prev}\n${line}` : line;
                                          });
                                          setPillAssignments((prev) => ({ ...prev, [item]: "dispose" }));
                                          setActivePill(null);
                                        }}
                                        className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2 py-1 rounded-lg border border-orange-100 transition"
                                      >
                                        Dispose
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setActivePill(null)}
                                        className="text-neutral-400 hover:text-neutral-600 font-bold text-xs px-1"
                                      >
                                        &times;
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-neutral-400 italic">Tidak ada barang yang perlu dipilah (selesaikan Tahap 1 terlebih dahulu)</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-600">Recycle (Daur Ulang)</label>
                            <textarea 
                              value={S2_recycle}
                              onChange={(e) => setS2_recycle(e.target.value)}
                              rows={3}
                              maxLength={1000}
                              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="Jelaskan barang apa yang didaur ulang & bagaimana..."
                            />
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-neutral-400">Maksimal 1.000 karakter</span>
                              <span className={`text-[10px] font-bold ${S2_recycle.length >= 900 ? "text-red-500 font-extrabold" : "text-neutral-400"}`}>
                                {S2_recycle.length} / 1000 karakter
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-600">Relocation (Memindahkan ke area khusus)</label>
                            <textarea 
                              value={S2_relocation}
                              onChange={(e) => setS2_relocation(e.target.value)}
                              rows={3}
                              maxLength={1000}
                              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="Jelaskan barang apa saja yang dipindahkan dan ke mana lokasi pemindahannya..."
                            />
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-neutral-400">Maksimal 1.000 karakter</span>
                              <span className={`text-[10px] font-bold ${S2_relocation.length >= 900 ? "text-red-500 font-extrabold" : "text-neutral-400"}`}>
                                {S2_relocation.length} / 1000 karakter
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-neutral-600">Dispose (Buang)</label>
                            <textarea 
                              value={S2_dispose}
                              onChange={(e) => setS2_dispose(e.target.value)}
                              rows={3}
                              maxLength={1000}
                              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="Tuliskan barang yang langsung dibuang ke tempat sampah..."
                            />
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-neutral-400">Maksimal 1.000 karakter</span>
                              <span className={`text-[10px] font-bold ${S2_dispose.length >= 900 ? "text-red-500 font-extrabold" : "text-neutral-400"}`}>
                                {S2_dispose.length} / 1000 karakter
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Media Upload */}
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 text-center min-h-[300px]">
                          {fotoS2 ? (
                            <div className="space-y-3 w-full">
                              <img src={fotoS2} alt="Bukti Pembersihan" className="rounded-2xl max-h-52 object-cover border mx-auto" />
                              <button 
                                onClick={() => setFotoS2("")}
                                className="text-xs font-bold text-danger hover:underline"
                              >
                                Ganti Foto
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Camera className="mx-auto text-neutral-400" size={32} />
                              <div>
                                <span className="font-bold text-sm text-neutral-700 block">Bukti Aksi</span>
                                <span className="text-xs text-neutral-400 block mt-1">Unggah foto saat melakukan pembersihan / pemilahan</span>
                              </div>
                              <label className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-4 py-2.5 text-xs font-bold cursor-pointer transition shadow-sm">
                                <Upload size={14} />
                                {uploadingS2 ? "Mengunggah..." : "Pilih File"}
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingS2}
                                  onChange={(e) => handlePhotoChange(e, 2)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <button
                          disabled={submitting || !fotoS2}
                          onClick={() => handleFormSubmit(2)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-5 py-2.5 text-xs font-bold transition shadow-sm disabled:opacity-50"
                        >
                          {submitting ? "Mengirim..." : "Kumpulkan"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUBMENU 3: CHECKLIST 5R */}
            {activeTab === 3 && (
              <div className="space-y-5">
                <div className="border-b pb-3">
                  <h2 className="text-lg font-bold text-neutral-900">Checklist Evaluasi 5R</h2>
                  <p className="text-neutral-400 text-xs mt-1">Lakukan audit mandiri kondisi 5R pada ruangan sekolah.</p>
                </div>

                {/* Scoring Warning Banner */}
                {s3HasNotOk && (
                  <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-start gap-3 text-danger">
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                    <div className="text-xs leading-5">
                      <span className="font-bold block">Ruangan Anda Belum Memenuhi Standar 5R Mutlak!</span>
                      Masih terdapat temuan (ADA) ketidaksesuaian standard kebersihan dan kerapian. Segera lakukan tindakan perbaikan di ruangan tersebut.
                    </div>
                  </div>
                )}

                {(() => {
                  const submisi = getSubmisiData(3);
                  if (submisi) {
                    const answers = submisi.detail_jawaban || {};
                    const listCheck = answers.checklist || {};
                    return (
                      <div className="space-y-5">
                        {renderGradeInfo(submisi)}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase">Lokasi Ruang Audit</span>
                            <p className="text-sm font-bold text-neutral-800 mt-0.5">{answers.ruang}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Foto Bukti Terkini</span>
                            {answers.foto_url && (
                              <img src={answers.foto_url} alt="Terkini" className="rounded-2xl max-h-52 object-cover border" />
                            )}
                          </div>
                        </div>

                        {/* Render Checklist audit results */}
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Hasil Audit Indikator</h4>
                          <div className="space-y-3">
                            {Object.entries(CHECKLIST_ITEMS).map(([groupKey, items]) => (
                              <div key={groupKey} className="border rounded-2xl p-4 space-y-3 bg-neutral-50/20">
                                <h5 className="text-xs font-black uppercase text-primary tracking-widest">{groupKey}</h5>
                                <div className="divide-y text-xs space-y-2">
                                  {items.map((item) => {
                                    const record = listCheck[item.key] || { status: "TIDAK ADA", catatan: "" };
                                    return (
                                      <div key={item.key} className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <p className="font-semibold text-neutral-800">{item.label}</p>
                                          {record.catatan && (
                                            <p className="text-neutral-500 italic mt-0.5">Catatan: {record.catatan}</p>
                                          )}
                                        </div>
                                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${
                                          record.status === "ADA" 
                                            ? "bg-danger/10 text-danger border-danger/10" 
                                            : "bg-success/10 text-success border-success/10"
                                        }`}>
                                          {record.status === "ADA" ? "ADA (NOT OK)" : "TIDAK ADA (OK)"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-neutral-600">Pilih Ruangan Audit</label>
                        <select 
                          value={ruangS3} 
                          onChange={(e) => setRuangS3(e.target.value)}
                          className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-xs"
                        >
                          {RUANG_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      {/* Interactive Checklist Form */}
                      <div className="space-y-5">
                        {Object.entries(CHECKLIST_ITEMS).map(([groupKey, items]) => (
                          <div key={groupKey} className="border rounded-2xl p-4 bg-white space-y-4">
                            <h4 className="text-sm font-bold uppercase text-primary tracking-widest">{groupKey}</h4>
                            <div className="space-y-4 divide-y">
                              {items.map((item) => {
                                const current = checklistS3[item.key] || { status: "TIDAK ADA", catatan: "" };
                                return (
                                  <div key={item.key} className="pt-4 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                                    <div className="flex-1">
                                      <p className="text-xs font-bold text-neutral-800 leading-relaxed">{item.label}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                      <select
                                        value={current.status}
                                        onChange={(e) => {
                                          setChecklistS3((prev) => ({
                                            ...prev,
                                            [item.key]: { ...prev[item.key], status: e.target.value as any }
                                          }));
                                        }}
                                        className="border rounded-lg text-xs font-semibold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      >
                                        <option value="TIDAK ADA">TIDAK ADA (OK)</option>
                                        <option value="ADA">ADA (NOT OK)</option>
                                      </select>
                                      <input
                                        type="text"
                                        placeholder="Tuliskan temuan/catatan jika ADA..."
                                        value={current.catatan}
                                        onChange={(e) => {
                                          setChecklistS3((prev) => ({
                                            ...prev,
                                            [item.key]: { ...prev[item.key], catatan: e.target.value }
                                          }));
                                        }}
                                        className="border rounded-lg px-2.5 py-1.5 text-xs flex-1 md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Image Upload S3 */}
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 text-center min-h-[150px]">
                        {fotoS3 ? (
                          <div className="space-y-2 w-full">
                            <img src={fotoS3} alt="Terkini" className="rounded-2xl max-h-48 object-cover border mx-auto" />
                            <button onClick={() => setFotoS3("")} className="text-xs font-bold text-danger hover:underline">Ganti Foto</button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Camera className="mx-auto text-neutral-400" size={24} />
                            <span className="font-bold text-xs text-neutral-700 block">Foto Ruangan Terkini</span>
                            <label className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-3 py-2 text-xs font-bold cursor-pointer transition shadow-sm mt-1">
                              <Upload size={12} /> {uploadingS3 ? "Mengunggah..." : "Pilih File"}
                              <input type="file" accept="image/*" className="hidden" disabled={uploadingS3} onChange={(e) => handlePhotoChange(e, 3)} />
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <button
                          disabled={submitting || !fotoS3}
                          onClick={() => handleFormSubmit(3)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-5 py-2.5 text-xs font-bold transition shadow-sm"
                        >
                          {submitting ? "Mengirim..." : "Kumpulkan"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUBMENU 4: DETEKSI POTENSI BAHAYA DI SEKITAR */}
            {activeTab === 4 && (
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="text-lg font-bold text-neutral-900">Deteksi Potensi Bahaya (STOP 6)</h2>
                  <p className="text-neutral-400 text-xs mt-1">Gunakan panduan infografis di bawah untuk mengidentifikasi 6 kategori potensi bahaya di sekolah dan rumah.</p>
                </div>

                {/* STOP 6 Infografis CSS/SVG */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Infografis Panduan STOP 6 Bahaya</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {[
                      { key: "APARATUS", title: "Aparatus", desc: "Mesin berputar, tajam, gerak", color: "bg-red-500" },
                      { key: "BIG HEAVY", title: "Big Heavy", desc: "Tertimpa beban berat/roboh", color: "bg-orange-500" },
                      { key: "CAR", title: "Car / Vehicle", desc: "Bahaya berkendara / lalu-lintas", color: "bg-yellow-500 text-neutral-900" },
                      { key: "DROP FALL", title: "Drop Fall", desc: "Terjatuh dari ketinggian / terpeleset", color: "bg-green-500" },
                      { key: "ELECTRICITY", title: "Electricity", desc: "Sengatan listrik / korsleting", color: "bg-blue-500" },
                      { key: "FIRE", title: "Fire / Heat", desc: "Kebakaran, gas meledak, panas", color: "bg-purple-500" }
                    ].map((item) => (
                      <div key={item.key} className="bg-white rounded-xl border p-2 text-center flex flex-col items-center justify-between">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${item.color}`}>{item.key}</span>
                        <h4 className="text-[10px] font-bold text-neutral-800 mt-1">{item.title}</h4>
                        <p className="text-[9px] text-neutral-400 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {(() => {
                  const submisi = getSubmisiData(4);
                  if (submisi) {
                    const answers = submisi.detail_jawaban || {};
                    const listRumah = answers.bahaya_rumah || [];
                    const listSekolah = answers.bahaya_sekolah || [];
                    return (
                      <div className="space-y-6">
                        {renderGradeInfo(submisi)}

                        <div className="grid grid-cols-1 gap-4">
                          {/* Rumah Display */}
                          <div className="border rounded-2xl p-4 space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 uppercase">Potensi Bahaya: Rumah / Diperjalanan</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-neutral-50 text-neutral-400 font-bold uppercase text-[9px] border-b">
                                    <th className="py-2 px-1 w-8">No</th>
                                    <th className="py-2 px-1">Temuan</th>
                                    <th className="py-2 px-1">Kategori</th>
                                    <th className="py-2 px-1 text-center">F x K</th>
                                    <th className="py-2 px-1">Tingkat Risiko</th>
                                    <th className="py-2 px-1">Penyebab</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {listRumah.map((row: any, i: number) => (
                                    <tr key={i} className="border-b">
                                      <td className="py-2 px-1 font-bold">{i + 1}</td>
                                      <td className="py-2 px-1 whitespace-pre-wrap">{row.temuan || "-"}</td>
                                      <td className="py-2 px-1"><span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{row.kategori}</span></td>
                                      <td className="py-2 px-1 text-center font-bold">{row.frekuensi} x {row.dampak} = {row.skor}</td>
                                      <td className="py-2 px-1">
                                        <span className={`font-bold ${
                                          row.skor >= 10 ? "text-danger" : row.skor >= 5 ? "text-warning" : "text-success"
                                        }`}>{row.risiko}</span>
                                      </td>
                                      <td className="py-2 px-1 whitespace-pre-wrap">{row.penyebab || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Sekolah Display */}
                          <div className="border rounded-2xl p-4 space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 uppercase">Potensi Bahaya: Aktivitas di Sekolah</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-neutral-50 text-neutral-400 font-bold uppercase text-[9px] border-b">
                                    <th className="py-2 px-1 w-8">No</th>
                                    <th className="py-2 px-1">Temuan</th>
                                    <th className="py-2 px-1">Kategori</th>
                                    <th className="py-2 px-1 text-center">F x K</th>
                                    <th className="py-2 px-1">Tingkat Risiko</th>
                                    <th className="py-2 px-1">Penyebab</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {listSekolah.map((row: any, i: number) => (
                                    <tr key={i} className="border-b">
                                      <td className="py-2 px-1 font-bold">{i + 1}</td>
                                      <td className="py-2 px-1 whitespace-pre-wrap">{row.temuan || "-"}</td>
                                      <td className="py-2 px-1"><span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{row.kategori}</span></td>
                                      <td className="py-2 px-1 text-center font-bold">{row.frekuensi} x {row.dampak} = {row.skor}</td>
                                      <td className="py-2 px-1">
                                        <span className={`font-bold ${
                                          row.skor >= 10 ? "text-danger" : row.skor >= 5 ? "text-warning" : "text-success"
                                        }`}>{row.risiko}</span>
                                      </td>
                                      <td className="py-2 px-1 whitespace-pre-wrap">{row.penyebab || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Foto */}
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Bukti Foto Global</span>
                            {answers.foto_url && (
                              <img src={answers.foto_url} alt="Bahaya Global" className="rounded-2xl max-h-52 object-cover border" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const KATEGORI_BAHAYA = ["APARATUS", "BIG HEAVY", "CAR", "DROP FALL", "ELECTRICITY", "FIRE"];

                  const renderFormTable = (list: any[], setList: any) => {
                    const updateRow = (idx: number, field: string, val: any) => {
                      const copy = [...list];
                      copy[idx] = { ...copy[idx], [field]: val };
                      setList(copy);
                    };

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[9px] border-b">
                              <th className="py-2 px-1 w-8">No</th>
                              <th className="py-2 px-1">Deskripsi Temuan (Esai)</th>
                              <th className="py-2 px-1 w-28">Kategori</th>
                              <th className="py-2 px-1 w-16 text-center">F</th>
                              <th className="py-2 px-1 w-16 text-center">K</th>
                              <th className="py-2 px-1 w-20 text-center">Skor (Risiko)</th>
                              <th className="py-2 px-1">Penyebab</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((row, i) => {
                              const score = row.frekuensi * row.dampak;
                              let label = "Risiko Rendah";
                              let color = "text-success";
                              if (score >= 10) { label = "Risiko Tinggi"; color = "text-danger"; }
                              else if (score >= 5) { label = "Risiko Sedang"; color = "text-warning"; }

                              return (
                                <tr key={i} className="border-b">
                                  <td className="py-2 px-1 font-bold">{i + 1}</td>
                                  <td className="py-1 px-1">
                                    <input 
                                      type="text" 
                                      value={row.temuan}
                                      onChange={(e) => updateRow(i, "temuan", e.target.value)}
                                      className="border rounded px-2 py-1 w-full text-xs" 
                                      placeholder="Contoh: Kabel terkelupas di lantai"
                                    />
                                  </td>
                                  <td className="py-1 px-1">
                                    <select
                                      value={row.kategori}
                                      onChange={(e) => updateRow(i, "kategori", e.target.value)}
                                      className="border rounded px-1.5 py-1 w-full text-xs"
                                    >
                                      {KATEGORI_BAHAYA.map((kb) => <option key={kb} value={kb}>{kb}</option>)}
                                    </select>
                                  </td>
                                  <td className="py-1 px-1">
                                    <select
                                      value={row.frekuensi}
                                      onChange={(e) => updateRow(i, "frekuensi", parseInt(e.target.value))}
                                      className="border rounded px-1 py-1 w-full text-xs text-center"
                                    >
                                      <option value="5">Tinggi (5)</option>
                                      <option value="4">Sedang (4)</option>
                                      <option value="3">Rendah (3)</option>
                                      <option value="2">Sgt Rendah (2)</option>
                                      <option value="1">Hampir Tidak (1)</option>
                                    </select>
                                  </td>
                                  <td className="py-1 px-1">
                                    <select
                                      value={row.dampak}
                                      onChange={(e) => updateRow(i, "dampak", parseInt(e.target.value))}
                                      className="border rounded px-1 py-1 w-full text-xs text-center"
                                    >
                                      <option value="3">Fatal (3)</option>
                                      <option value="2">Sedang (2)</option>
                                      <option value="1">Ringan (1)</option>
                                    </select>
                                  </td>
                                  <td className={`py-1 px-1 text-center font-bold ${color}`}>
                                    {score} ({label})
                                  </td>
                                  <td className="py-1 px-1">
                                    <input 
                                      type="text" 
                                      value={row.penyebab}
                                      onChange={(e) => updateRow(i, "penyebab", e.target.value)}
                                      className="border rounded px-2 py-1 w-full text-xs" 
                                      placeholder="Contoh: Gesekan pintu / umur kabel"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-5">
                      {/* Form 1: Rumah */}
                      <div className="border rounded-2xl p-4 bg-white space-y-3">
                        <h4 className="text-xs font-bold text-neutral-800 uppercase">Potensi Bahaya: Rumah / Diperjalanan (Wajib 5 baris)</h4>
                        {renderFormTable(bahayaRumahS4, setBahayaRumahS4)}
                      </div>

                      {/* Form 2: Sekolah */}
                      <div className="border rounded-2xl p-4 bg-white space-y-3">
                        <h4 className="text-xs font-bold text-neutral-800 uppercase">Potensi Bahaya: Aktivitas di Sekolah (Wajib 5 baris)</h4>
                        {renderFormTable(bahayaSekolahS4, setBahayaSekolahS4)}
                      </div>

                      {/* Photo upload S4 */}
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 text-center min-h-[150px]">
                        {fotoS4 ? (
                          <div className="space-y-2 w-full">
                            <img src={fotoS4} alt="Potensi Bahaya Global" className="rounded-2xl max-h-48 object-cover border mx-auto" />
                            <button onClick={() => setFotoS4("")} className="text-xs font-bold text-danger hover:underline">Ganti Foto</button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Camera className="mx-auto text-neutral-400" size={24} />
                            <span className="font-bold text-xs text-neutral-700 block">Foto Potensi Bahaya (Representatif)</span>
                            <label className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-3 py-2 text-xs font-bold cursor-pointer transition shadow-sm mt-1">
                              <Upload size={12} /> {uploadingS4 ? "Mengunggah..." : "Pilih File"}
                              <input type="file" accept="image/*" className="hidden" disabled={uploadingS4} onChange={(e) => handlePhotoChange(e, 4)} />
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <button
                          disabled={submitting || !fotoS4}
                          onClick={() => handleFormSubmit(4)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-5 py-2.5 text-xs font-bold transition shadow-sm"
                        >
                          {submitting ? "Mengirim..." : "Kumpulkan"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUBMENU 5: MENCARI PEMBOROSAN DI SEKITAR KITA */}
            {activeTab === 5 && (
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="text-lg font-bold text-neutral-900">Mencari Pemborosan (7 Waste)</h2>
                  <p className="text-neutral-400 text-xs mt-1">Identifikasi pemborosan di sekitar lingkungan Anda menggunakan panduan 7 jenis Waste di bawah.</p>
                </div>

                {/* Infografis 7 Waste CSS/SVG */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Info size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Panduan 7 Jenis Waste (Pemborosan)</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                    {[
                      { key: "MOTION", title: "Gerak Berlebihan", desc: "Gerakan fisik pekerja tidak perlu" },
                      { key: "TRANSPORT", title: "Mengangkut", desc: "Pemindahan material tak efisien" },
                      { key: "WAITING", title: "Menunggu", desc: "Waktu jeda antrian proses" },
                      { key: "OVERPROD", title: "Produksi Lebih", desc: "Membuat melampaui kuantitas target" },
                      { key: "INVENTORY", title: "Stok Berlebih", desc: "Stok menumpuk & menghabiskan ruang" },
                      { key: "PROCESS", title: "Proses Berlebih", desc: "Langkah pengerjaan berulang/tidak perlu" },
                      { key: "REWORK", title: "Perbaikan Ulang", desc: "Memperbaiki barang cacat / defect" }
                    ].map((w) => (
                      <div key={w.key} className="bg-white rounded-xl border p-2 text-center flex flex-col justify-between">
                        <span className="text-[8px] font-black uppercase text-primary tracking-widest">{w.key}</span>
                        <h4 className="text-[9px] font-bold text-neutral-800 mt-1">{w.title}</h4>
                        <p className="text-[8px] text-neutral-400 mt-0.5 leading-snug">{w.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {(() => {
                  const submisi = getSubmisiData(5);
                  if (submisi) {
                    const answers = submisi.detail_jawaban || {};
                    const listSekolah = answers.pemborosan_sekolah || [];
                    const listRumah = answers.pemborosan_rumah || [];
                    return (
                      <div className="space-y-6">
                        {renderGradeInfo(submisi)}

                        <div className="grid grid-cols-1 gap-4">
                          {/* Sekolah Display */}
                          <div className="border rounded-2xl p-4 space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 uppercase">Pemborosan: Di Sekolah</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-neutral-50 text-neutral-400 font-bold uppercase text-[9px] border-b">
                                    <th className="py-2 px-1 w-8">No</th>
                                    <th className="py-2 px-1">Deskripsi Temuan</th>
                                    <th className="py-2 px-1">Kategori Waste</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {listSekolah.map((row: any, i: number) => (
                                    <tr key={i} className="border-b">
                                      <td className="py-2 px-1 font-bold">{i + 1}</td>
                                      <td className="py-2 px-1 whitespace-pre-wrap">{row.temuan || "-"}</td>
                                      <td className="py-2 px-1"><span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{row.kategori}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Rumah Display */}
                          <div className="border rounded-2xl p-4 space-y-3">
                            <h4 className="text-xs font-bold text-neutral-800 uppercase">Pemborosan: Di Rumah / Tempat Lain</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="bg-neutral-50 text-neutral-400 font-bold uppercase text-[9px] border-b">
                                    <th className="py-2 px-1 w-8">No</th>
                                    <th className="py-2 px-1">Deskripsi Temuan</th>
                                    <th className="py-2 px-1">Kategori Waste</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {listRumah.map((row: any, i: number) => (
                                    <tr key={i} className="border-b">
                                      <td className="py-2 px-1 font-bold">{i + 1}</td>
                                      <td className="py-2 px-1 whitespace-pre-wrap">{row.temuan || "-"}</td>
                                      <td className="py-2 px-1"><span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{row.kategori}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Foto */}
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Bukti Foto Global</span>
                            {answers.foto_url && (
                              <img src={answers.foto_url} alt="Pemborosan Global" className="rounded-2xl max-h-52 object-cover border" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const KATEGORI_WASTE = [
                    "Gerak Berlebihan",
                    "Mengangkut",
                    "Menunggu",
                    "Produksi Berlebihan",
                    "Persediaan Berlebihan",
                    "Proses Berlebih",
                    "Perbaikan Ulang"
                  ];

                  const renderFormWaste = (list: any[], setList: any) => {
                    const updateRow = (idx: number, field: string, val: any) => {
                      const copy = [...list];
                      copy[idx] = { ...copy[idx], [field]: val };
                      setList(copy);
                    };

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[9px] border-b">
                              <th className="py-2 px-1 w-8">No</th>
                              <th className="py-2 px-1">Deskripsi Aktivitas Pemborosan (Esai)</th>
                              <th className="py-2 px-1 w-48">Kategori Waste</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((row, i) => (
                              <tr key={i} className="border-b">
                                <td className="py-2 px-1 font-bold">{i + 1}</td>
                                <td className="py-1 px-1">
                                  <input 
                                    type="text" 
                                    value={row.temuan}
                                    onChange={(e) => updateRow(i, "temuan", e.target.value)}
                                    className="border rounded px-2 py-1 w-full text-xs" 
                                    placeholder="Contoh: Antri lama saat mengumpulkan kertas"
                                  />
                                </td>
                                <td className="py-1 px-1">
                                  <select
                                    value={row.kategori}
                                    onChange={(e) => updateRow(i, "kategori", e.target.value)}
                                    className="border rounded px-1.5 py-1 w-full text-xs"
                                  >
                                    {KATEGORI_WASTE.map((kw) => <option key={kw} value={kw}>{kw}</option>)}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-5">
                      {/* Form 1: Sekolah */}
                      <div className="border rounded-2xl p-4 bg-white space-y-3">
                        <h4 className="text-xs font-bold text-neutral-800 uppercase">Pemborosan: Aktivitas di Sekolah (Wajib 5 baris)</h4>
                        {renderFormWaste(wasteSekolahS5, setWasteSekolahS5)}
                      </div>

                      {/* Form 2: Rumah */}
                      <div className="border rounded-2xl p-4 bg-white space-y-3">
                        <h4 className="text-xs font-bold text-neutral-800 uppercase">Pemborosan: Di Rumah / Tempat Lain (Wajib 5 baris)</h4>
                        {renderFormWaste(wasteRumahS5, setWasteRumahS5)}
                      </div>

                      {/* Photo upload S5 */}
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 text-center min-h-[150px]">
                        {fotoS5 ? (
                          <div className="space-y-2 w-full">
                            <img src={fotoS5} alt="Pemborosan Global" className="rounded-2xl max-h-48 object-cover border mx-auto" />
                            <button onClick={() => setFotoS5("")} className="text-xs font-bold text-danger hover:underline">Ganti Foto</button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Camera className="mx-auto text-neutral-400" size={24} />
                            <span className="font-bold text-xs text-neutral-700 block">Foto Bukti Pemborosan (Representatif)</span>
                            <label className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-3 py-2 text-xs font-bold cursor-pointer transition shadow-sm mt-1">
                              <Upload size={12} /> {uploadingS5 ? "Mengunggah..." : "Pilih File"}
                              <input type="file" accept="image/*" className="hidden" disabled={uploadingS5} onChange={(e) => handlePhotoChange(e, 5)} />
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <button
                          disabled={submitting || !fotoS5}
                          onClick={() => handleFormSubmit(5)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-5 py-2.5 text-xs font-bold transition shadow-sm"
                        >
                          {submitting ? "Mengirim..." : "Kumpulkan"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl shadow-2xl p-4 min-w-[300px] animate-toast-slide">
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(120%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            .animate-toast-slide {
              animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className={`p-2 rounded-xl ${toast.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-neutral-800 block">
              {toast.type === "success" ? "Sukses" : "Gagal"}
            </span>
            <p className="text-neutral-500 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
