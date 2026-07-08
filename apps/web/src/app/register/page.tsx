"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  User, 
  Building2, 
  Mail, 
  ArrowRight,
  MessageSquare
} from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Loading states
  const [checkingToken, setCheckingToken] = useState(true);
  const [activating, setActivating] = useState(false);
  
  // Data states
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [cpInfo, setCpInfo] = useState<any>({ cp_name: "Admin N-KGTS", cp_whatsapp: "6281234567890" });
  
  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Validate Token on Mount
  useEffect(() => {
    if (!token) {
      setErrorMsg("Tautan aktivasi tidak valid atau tidak lengkap. Hubungi Admin Sekolah Anda.");
      setCheckingToken(false);
      fetchCpSettings();
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    setCheckingToken(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/auth/activate?token=${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tautan aktivasi kedaluwarsa atau tidak terdaftar");
      setTokenInfo(data);
    } catch (err: any) {
      setErrorMsg(err.message);
      fetchCpSettings(); // Load CP settings if token check fails so user has someone to contact
    } finally {
      setCheckingToken(false);
    }
  };

  const fetchCpSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/settings/email-contact`);
      const data = await res.json();
      if (res.ok) {
        setCpInfo(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Submit Activation
  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg("Semua kolom password wajib diisi.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password minimal terdiri dari 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Password dan Konfirmasi Password tidak cocok.");
      return;
    }

    setActivating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_URL}/auth/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengaktifkan akun");

      setSuccessMsg("Akun berhasil diaktifkan! Anda akan dialihkan ke dashboard...");
      
      // Save session credentials
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActivating(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-sm font-semibold">Memverifikasi tautan aktivasi Anda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-neutral-100 rounded-3xl shadow-xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="bg-primary/10 text-primary p-3 rounded-full inline-flex mb-3">
          <KeyRound size={28} />
        </div>
        <h1 className="text-xl font-extrabold text-neutral-900">Aktivasi Akun</h1>
        <p className="text-xs text-neutral-400 mt-1">LMS N-KGTS Pembelajaran Budaya Kaizen</p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p>{errorMsg}</p>
            {/* Contact Person helper if token error */}
            {!tokenInfo && (
              <div className="mt-3 p-3 bg-white/50 border border-danger/15 rounded-lg text-xs text-neutral-700 space-y-1">
                <p className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider">Butuh Bantuan?</p>
                <p>Silakan hubungi Contact Person kami:</p>
                <p className="font-bold text-neutral-900">{cpInfo.cp_name}</p>
                <p className="flex items-center gap-1 text-primary hover:underline font-bold mt-1">
                  <MessageSquare size={12} />
                  <a href={`https://wa.me/${cpInfo.cp_whatsapp}`}>+{cpInfo.cp_whatsapp} (WhatsApp)</a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-start gap-3">
          <CheckCircle2 className="flex-shrink-0 mt-0.5" size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Activation Form */}
      {tokenInfo && !successMsg && (
        <div>
          {/* User Details Box */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 mb-6 space-y-2.5 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <User size={14} className="text-neutral-400" />
              <span className="text-neutral-900 font-bold">{tokenInfo.nama}</span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 font-semibold text-[9px] uppercase">{tokenInfo.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-neutral-400" />
              <span className="font-mono text-neutral-700">{tokenInfo.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-neutral-400" />
              <span>{tokenInfo.nama_sekolah}</span>
            </div>
            {tokenInfo.nis && (
              <div className="pt-1.5 border-t border-neutral-200/50 text-neutral-400">
                Nomor Induk Siswa (NIS): <strong className="text-neutral-700">{tokenInfo.nis}</strong>
              </div>
            )}
          </div>

          <form onSubmit={handleActivation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Password Baru *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Buat password masuk..."
                  className="w-full pl-4 pr-10 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Konfirmasi Password Baru *</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password masuk..."
                className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary transition"
              />
            </div>

            <button
              type="submit"
              disabled={activating}
              className="w-full flex items-center justify-center gap-2 mt-6 px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/10 transition cursor-pointer disabled:opacity-50"
            >
              {activating ? "Mengaktifkan..." : "Aktifkan Akun"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Back to Login link */}
      <div className="mt-6 text-center border-t border-neutral-50 pt-4">
        <Link href="/login" className="text-xs text-neutral-400 hover:text-neutral-700 hover:underline">
          Sudah memiliki akun aktif? Masuk di sini
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm font-semibold">Memuat halaman...</p>
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
