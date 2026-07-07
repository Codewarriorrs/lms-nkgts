"use client";

import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  ClipboardList,
  Briefcase,
  FolderKanban,
  BarChart2,
  Award,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Users,
  School,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

// ── DATA ─────────────────────────────────────────────────────

const navLinks = [
  { label: "Tentang Program", href: "#tentang" },
  { label: "Modul", href: "#modul" },
  { label: "FAQ", href: "#faq" },
];

const stats = [
  {
    icon: School,
    value: "100+",
    label: "Sekolah Terlibat",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Users,
    value: "210",
    label: "Siswa Peserta 2026",
    color: "bg-accent/20 text-accent-dark",
  },
  {
    icon: GraduationCap,
    value: "17+",
    label: "Guru Praktisi Bersertifikat",
    color: "bg-success/10 text-success",
  },
  {
    icon: Award,
    value: "2014",
    label: "Tahun Program Dimulai",
    color: "bg-primary/10 text-primary",
  },
];

const moduls = [
  {
    id: 1,
    judul: "Materi Pelatihan",
    deskripsi:
      "Akses materi soft skill problem solving berbasis metodologi Kaizen dalam 5 topik pelatihan terstruktur.",
    icon: BookOpen,
    img: "https://placehold.co/400x220/E8ECF4/9099AE?text=Materi+Pelatihan",
    tag: "Teori",
  },
  {
    id: 2,
    judul: "Soal Latihan",
    deskripsi:
      "Uji pemahaman materi melalui soal latihan yang tersedia setelah kamu menyelesaikan setiap topik.",
    icon: ClipboardList,
    img: "https://placehold.co/400x220/E8ECF4/9099AE?text=Soal+Latihan",
    tag: "Evaluasi",
  },
  {
    id: 3,
    judul: "Tugas Praktek",
    deskripsi:
      "Kerjakan dan kumpulkan tugas praktek yang diberikan guru langsung melalui platform LMS.",
    icon: Briefcase,
    img: "https://placehold.co/400x220/E8ECF4/9099AE?text=Tugas+Praktek",
    tag: "Praktek",
  },
  {
    id: 4,
    judul: "Project Kaizen",
    deskripsi:
      "Daftarkan, jalankan, dan laporkan progress project kaizen kamu secara berkala dengan template terstruktur.",
    icon: FolderKanban,
    img: "https://placehold.co/400x220/E8ECF4/9099AE?text=Project+Kaizen",
    tag: "Project",
  },
  {
    id: 5,
    judul: "Penilaian & Feedback",
    deskripsi:
      "Terima penilaian dan feedback langsung dari Guru Praktisi Kaizen untuk setiap tugas dan project.",
    icon: BarChart2,
    img: "https://placehold.co/400x220/E8ECF4/9099AE?text=Penilaian",
    tag: "Feedback",
  },
  {
    id: 6,
    judul: "Sertifikasi",
    deskripsi:
      "Raih Sertifikat Partisipasi Kaizen dan Sertifikat Penyelesaian Project setelah menuntaskan program.",
    icon: Award,
    img: "https://placehold.co/400x220/E8ECF4/9099AE?text=Sertifikasi",
    tag: "Sertifikat",
  },
];

const faqs = [
  {
    q: "Siapa yang bisa menggunakan platform ini?",
    a: "Platform ini hanya dapat diakses oleh peserta resmi program N-KGTS 2026 — yaitu Guru Praktisi Kaizen dan Siswa SMK terpilih dari 7 sekolah peserta.",
  },
  {
    q: "Bagaimana cara mendaftar akun?",
    a: "Akun tidak dapat dibuat secara mandiri. Akun akan disiapkan oleh Admin dan kamu akan menerima kode akses atau undangan melalui email untuk mengaktifkan akunmu.",
  },
  {
    q: "Apa itu Kaizen?",
    a: "Kaizen adalah filosofi perbaikan berkelanjutan dari Toyota yang mendorong setiap orang untuk selalu mencari cara lebih baik dalam melakukan sesuatu. Program N-KGTS mengajarkan 8 langkah penyelesaian masalah berbasis Kaizen.",
  },
  {
    q: "Apa saja sertifikat yang bisa diraih?",
    a: "Ada dua sertifikat — Sertifikat Partisipasi Kaizen (untuk yang memahami 8 langkah dan tools kaizen) dan Sertifikat Penyelesaian Project (untuk yang berhasil menjalankan dan mempresentasikan project kaizen).",
  },
  {
    q: "Apakah platform bisa diakses dari smartphone?",
    a: "Ya, platform ini responsif dan dapat diakses dari browser di smartphone, tablet, maupun komputer.",
  },
  {
    q: "Apakah siswa bisa langsung mengerjakan soal?",
    a: "Tidak. Soal latihan baru bisa dikerjakan setelah siswa mengakses materi pada topik yang bersangkutan.",
  },
];

// ── HOOKS ─────────────────────────────────────────────────────

function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

// ── NAVBAR ────────────────────────────────────────────────────

function Navbar() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/70 backdrop-blur-md border-b border-neutral-100/60 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src="/logo-nkgts.png" alt="Logo Kaizen" className="h-16 w-auto object-contain rounded p-0.5" />
            <div>
              <span
                className={`font-extrabold text-base tracking-tight transition-colors duration-300 ${
                  scrolled ? "text-primary-dark" : "text-white"
                }`}
              >
                N-KGTS
              </span>
              <span
                className={`block text-xs font-semibold tracking-widest uppercase leading-none transition-colors duration-300 ${
                  scrolled ? "text-primary" : "text-accent"
                }`}
              >
                LMS
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`text-sm font-medium transition-colors duration-300 hover:text-accent ${
                  scrolled ? "text-primary-dark" : "text-white/80"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className={`text-sm font-semibold transition-colors duration-300 ${
                scrolled ? "text-primary-dark hover:text-primary" : "text-white/80 hover:text-white"
              }`}
            >
              Masuk
            </a>
            <a
              href="/login"
              className="bg-accent text-neutral-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent-dark transition-all duration-200 hover:shadow-md"
            >
              Mulai Sekarang →
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className={`md:hidden transition-colors duration-300 ${
              scrolled ? "text-primary-dark" : "text-white"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        } bg-white/95 backdrop-blur-md border-t border-neutral-100`}
      >
        <div className="px-5 py-4 space-y-3">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-primary-dark hover:text-primary transition"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/login"
            className="block w-full text-center bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-light transition mt-2"
          >
            Masuk ke Platform
          </a>
        </div>
      </div>
    </header>
  );
}

// ── HERO ─────────────────────────────────────────────────────

function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  return (
    <section className="relative min-h-screen bg-primary flex items-center overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-light/30 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-primary-dark/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5"
          style={{ backgroundImage: "radial-gradient(circle, #F5C400 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        {/* Floating shapes */}
        <div className="absolute top-32 right-16 w-20 h-20 rounded-2xl border-2 border-accent/30 rotate-12 animate-pulse" />
        <div className="absolute bottom-32 right-32 w-12 h-12 rounded-full border-2 border-white/20 animate-bounce" style={{ animationDuration: "3s" }} />
        <div className="absolute top-1/2 right-8 w-6 h-6 bg-accent/40 rounded-md rotate-45" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="inline-block bg-accent text-neutral-900 text-xs font-bold px-3 py-1 rounded-full mb-5 tracking-wide uppercase">
              #1 Platform Pelatihan Kaizen · SMK Indonesia
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] mb-5">
              Platform Pelatihan{" "}
              <span className="text-accent">Kaizen</span>{" "}
              untuk Guru & Siswa SMK
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              N-KGTS adalah program PT Toyota-Astra Motor untuk mengembangkan generasi
              Problem Solver yang siap menghadapi Indonesia Emas 2045 melalui budaya
              perbaikan berkelanjutan.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login"
                className="bg-accent text-neutral-900 font-semibold px-6 py-3 rounded-lg hover:bg-accent-dark transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
              >
                Mulai Belajar <ArrowRight size={16} />
              </a>
              <a
                href="#tentang"
                className="border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:border-white hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
              >
                Pelajari Program
              </a>
            </div>
          </div>

          {/* Visual right */}
          <div className={`hidden lg:flex justify-center items-center transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="relative w-full max-w-sm">
              {/* Main card */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <BookOpen size={18} className="text-neutral-900" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Materi Aktif</p>
                    <p className="text-white/60 text-xs">Topik 3 · Diagram Pareto</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-white/70">
                    <span>Progress Belajar</span><span className="text-accent font-semibold">60%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-accent h-1.5 rounded-full transition-all duration-1000" style={{ width: mounted ? "60%" : "0%" }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Tugas Aktif", val: "2" },
                    { label: "Project", val: "Disetujui" },
                  ].map((i) => (
                    <div key={i.label} className="bg-white/10 rounded-xl p-3">
                      <p className="text-white/60 text-xs">{i.label}</p>
                      <p className="text-white font-bold text-sm">{i.val}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-success text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce" style={{ animationDuration: "2.5s" }}>
                <Award size={12} /> Sertifikasi Kaizen
              </div>
              {/* Floating stat */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-neutral-900 font-extrabold text-sm leading-none">210+</p>
                  <p className="text-neutral-400 text-xs">Siswa Aktif</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce" style={{ animationDuration: "2s" }}>
          <span className="text-xs font-medium">Scroll</span>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full fill-neutral-50" preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}

// ── STATS ─────────────────────────────────────────────────────

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} className="bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`bg-white rounded-2xl shadow-md p-5 flex flex-col items-center text-center
                hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-full ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={22} />
              </div>
              <p className="text-3xl font-extrabold text-neutral-900 leading-none">{s.value}</p>
              <p className="text-neutral-400 text-xs font-medium mt-1.5 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TENTANG ───────────────────────────────────────────────────

function TentangSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  const langkah = [
    "Perjelas Masalah", "Temukan Titik Kejadian", "Penentuan Target",
    "Pencarian Penyebab", "Rencana Tindakan", "Pelaksanaan Tindakan",
    "Evaluasi Hasil", "Pembakuan",
  ];

  return (
    <section id="tentang" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Text */}
          <div>
            <span className="inline-block bg-accent text-neutral-900 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
              Tentang Program
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight mb-4">
              Membangun Generasi{" "}
              <span className="text-primary">Problem Solver</span>
            </h2>
            <p className="text-neutral-700 text-base leading-relaxed mb-4">
              Program National Kaizen Goes To School (N-KGTS) adalah inisiatif PT Toyota-Astra Motor
              sebagai bagian dari program pembangunan berkelanjutan di bidang pendidikan.
            </p>
            <p className="text-neutral-700 text-base leading-relaxed mb-6">
              Program ini menularkan praktik terbaik Toyota dalam penerapan budaya Kaizen kepada guru
              dan siswa SMK, untuk membentuk generasi yang memiliki karakter{" "}
              <span className="font-semibold text-primary">DEKKI</span> — Disiplin, Empati, Kritis,
              Kreatif, dan Inovatif.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-light transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              Masuk ke Platform <ChevronRight size={16} />
            </a>
          </div>

          {/* 8 Langkah visual */}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              8 Langkah Penyelesaian Masalah Kaizen
            </p>
            <div className="grid grid-cols-2 gap-3">
              {langkah.map((l, i) => (
                <div
                  key={l}
                  className="flex items-center gap-3 bg-neutral-50 rounded-xl p-3 hover:bg-primary/5 transition-colors duration-200 group"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className="w-7 h-7 rounded-lg bg-primary text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:text-neutral-900 transition-colors duration-200">
                    {i + 1}
                  </div>
                  <span className="text-xs font-medium text-neutral-700 leading-snug">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── MODUL ─────────────────────────────────────────────────────

function ModulSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <section id="modul" className="bg-neutral-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block bg-accent text-neutral-900 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            Fitur Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">
            Apa yang Bisa Kamu Lakukan
            <br />
            <span className="text-primary">di Platform Ini?</span>
          </h2>
          <p className="text-neutral-400 text-sm mt-3 max-w-lg mx-auto">
            Enam modul terstruktur untuk mendukung seluruh proses pelatihan Kaizen dari awal hingga sertifikasi.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {moduls.map((m, i) => (
            <div
              key={m.id}
              className={`bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer
                ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={m.img}
                  alt={m.judul}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-white text-primary text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {m.tag}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <m.icon size={16} className="text-primary group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-neutral-900 font-bold text-sm">{m.judul}</h3>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">{m.deskripsi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA BANNER ────────────────────────────────────────────────

function CTABanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`bg-primary rounded-3xl p-10 text-center relative overflow-hidden transition-all duration-700 ${
            inView ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-light/30 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary-dark/40 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-block bg-accent text-neutral-900 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
              Sudah Punya Akun?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Yuk Mulai Belajar Hari Ini
            </h2>
            <p className="text-white/70 text-sm max-w-md mx-auto mb-6">
              Akses materi, kerjakan tugas, dan jalankan project kaizen kamu bersama guru dan teman dari seluruh Indonesia.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 bg-accent text-neutral-900 font-semibold px-7 py-3 rounded-xl hover:bg-accent-dark transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
            >
              Masuk ke Platform <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <section id="faq" className="bg-neutral-50 py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block bg-accent text-neutral-900 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            FAQ
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div ref={ref} className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className={`text-sm font-semibold transition-colors duration-200 ${
                    open === i ? "text-primary" : "text-neutral-900 group-hover:text-primary"
                  }`}
                >
                  {f.q}
                </span>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 transition-all duration-300 ${
                    open === i ? "rotate-180 text-primary" : "text-neutral-400"
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  open === i ? "max-h-40 pb-4" : "max-h-0"
                }`}
              >
                <div className="px-5 border-l-4 border-accent ml-5">
                  <p className="text-neutral-700 text-sm leading-relaxed">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-primary-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Logo & tagline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo-kaizen-lLOIwLqFwQetrVPO.avif" alt="Logo Kaizen" className="h-8 w-auto object-contain bg-white rounded p-0.5" />
              <span className="font-extrabold text-lg tracking-tight">N-KGTS LMS</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Platform resmi program National Kaizen Goes To School oleh PT Toyota-Astra Motor.
            </p>
          </div>

          {/* Nav */}
          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Navigasi</p>
            <div className="space-y-2.5">
              {["Tentang Program", "Modul", "FAQ", "Masuk"].map((l) => (
                <a
                  key={l}
                  href={l === "Masuk" ? "/login" : `#${l.toLowerCase().replace(" ", "")}`}
                  className="block text-sm text-white/60 hover:text-accent transition-colors duration-200"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Partner */}
          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Mitra Program</p>
            <div className="bg-white/10 rounded-xl p-4 inline-block">
              <p className="text-white font-bold text-sm">PT Toyota-Astra Motor</p>
              <p className="text-white/50 text-xs mt-0.5">Toyota Berbagi · Bersama Membangun Indonesia</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">
            © 2026 PT Kode Solusi. Dikembangkan untuk PT Toyota-Astra Motor.
          </p>
          <p className="text-white/40 text-xs">
            National Kaizen Goes To School · Fase 4 · 2026
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── MAIN ──────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="font-sans">
      <Navbar />
      <Hero />
      <StatsSection />
      <TentangSection />
      <ModulSection />
      <CTABanner />
      <FAQSection />
      <Footer />
    </main>
  );
}
