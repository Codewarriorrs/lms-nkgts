"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { 
  Settings, 
  User, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from "lucide-react";

export default function EmailContactSettingsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  // Form State
  const [cpName, setCpName] = useState("Admin N-KGTS");
  const [cpWhatsapp, setCpWhatsapp] = useState("6281234567890");

  // Status
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authenticate Admin
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(userStr);
      if (u.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setIsAdmin(true);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  // Fetch Settings
  useEffect(() => {
    if (!isAdmin) return;
    fetchContactSettings();
  }, [isAdmin]);

  const fetchContactSettings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/settings/email-contact`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengambil pengaturan kontak");
      setCpName(data.cp_name || "Admin N-KGTS");
      setCpWhatsapp(data.cp_whatsapp || "6281234567890");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpName || !cpWhatsapp) {
      setErrorMsg("Semua kolom harus diisi.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/settings/email-contact`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cp_name: cpName,
          cp_whatsapp: cpWhatsapp
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan pengaturan");
      setSuccessMsg("Informasi Contact Person email berhasil diperbarui.");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-neutral-900 flex items-center gap-3">
          <Settings className="text-primary h-7 w-7" />
          Pengaturan Kontak Email
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Atur informasi Contact Person (nama dan nomor WhatsApp) yang akan ditampilkan pada bagian kaki (footer) email undangan aktivasi siswa/guru.
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-start gap-3">
          <CheckCircle2 className="flex-shrink-0 mt-0.5" size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Settings */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 mb-5 flex items-center gap-2">
            Ubah Detail Kontak
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Nama Lengkap Contact Person</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={cpName}
                  onChange={(e) => setCpName(e.target.value)}
                  placeholder="Contoh: Budi Santoso (Admin TAM)"
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary transition duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Nomor WhatsApp (Kode Negara)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400">
                  <MessageSquare size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={cpWhatsapp}
                  onChange={(e) => setCpWhatsapp(e.target.value)}
                  placeholder="Contoh: 6281234567890 (Gunakan format angka tanpa +)"
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-100 rounded-xl text-sm font-mono focus:outline-none focus:border-primary transition duration-200"
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Pastikan nomor dimulai dengan kode negara (misal 62 untuk Indonesia) tanpa tanda "+" atau spasi agar tautan otomatis berfungsi.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-50 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/10 transition duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Email */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Eye size={18} className="text-neutral-400" />
            Live Preview Tampilan Email
          </h2>
          <p className="text-xs text-neutral-400 mb-4">
            Berikut adalah simulasi visual bagaimana isi email undangan aktivasi akan diterima oleh siswa atau guru.
          </p>

          {/* Email Container Simulation */}
          <div className="border border-neutral-100 rounded-xl p-5 bg-neutral-50/50">
            {/* Email Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-neutral-400" />
                <span className="text-xs font-bold text-neutral-700">Subjek: Undangan Aktivasi...</span>
              </div>
              <span className="text-[10px] text-neutral-400">Baru Saja</span>
            </div>

            {/* Email Body Simulation */}
            <div className="bg-white p-6 rounded-lg border border-neutral-100 shadow-xs text-xs text-neutral-600 space-y-3 font-sans">
              <div className="text-center mb-5">
                <h3 className="text-sm font-extrabold text-primary" style={{ color: "#1A3F8F" }}>N-KGTS LMS Platform</h3>
                <span className="text-[9px] text-neutral-400 block mt-0.5">Pembelajaran Budaya Kaizen & 5R</span>
              </div>
              
              <hr className="border-neutral-100 my-4" />

              <p>Halo, <strong>Siswa Contoh</strong>!</p>
              <p>Anda telah diundang sebagai <strong>SISWA</strong> di sekolah <strong>SMK Negeri 1 Semarang</strong> untuk bergabung dalam platform LMS N-KGTS.</p>
              <p>Silakan klik tautan di bawah ini untuk mengaktifkan akun Anda dan mengatur password masuk baru:</p>
              
              <div className="text-center my-6">
                <span className="inline-block px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-xs" style={{ backgroundColor: "#1A3F8F" }}>
                  Aktifkan Akun Saya
                </span>
              </div>

              <p className="text-[10px] text-neutral-400">Tautan ini hanya berlaku selama 7 hari. Jika tautan kedaluwarsa, silakan hubungi Admin Sekolah Anda.</p>

              <hr className="border-neutral-100 my-4" />
              
              {/* Dynamic Footer Preview */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100/50">
                <p className="text-[10px] text-neutral-400 font-bold mb-1">Butuh bantuan? Hubungi Contact Person kami:</p>
                <div className="space-y-0.5 text-[11px]">
                  <p className="text-neutral-700">Nama: <strong className="text-neutral-900">{cpName || "Admin N-KGTS"}</strong></p>
                  <p className="text-neutral-700">
                    WhatsApp:{" "}
                    <span className="text-primary font-bold hover:underline" style={{ color: "#1A3F8F" }}>
                      +{cpWhatsapp || "6281234567890"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
