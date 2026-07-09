"use client";

import { useState, useEffect } from "react";
import { User, School, Mail, Shield, Calendar, Phone, MapPin, Edit, Save, X, Camera, RefreshCw, FileText } from "lucide-react";
import { API_URL } from "@/lib/api";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");
  const [noHp, setNoHp] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [tahunPendaftaran, setTahunPendaftaran] = useState<number | "">("");
  const [fotoProfilBase64, setFotoProfilBase64] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        setNama(parsed.name || "");
        setKelas(parsed.kelas || "");
        setNoHp(parsed.no_hp || "");
        setTempatLahir(parsed.tempat_lahir || "");
        setTahunPendaftaran(parsed.tahun_pendaftaran || "");
        if (parsed.tanggal_lahir) {
          const d = new Date(parsed.tanggal_lahir);
          if (!isNaN(d.getTime())) {
            setTanggalLahir(d.toISOString().split("T")[0]);
          }
        }
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Ukuran file foto maksimal adalah 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoProfilBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMsg("Sesi Anda telah habis. Silakan login kembali.");
      setSubmitLoading(false);
      return;
    }

    try {
      const payload: any = {
        nama,
        kelas,
        no_hp: noHp,
        tempat_lahir: tempatLahir,
        tahun_pendaftaran: tahunPendaftaran !== "" ? Number(tahunPendaftaran) : null,
      };

      if (tanggalLahir) {
        payload.tanggal_lahir = new Date(tanggalLahir).toISOString();
      } else {
        payload.tanggal_lahir = null;
      }

      if (fotoProfilBase64) {
        payload.foto_profil = fotoProfilBase64;
      }

      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui profil");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setCurrentUser(data.user);
      
      setSuccessMsg("Profil Anda berhasil diperbarui!");
      setIsEditing(false);

      // Reload halaman agar perubahan ter-update di topbar/sidebar secara instan
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengirimkan pembaruan profil.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="px-6 py-8 space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-neutral-200 rounded" />
          <div className="h-4 w-64 bg-neutral-200 rounded" />
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 p-6 max-w-2xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-200" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-neutral-200 rounded" />
              <div className="h-4 w-16 bg-neutral-200 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-neutral-100">
            <div className="h-12 bg-neutral-50 rounded" />
            <div className="h-12 bg-neutral-50 rounded" />
            <div className="h-12 bg-neutral-50 rounded" />
            <div className="h-12 bg-neutral-50 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Format Tanggal Lahir untuk dibaca
  const displayBirthDate = currentUser.tanggal_lahir 
    ? new Date(currentUser.tanggal_lahir).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
    : "-";

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
            Profil Saya
          </h1>
          <p className="text-neutral-400 text-xs font-semibold mt-1">
            Kelola informasi profil dan kredensial akun LMS Anda.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm shadow-primary/10"
          >
            <Edit size={14} /> Edit Profil
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 max-w-2xl rounded-xl bg-success/10 border border-success/20 text-xs font-semibold text-success flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 max-w-2xl rounded-xl bg-danger/10 border border-danger/20 text-xs font-semibold text-danger">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-100 p-6 max-w-2xl space-y-6">
        {/* Profile Avatar Block */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-neutral-100">
          <div className="relative group select-none">
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-neutral-900 font-extrabold text-3xl shadow-md overflow-hidden">
              {fotoProfilBase64 ? (
                <img src={fotoProfilBase64} alt={nama} className="w-full h-full object-cover" />
              ) : currentUser.avatar && (currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("data:image")) ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.avatar
              )}
            </div>
            {isEditing && (
              <label className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-bold gap-1">
                <Camera size={18} />
                <span>Unggah Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-neutral-900">{currentUser.name}</h3>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
              <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                {currentUser.role}
              </span>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                {currentUser.school}
              </span>
            </div>
          </div>
        </div>

        {/* View Mode / Edit Mode toggle */}
        {!isEditing ? (
          /* View Profile Details */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} /> Nama Lengkap
              </span>
              <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
                {currentUser.name}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} /> Alamat Email
              </span>
              <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50 font-mono">
                {currentUser.email}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <School size={12} /> Kelas
              </span>
              <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
                {currentUser.kelas || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={12} /> No. HP / WhatsApp
              </span>
              <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
                {currentUser.no_hp || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={12} /> Tempat Lahir
              </span>
              <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
                {currentUser.tempat_lahir || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} /> Tanggal Lahir
              </span>
              <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
                {displayBirthDate}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} /> Tahun Angkatan / Pendaftaran
              </span>
              <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
                {currentUser.tahun_pendaftaran || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} /> NIS
              </span>
              <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
                {currentUser.nis || "-"}
              </p>
            </div>
          </div>
        ) : (
          /* Edit Profile Form */
          <form onSubmit={handleSave} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Alamat Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-100 text-sm text-neutral-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Kelas</label>
                <input
                  type="text"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  placeholder="Contoh: Kelas 10, Kelas 11-A"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">No. HP / WhatsApp</label>
                <input
                  type="tel"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Tempat Lahir</label>
                <input
                  type="text"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  placeholder="Contoh: Semarang, Jakarta"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Tanggal Lahir</label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Tahun Angkatan / Pendaftaran</label>
                <input
                  type="number"
                  value={tahunPendaftaran}
                  onChange={(e) => setTahunPendaftaran(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Contoh: 2026"
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">NIS (Read Only)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.nis || "-"}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-100 text-sm text-neutral-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg(null);
                  setFotoProfilBase64(null);
                  setNama(currentUser.name || "");
                  setKelas(currentUser.kelas || "");
                  setNoHp(currentUser.no_hp || "");
                  setTempatLahir(currentUser.tempat_lahir || "");
                  setTahunPendaftaran(currentUser.tahun_pendaftaran || "");
                  if (currentUser.tanggal_lahir) {
                    setTanggalLahir(new Date(currentUser.tanggal_lahir).toISOString().split("T")[0]);
                  } else {
                    setTanggalLahir("");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 text-neutral-600 px-4 py-2.5 text-xs font-bold transition hover:bg-neutral-50"
              >
                <X size={14} /> Batal
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-5 py-2.5 text-xs font-bold transition shadow-sm disabled:opacity-60"
              >
                {submitLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Minimal dummy types to ensure components are parsed correctly by build tool
interface CheckCircle2Props {
  size: number;
}
function CheckCircle2({ size }: CheckCircle2Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-success"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
