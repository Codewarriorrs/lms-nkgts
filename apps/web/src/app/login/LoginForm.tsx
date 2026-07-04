"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Email atau password salah");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem, silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary-light/20" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-primary-dark/40" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <img src="/logo-kaizen-lLOIwLqFwQetrVPO.avif" alt="Logo Kaizen" className="h-9 w-auto object-contain bg-white rounded p-0.5" />
            <div className="leading-none">
              <div className="text-[15px] font-bold tracking-tight">N-KGTS</div>
              <div className="text-[10px] font-semibold text-white/50 tracking-[0.12em] uppercase">LMS Platform</div>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Selamat Datang di<br />
            <span className="text-accent">N-KGTS LMS</span>
          </h2>
          <p className="text-sm text-white/60 leading-[1.7] max-w-sm">
            Platform pembelajaran terintegrasi untuk program National Kaizen Goes To School Fase 4 — 2026.
          </p>
        </div>

        <div className="relative z-10 flex gap-6 text-xs text-white/40">
          <span>© 2026 N-KGTS</span>
          <span>PT Toyota-Astra Motor</span>
          <span>PT Kode Solusi</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Back to Home Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-primary transition-colors duration-200 mb-6"
          >
            <ArrowLeft size={14} />
            Kembali ke Beranda
          </Link>

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src="/logo-kaizen-lLOIwLqFwQetrVPO.avif" alt="Logo Kaizen" className="h-9 w-auto object-contain" />
            <div className="leading-none">
              <div className="text-[15px] font-bold text-primary tracking-tight">N-KGTS</div>
              <div className="text-[10px] font-semibold text-neutral-400 tracking-[0.12em] uppercase">LMS Platform</div>
            </div>
          </Link>

          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Masuk</h1>
          <p className="text-sm text-neutral-400 mb-8">Gunakan akun yang telah didaftarkan oleh Admin sekolah Anda.</p>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-danger/10 border border-danger/20 text-xs font-semibold text-danger leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@nkgts.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-neutral-400">Password</label>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-light disabled:opacity-60 text-white font-bold text-sm rounded-lg transition-colors mt-1"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-neutral-400">
            Kendala login? <span className="font-semibold text-neutral-700">Hubungi Admin Sekolah Anda</span>
          </p>
        </div>
      </div>
    </div>
  );
}
