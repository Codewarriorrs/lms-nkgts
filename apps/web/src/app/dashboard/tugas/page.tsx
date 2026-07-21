"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  Info,
  Wrench,
  Package,
  Car,
  ArrowDownCircle,
  Zap,
  Flame,
  Trash2,
  Plus,
  Activity,
  Truck,
  Clock,
  Copy,
  Archive,
  Cpu,
  RotateCcw
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

  const uploadPromises = useRef<Record<number, Promise<string> | null>>({});

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1200;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              "image/jpeg",
              0.7
            );
          } else {
            resolve(file);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Form states per Submenu
  const [ruangS1, setRuangS1] = useState("Ruang Kelas");
  const [S1_rutin, setS1_rutin] = useState("");
  const [S1_tidakRutin, setS1_tidakRutin] = useState("");
  const [S1_tidakPerlu, setS1_tidakPerlu] = useState<string[]>([""]);
  const [activePill, setActivePill] = useState<string | null>(null);
  const [pillAssignments, setPillAssignments] = useState<Record<string, "recycle" | "relocation" | "dispose">>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  const handleAddRow = () => {
    setS1_tidakPerlu((prev) => [...prev, ""]);
  };

  const handleDeleteRow = (index: number) => {
    setS1_tidakPerlu((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      return copy.length > 0 ? copy : [""];
    });
  };
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

  // Automatically synchronize item actions & notes to S2_recycle, S2_relocation, and S2_dispose
  useEffect(() => {
    const recycleLines: string[] = [];
    const relocationLines: string[] = [];
    const disposeLines: string[] = [];

    const cleanItems = S1_tidakPerluRefValue.filter(item => item && item.trim() !== "");

    cleanItems.forEach(item => {
      const assignment = pillAssignments[item];
      const note = itemNotes[item]?.trim() || "";
      if (assignment === "recycle") {
        recycleLines.push(`- ${item}${note ? `: ${note}` : ""}`);
      } else if (assignment === "relocation") {
        relocationLines.push(`- ${item}${note ? `: ${note}` : ""}`);
      } else if (assignment === "dispose") {
        disposeLines.push(`- ${item}${note ? `: ${note}` : ""}`);
      }
    });

    setS2_recycle(recycleLines.length > 0 ? recycleLines.join("\n") : "Tidak ada");
    setS2_relocation(relocationLines.length > 0 ? relocationLines.join("\n") : "Tidak ada");
    setS2_dispose(disposeLines.length > 0 ? disposeLines.join("\n") : "Tidak ada");
  }, [pillAssignments, itemNotes, S1_tidakPerluRefValue]);

  // Check if Checklist 5R has any "ADA" (NOT OK) items
  const s3HasNotOk = useMemo(() => {
    const activeSubmisi = tasks.find((t) => t.id === 3)?.submisi?.[0];
    const source = activeSubmisi?.detail_jawaban?.checklist || checklistS3;
    return Object.values(source).some((v: any) => v.status === "ADA");
  }, [tasks, checklistS3]);

  const s1IsValid = useMemo(() => {
    return (
      S1_rutin.trim().length > 0 &&
      S1_tidakRutin.trim().length > 0 &&
      S1_tidakPerlu.every((val) => val.trim().length > 0) &&
      fotoS1 !== ""
    );
  }, [S1_rutin, S1_tidakRutin, S1_tidakPerlu, fotoS1]);

  const s2IsValid = useMemo(() => {
    return (
      S2_recycle.trim().length > 0 &&
      S2_relocation.trim().length > 0 &&
      S2_dispose.trim().length > 0 &&
      fotoS2 !== ""
    );
  }, [S2_recycle, S2_relocation, S2_dispose, fotoS2]);

  const s3IsValid = useMemo(() => {
    if (!fotoS3) return false;
    return Object.values(checklistS3).every((item) => {
      if (item.status === "ADA") {
        return item.catatan.trim().length > 0;
      }
      return true;
    });
  }, [fotoS3, checklistS3]);

  const s4IsValid = useMemo(() => {
    if (!fotoS4) return false;
    const rumahValid = bahayaRumahS4.every((row) => row.temuan.trim().length > 0 && row.penyebab.trim().length > 0);
    const sekolahValid = bahayaSekolahS4.every((row) => row.temuan.trim().length > 0 && row.penyebab.trim().length > 0);
    return rumahValid && sekolahValid;
  }, [fotoS4, bahayaRumahS4, bahayaSekolahS4]);

  const s5IsValid = useMemo(() => {
    if (!fotoS5) return false;
    const sekolahValid = wasteSekolahS5.every((row) => row.temuan.trim().length > 0);
    const rumahValid = wasteRumahS5.every((row) => row.temuan.trim().length > 0);
    return sekolahValid && rumahValid;
  }, [fotoS5, wasteSekolahS5, wasteRumahS5]);

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

    if (file.size > 10 * 1024 * 1024) {
      showToast("Ukuran file terlalu besar! Maksimal 10MB.", "error");
      return;
    }

    const uploadFn = async () => {
      const compressedFile = await compressImage(file);
      const url = await uploadFileOrBase64(compressedFile, `tugas-praktek-s${submenuId}`);
      if (!url) {
        throw new Error("Gagal mengunggah foto.");
      }
      return url;
    };

    const promise = uploadFn();
    uploadPromises.current[submenuId] = promise;

    try {
      if (submenuId === 1) { setUploadingS1(true); }
      else if (submenuId === 2) { setUploadingS2(true); }
      else if (submenuId === 3) { setUploadingS3(true); }
      else if (submenuId === 4) { setUploadingS4(true); }
      else if (submenuId === 5) { setUploadingS5(true); }

      const url = await promise;
      if (submenuId === 1) { setFotoS1(url); }
      else if (submenuId === 2) { setFotoS2(url); }
      else if (submenuId === 3) { setFotoS3(url); }
      else if (submenuId === 4) { setFotoS4(url); }
      else if (submenuId === 5) { setFotoS5(url); }
    } catch (error) {
      showToast("Gagal mengunggah foto.", "error");
    } finally {
      if (submenuId === 1) { setUploadingS1(false); }
      else if (submenuId === 2) { setUploadingS2(false); }
      else if (submenuId === 3) { setUploadingS3(false); }
      else if (submenuId === 4) { setUploadingS4(false); }
      else if (submenuId === 5) { setUploadingS5(false); }
      uploadPromises.current[submenuId] = null;
    }
  };

  // Handle Form Submission
  const handleFormSubmit = async (submenuId: number) => {
    if (!token) return;

    try {
      setSubmitting(true);

      let finalFotoUrl = "";
      if (submenuId === 1) finalFotoUrl = fotoS1;
      else if (submenuId === 2) finalFotoUrl = fotoS2;
      else if (submenuId === 3) finalFotoUrl = fotoS3;
      else if (submenuId === 4) finalFotoUrl = fotoS4;
      else if (submenuId === 5) finalFotoUrl = fotoS5;

      const activeUploadPromise = uploadPromises.current[submenuId];
      if (activeUploadPromise) {
        try {
          showToast("Sedang mengompresi dan mengunggah foto...", "success");
          finalFotoUrl = await activeUploadPromise;
        } catch (err) {
          showToast("Gagal mengunggah foto.", "error");
          setSubmitting(false);
          return;
        }
      }

      if (!finalFotoUrl) {
        showToast("Wajib mengunggah foto dokumentasi terlebih dahulu!", "error");
        setSubmitting(false);
        return;
      }

      let payload: any = {};
      let area = "";

      if (submenuId === 1) {
        area = ruangS1;
        payload = {
          ruang: ruangS1,
          barang_rutin: S1_rutin,
          barang_tidak_rutin: S1_tidakRutin,
          barang_tidak_diperlukan: S1_tidakPerlu.map(s => s.trim()).filter(Boolean),
          foto_url: finalFotoUrl
        };
      } else if (submenuId === 2) {
        payload = {
          barang_tidak_diperlukan_ref: S1_tidakPerluRefValue,
          recycle: S2_recycle,
          relocation: S2_relocation,
          dispose: S2_dispose,
          foto_url: finalFotoUrl
        };
      } else if (submenuId === 3) {
        area = ruangS3;
        payload = {
          ruang: ruangS3,
          checklist: checklistS3,
          foto_url: finalFotoUrl
        };
      } else if (submenuId === 4) {
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
          foto_url: finalFotoUrl
        };
      } else if (submenuId === 5) {
        payload = {
          pemborosan_sekolah: wasteSekolahS5,
          pemborosan_rumah: wasteRumahS5,
          foto_url: finalFotoUrl
        };
      }

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
        if (submenuId < 5) {
          setActiveTab(submenuId + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
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

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-neutral-600">Barang yang tidak diperlukan</label>
                            
                            <div className="space-y-2">
                              {S1_tidakPerlu.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => {
                                      const newVal = e.target.value;
                                      const copy = [...S1_tidakPerlu];
                                      copy[idx] = newVal;
                                      if (copy.join(", ").length <= 1000) {
                                        setS1_tidakPerlu(copy);
                                      } else {
                                        showToast("Total karakter barang tidak boleh melebihi 1000!", "error");
                                      }
                                    }}
                                    className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1 bg-white"
                                    placeholder={`Nama barang ke-${idx + 1}...`}
                                    maxLength={200}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(idx)}
                                    className="p-2 text-neutral-400 hover:text-red-500 rounded-xl hover:bg-neutral-50 transition shrink-0"
                                    title="Hapus baris"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={handleAddRow}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-light transition w-fit px-2 py-1 mt-1 rounded hover:bg-primary/5 cursor-pointer"
                            >
                              <Plus size={14} /> Tambah Barang
                            </button>

                            <div className="flex justify-between items-center px-1 mt-1 border-t pt-2">
                              <span className="text-[10px] text-neutral-400">Gunakan tombol [+ Tambah Barang] untuk input lainnya</span>
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
                                <span className="text-[10px] text-neutral-400 block mt-1 font-medium">Maksimal file 10MB</span>
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
                          disabled={submitting || !s1IsValid || uploadingS1}
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

                  const cleanItems = S1_tidakPerluRefValue.filter(item => item && item.trim() !== "");

                  return (
                    <div className="space-y-6">
                      {/* Interactive Sorting section */}
                      <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b pb-3">
                          <Activity size={18} className="text-primary" />
                          <h3 className="text-sm font-bold text-neutral-800">Pemilahan Barang Tidak Diperlukan</h3>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          Tentukan tindakan pemilahan untuk setiap barang tidak diperlukan yang telah Anda daftarkan pada Tahap 1. Pilih kategori tindakan dan berikan catatan singkat rencana aksinya.
                        </p>

                        {cleanItems.length > 0 ? (
                          <div className="space-y-4 mt-4">
                            {cleanItems.map((item, idx) => {
                              const assignment = pillAssignments[item] || null;
                              const note = itemNotes[item] || "";
                              
                              return (
                                <div key={idx} className="border border-neutral-100 rounded-xl p-4 space-y-3 bg-neutral-50/20 hover:border-neutral-200 transition shadow-sm">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                                        {idx + 1}
                                      </span>
                                      <span className="font-bold text-neutral-800 text-sm">{item}</span>
                                    </div>

                                    {/* Action Button Group */}
                                    <div className="flex flex-wrap gap-1.5">
                                      {[
                                        { type: "recycle", label: "Daur Ulang", activeClass: "bg-emerald-500 text-white shadow-emerald-100", inactiveClass: "bg-neutral-100 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-700" },
                                        { type: "relocation", label: "Pindah Area", activeClass: "bg-blue-500 text-white shadow-blue-100", inactiveClass: "bg-neutral-100 text-neutral-600 hover:bg-blue-50 hover:text-blue-700" },
                                        { type: "dispose", label: "Buang", activeClass: "bg-orange-500 text-white shadow-orange-100", inactiveClass: "bg-neutral-100 text-neutral-600 hover:bg-orange-50 hover:text-orange-700" }
                                      ].map((btn) => {
                                        const isActive = assignment === btn.type;
                                        return (
                                          <button
                                            key={btn.type}
                                            type="button"
                                            onClick={() => {
                                              setPillAssignments(prev => ({
                                                ...prev,
                                                [item]: (isActive ? null : btn.type) as any
                                              }));
                                            }}
                                            className={`text-[10px] sm:text-xs font-extrabold px-3 py-1.5 rounded-lg border-0 transition-all cursor-pointer shadow-sm ${
                                              isActive ? btn.activeClass : btn.inactiveClass
                                            }`}
                                          >
                                            {btn.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Note Input field based on selected action */}
                                  {assignment && (
                                    <div className="mt-2 pl-8">
                                      <input
                                        type="text"
                                        value={note}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setItemNotes(prev => ({
                                            ...prev,
                                            [item]: val
                                          }));
                                        }}
                                        placeholder={
                                          assignment === "recycle"
                                            ? "Contoh: Didaur ulang menjadi media tanaman..."
                                            : assignment === "relocation"
                                              ? "Contoh: Dipindahkan ke area penyimpanan khusus alat..."
                                              : "Contoh: Dibuang langsung ke tempat pembuangan akhir..."
                                        }
                                        className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 border border-dashed rounded-xl bg-neutral-50/50">
                            <p className="text-xs text-neutral-400 italic">
                              Tidak ada barang yang perlu dipilah. Silakan isi "Barang yang tidak diperlukan" pada Tahap 1 terlebih dahulu.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Photo upload and Compiled Preview section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Compiled Preview */}
                        <div className="border border-neutral-100 rounded-2xl p-5 bg-neutral-50/40 space-y-3">
                          <h4 className="text-xs font-black uppercase text-neutral-500 tracking-wider">Ringkasan Hasil Tindakan</h4>
                          
                          <div className="space-y-3 divide-y divide-neutral-100 text-xs">
                            <div className="pt-1">
                              <span className="font-bold text-emerald-600 block">Recycle (Daur Ulang):</span>
                              <p className="text-neutral-700 mt-1 whitespace-pre-wrap font-semibold bg-white p-2.5 rounded-lg border border-neutral-100 leading-relaxed min-h-[50px]">
                                {S2_recycle !== "Tidak ada" ? S2_recycle : "Belum ada tindakan daur ulang."}
                              </p>
                            </div>
                            <div className="pt-3">
                              <span className="font-bold text-blue-600 block">Relocation (Pindah):</span>
                              <p className="text-neutral-700 mt-1 whitespace-pre-wrap font-semibold bg-white p-2.5 rounded-lg border border-neutral-100 leading-relaxed min-h-[50px]">
                                {S2_relocation !== "Tidak ada" ? S2_relocation : "Belum ada tindakan pemindahan."}
                              </p>
                            </div>
                            <div className="pt-3">
                              <span className="font-bold text-orange-600 block">Dispose (Buang):</span>
                              <p className="text-neutral-700 mt-1 whitespace-pre-wrap font-semibold bg-white p-2.5 rounded-lg border border-neutral-100 leading-relaxed min-h-[50px]">
                                {S2_dispose !== "Tidak ada" ? S2_dispose : "Belum ada tindakan pembuangan."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Media Upload */}
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 text-center min-h-[300px]">
                          {fotoS2 ? (
                            <div className="space-y-3 w-full">
                              <img src={fotoS2} alt="Bukti Pembersihan" className="rounded-2xl max-h-52 object-cover border mx-auto shadow-sm" />
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
                                <span className="text-[10px] text-neutral-400 block mt-1 font-medium">Maksimal file 10MB</span>
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
                          disabled={submitting || !s2IsValid || uploadingS2}
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
                            {Object.entries(CHECKLIST_ITEMS).map(([groupKey, items]) => {
                              const groupHasAda = items.some((item) => {
                                const record = listCheck[item.key] || { status: "TIDAK ADA", catatan: "" };
                                return record.status === "ADA";
                              });
                              return (
                                <div key={groupKey} className="border rounded-2xl p-4 space-y-3 bg-neutral-50/20">
                                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                                    <h5 className="text-xs font-black uppercase text-primary tracking-widest">{groupKey}</h5>
                                    {groupHasAda ? (
                                      <span className="text-[10px] font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <AlertTriangle size={10} /> Ada Temuan (Not OK)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCircle size={10} /> Sempurna
                                      </span>
                                    )}
                                  </div>
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
                              );
                            })}
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
                        {Object.entries(CHECKLIST_ITEMS).map(([groupKey, items]) => {
                          const groupHasAda = items.some((item) => {
                            const current = checklistS3[item.key] || { status: "TIDAK ADA", catatan: "" };
                            return current.status === "ADA";
                          });
                          return (
                            <div key={groupKey} className="border rounded-2xl p-4 bg-white space-y-4">
                              <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="text-sm font-bold uppercase text-primary tracking-widest">{groupKey}</h4>
                                {groupHasAda ? (
                                  <span className="text-[10px] font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertTriangle size={10} /> Ada Temuan (Not OK)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle size={10} /> Sempurna
                                  </span>
                                )}
                              </div>
                              <div className="space-y-4 divide-y">
                                {items.map((item) => {
                                  const current = checklistS3[item.key] || { status: "TIDAK ADA", catatan: "" };
                                  const isAda = current.status === "ADA";
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
                                          className={`border rounded-lg text-xs font-semibold px-2 py-1.5 focus:outline-none focus:ring-2 ${
                                            isAda 
                                              ? "border-danger bg-danger/5 text-danger focus:ring-danger/20" 
                                              : "border-neutral-200 focus:ring-primary/20"
                                          }`}
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
                                          className={`border rounded-lg px-2.5 py-1.5 text-xs flex-1 md:w-64 focus:outline-none focus:ring-2 ${
                                            isAda && !current.catatan.trim()
                                              ? "border-danger bg-danger/5 placeholder-danger/60 focus:ring-danger/20 animate-pulse"
                                              : "border-neutral-200 focus:ring-primary/20"
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
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
                            <span className="text-[10px] text-neutral-400 block mt-1 font-medium">Maksimal file 10MB</span>
                            <label className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-3 py-2 text-xs font-bold cursor-pointer transition shadow-sm mt-1">
                              <Upload size={12} /> {uploadingS3 ? "Mengunggah..." : "Pilih File"}
                              <input type="file" accept="image/*" className="hidden" disabled={uploadingS3} onChange={(e) => handlePhotoChange(e, 3)} />
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <button
                          disabled={submitting || !s3IsValid || uploadingS3}
                          onClick={() => handleFormSubmit(3)}
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
                      { key: "APARATUS", title: "Mesin", icon: Wrench, color: "bg-red-500 text-white" },
                      { key: "BIG HEAVY", title: "Beban", icon: Package, color: "bg-orange-500 text-white" },
                      { key: "CAR", title: "Kendaraan", icon: Car, color: "bg-yellow-500 text-neutral-900" },
                      { key: "DROP FALL", title: "Jatuh", icon: ArrowDownCircle, color: "bg-green-500 text-white" },
                      { key: "ELECTRICITY", title: "Listrik", icon: Zap, color: "bg-blue-500 text-white" },
                      { key: "FIRE", title: "Api", icon: Flame, color: "bg-purple-500 text-white" }
                    ].map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={item.key} className="bg-white rounded-xl border p-3 text-center flex flex-col items-center justify-center gap-1.5 shadow-sm">
                          <div className={`p-1.5 rounded-lg ${item.color}`}>
                            <IconComponent size={16} />
                          </div>
                          <span className="text-[9px] font-black text-neutral-400 tracking-wider block">{item.key}</span>
                          <h4 className="text-[10px] font-bold text-neutral-800">{item.title}</h4>
                        </div>
                      );
                    })}
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
                        <div className="overflow-x-auto rounded-xl border border-neutral-100 shadow-2xs">
                        <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                          <thead>
                            <tr className="bg-neutral-50/75 text-neutral-450 font-black uppercase text-[9px] border-b border-neutral-100">
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-3">Deskripsi Temuan (Esai)</th>
                              <th className="py-3 px-3 w-40">Kategori</th>
                              <th className="py-3 px-2 w-20 text-center">F</th>
                              <th className="py-3 px-2 w-20 text-center">K</th>
                              <th className="py-3 px-3 w-32 text-center">Skor (Risiko)</th>
                              <th className="py-3 px-3">Penyebab</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-50 bg-white">
                            {list.map((row, i) => {
                              const score = row.frekuensi * row.dampak;
                              let label = "Rendah";
                              let color = "text-success bg-success/5 border-success/15";
                              if (score >= 10) { label = "Tinggi"; color = "text-danger bg-danger/5 border-danger/15"; }
                              else if (score >= 5) { label = "Sedang"; color = "text-warning bg-warning/5 border-warning/15"; }

                              return (
                                <tr key={i} className="hover:bg-neutral-50/30 transition-colors">
                                  <td className="py-4 px-4 font-bold text-center text-neutral-400">{i + 1}</td>
                                  <td className="py-3 px-3">
                                    <input 
                                      type="text" 
                                      value={row.temuan}
                                      onChange={(e) => updateRow(i, "temuan", e.target.value)}
                                      className="border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 w-full text-xs outline-none transition" 
                                      placeholder="Contoh: Kabel terkelupas di lantai"
                                    />
                                  </td>
                                  <td className="py-3 px-3">
                                    <select
                                      value={row.kategori}
                                      onChange={(e) => updateRow(i, "kategori", e.target.value)}
                                      className="border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 w-full text-xs outline-none transition bg-white cursor-pointer"
                                    >
                                      {KATEGORI_BAHAYA.map((kb) => <option key={kb} value={kb}>{kb}</option>)}
                                    </select>
                                  </td>
                                  <td className="py-3 px-2">
                                    <select
                                      value={row.frekuensi}
                                      onChange={(e) => updateRow(i, "frekuensi", parseInt(e.target.value))}
                                      className="border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2 py-2 w-full text-xs text-center font-bold outline-none transition bg-white cursor-pointer"
                                    >
                                      <option value="5">5</option>
                                      <option value="4">4</option>
                                      <option value="3">3</option>
                                      <option value="2">2</option>
                                      <option value="1">1</option>
                                    </select>
                                  </td>
                                  <td className="py-3 px-2">
                                    <select
                                      value={row.dampak}
                                      onChange={(e) => updateRow(i, "dampak", parseInt(e.target.value))}
                                      className="border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2 py-2 w-full text-xs text-center font-bold outline-none transition bg-white cursor-pointer"
                                    >
                                      <option value="3">3</option>
                                      <option value="2">2</option>
                                      <option value="1">1</option>
                                    </select>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={`inline-block font-black px-2.5 py-1 rounded-full text-[10px] border ${color}`}>
                                      {score} ({label})
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <input 
                                      type="text" 
                                      value={row.penyebab}
                                      onChange={(e) => updateRow(i, "penyebab", e.target.value)}
                                      className="border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 w-full text-xs outline-none transition" 
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
                      {/* Legend Keterangan F & K */}
                      <div className="bg-neutral-50/50 border border-neutral-100 rounded-2xl p-4 text-xs text-neutral-600 space-y-2.5">
                        <span className="font-bold text-neutral-800 block text-xs">Panduan Penilaian Risiko (Skor = F x K)</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
                          <div className="space-y-1">
                            <span className="font-bold text-primary block">F = Frekuensi (Seberapa Sering Kejadian):</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-neutral-500">
                              <li><span className="font-semibold text-neutral-700">5</span>: Sangat Sering / Tinggi</li>
                              <li><span className="font-semibold text-neutral-700">4</span>: Sering / Sedang</li>
                              <li><span className="font-semibold text-neutral-700">3</span>: Jarang / Rendah</li>
                              <li><span className="font-semibold text-neutral-700">2</span>: Sangat Jarang / Sangat Rendah</li>
                              <li><span className="font-semibold text-neutral-700">1</span>: Hampir Tidak Pernah</li>
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-primary block">K = Konsekuensi (Tingkat Dampak Cedera):</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-neutral-500">
                              <li><span className="font-semibold text-neutral-700">3</span>: Tinggi / Fatal (Cacat, Meninggal)</li>
                              <li><span className="font-semibold text-neutral-700">2</span>: Sedang (Cedera Sedang, Butuh Medis)</li>
                              <li><span className="font-semibold text-neutral-700">1</span>: Ringan (Cedera Ringan, P3K)</li>
                            </ul>
                          </div>
                        </div>
                        <div className="border-t pt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-400">
                          <div><span className="font-bold text-neutral-500">Skor Risiko (F x K):</span></div>
                          <div><span className="text-success font-semibold">1 - 4</span>: Risiko Rendah</div>
                          <div><span className="text-warning font-semibold">5 - 9</span>: Risiko Sedang</div>
                          <div><span className="text-danger font-semibold">≥ 10</span>: Risiko Tinggi</div>
                        </div>
                      </div>

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
                            <span className="text-[10px] text-neutral-400 block mt-1 font-medium">Maksimal file 10MB</span>
                            <label className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-3 py-2 text-xs font-bold cursor-pointer transition shadow-sm mt-1">
                              <Upload size={12} /> {uploadingS4 ? "Mengunggah..." : "Pilih File"}
                              <input type="file" accept="image/*" className="hidden" disabled={uploadingS4} onChange={(e) => handlePhotoChange(e, 4)} />
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <button
                          disabled={submitting || !s4IsValid || uploadingS4}
                          onClick={() => handleFormSubmit(4)}
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { key: "MOTION", title: "Gerak Berlebihan", desc: "Gerakan fisik tidak perlu", icon: Activity, color: "bg-orange-50 text-orange-600 border-orange-100" },
                      { key: "TRANSPORT", title: "Mengangkut", desc: "Pemindahan tidak efisien", icon: Truck, color: "bg-blue-50 text-blue-600 border-blue-100" },
                      { key: "WAITING", title: "Menunggu", desc: "Waktu jeda antrian proses", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100" },
                      { key: "OVERPROD", title: "Produksi Lebih", desc: "Melampaui target kuantitas", icon: Copy, color: "bg-red-50 text-red-600 border-red-100" },
                      { key: "INVENTORY", title: "Stok Berlebih", desc: "Menumpuk di gudang", icon: Archive, color: "bg-purple-50 text-purple-600 border-purple-100" },
                      { key: "PROCESS", title: "Proses Berlebih", desc: "Pengerjaan berulang", icon: Cpu, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
                      { key: "REWORK", title: "Perbaikan Ulang", desc: "Memperbaiki barang cacat", icon: RotateCcw, color: "bg-rose-50 text-rose-600 border-rose-100" }
                    ].map((w) => {
                      const IconComp = w.icon;
                      return (
                        <div key={w.key} className="bg-white rounded-xl border border-neutral-100 p-3 text-center flex flex-col items-center justify-between shadow-xs hover:border-neutral-200 transition">
                          <div className={`p-2 rounded-xl border mb-2 ${w.color}`}>
                            <IconComp size={18} />
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">{w.key}</span>
                          <h4 className="text-[10px] font-bold text-neutral-850 mt-1">{w.title}</h4>
                          <p className="text-[8px] text-neutral-400 mt-1 leading-snug">{w.desc}</p>
                        </div>
                      );
                    })}
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
                      <div className="overflow-x-auto rounded-xl border border-neutral-100 shadow-2xs">
                        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-neutral-50/75 text-neutral-450 font-black uppercase text-[9px] border-b border-neutral-100">
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-3">Deskripsi Aktivitas Pemborosan (Esai)</th>
                              <th className="py-3 px-3 w-64">Kategori Waste</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-50 bg-white">
                            {list.map((row, i) => (
                              <tr key={i} className="hover:bg-neutral-50/30 transition-colors">
                                <td className="py-4 px-4 font-bold text-center text-neutral-400">{i + 1}</td>
                                <td className="py-3 px-3">
                                  <input 
                                    type="text" 
                                    value={row.temuan}
                                    onChange={(e) => updateRow(i, "temuan", e.target.value)}
                                    className="border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 w-full text-xs outline-none transition" 
                                    placeholder="Contoh: Antri lama saat mengumpulkan kertas"
                                  />
                                </td>
                                <td className="py-3 px-3">
                                  <select
                                    value={row.kategori}
                                    onChange={(e) => updateRow(i, "kategori", e.target.value)}
                                    className="border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 w-full text-xs outline-none transition bg-white cursor-pointer"
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
                            <span className="text-[10px] text-neutral-400 block mt-1 font-medium">Maksimal file 10MB</span>
                            <label className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-3 py-2 text-xs font-bold cursor-pointer transition shadow-sm mt-1">
                              <Upload size={12} /> {uploadingS5 ? "Mengunggah..." : "Pilih File"}
                              <input type="file" accept="image/*" className="hidden" disabled={uploadingS5} onChange={(e) => handlePhotoChange(e, 5)} />
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <button
                          disabled={submitting || !s5IsValid || uploadingS5}
                          onClick={() => handleFormSubmit(5)}
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
