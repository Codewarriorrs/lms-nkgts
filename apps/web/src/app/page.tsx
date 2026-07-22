"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useInView as useMotionInView, useMotionValue, useSpring } from "motion/react";
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
import CardSwap, { Card } from "@/components/ui/CardSwap";

// ── DATA ─────────────────────────────────────────────────────

const navLinks = [
  { label: "Tentang Program", href: "#tentang" },
  { label: "Modul", href: "#modul" },
  { label: "FAQ", href: "#faq" },
];

const stats = [
  {
    icon: School,
    value: 100,
    suffix: "+",
    animate: true,
    label: "Sekolah Terlibat",
    color: "bg-accent/70 text-primary",
  },
  {
    icon: Users,
    value: 250,
    suffix: "+",
    animate: true,
    label: "Siswa Peserta 2026",
    color: "bg-accent/70 text-primary",
  },
  {
    icon: GraduationCap,
    value: 50,
    suffix: "+",
    animate: true,
    label: "Guru Praktisi Bersertifikat",
    color: "bg-accent/70 text-primary",
  },
  {
    icon: Award,
    value: 2014,
    animate: false,
    label: "Tahun Program Dimulai",
    color: "bg-accent/70 text-primary",
  },
];

const moduls = [
  {
    id: 1,
    judul: "Materi Pelatihan",
    deskripsi:
      "Akses materi soft skill problem solving berbasis metodologi Kaizen dalam 5 topik pelatihan terstruktur.",
    icon: BookOpen,
    img: "https://images.unsplash.com/photo-1610500796385-3ffc1ae2f046?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    tag: "Teori",
    link: "/dashboard",
  },
  {
    id: 2,
    judul: "Soal Latihan",
    deskripsi:
      "Uji pemahaman materi melalui soal latihan yang tersedia setelah kamu menyelesaikan setiap topik.",
    icon: ClipboardList,
    img: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    tag: "Evaluasi",
    link: "/dashboard",
  },
  {
    id: 3,
    judul: "Tugas Praktek",
    deskripsi:
      "Kerjakan dan kumpulkan tugas praktek yang diberikan guru langsung melalui platform LMS.",
    icon: Briefcase,
    img: "https://images.unsplash.com/photo-1589087394593-e1f8a7d30fed?q=80&w=1467&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    tag: "Praktek",
    link: "/dashboard/tugas",
  },
  {
    id: 4,
    judul: "Project Kaizen",
    deskripsi:
      "Daftarkan, jalankan, dan laporkan progress project kaizen kamu secara berkala dengan template terstruktur.",
    icon: FolderKanban,
    img: "https://images.unsplash.com/photo-1557734864-c78b6dfef1b1?q=80&w=1634&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    tag: "Project",
    link: "/dashboard/project",
  },
  {
    id: 5,
    judul: "Penilaian & Feedback",
    deskripsi:
      "Terima penilaian dan feedback langsung dari Guru Praktisi Kaizen untuk setiap tugas dan project.",
    icon: BarChart2,
    img: "https://images.unsplash.com/photo-1664382953518-4a664ab8a8c9?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    tag: "Feedback",
    link: "/dashboard",
  },
  {
    id: 6,
    judul: "Sertifikasi",
    deskripsi:
      "Raih Sertifikat Partisipasi Kaizen dan Sertifikat Penyelesaian Project setelah menuntaskan program.",
    icon: Award,
    img: "https://images.unsplash.com/photo-1667967699372-1c26d40dec46?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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

function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  onStart,
  onEnd,
}: {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  const isInView = useMotionInView(ref, { once: true, margin: "0px" });

  const getDecimalPlaces = useCallback((num: number) => {
    const str = num.toString();

    if (str.includes(".")) {
      const decimals = str.split(".")[1];

      if (parseInt(decimals, 10) !== 0) {
        return decimals.length;
      }
    }

    return 0;
  }, []);

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;

      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };

      const formattedNumber = Intl.NumberFormat("en-US", options).format(latest);

      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, separator]
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === "down" ? to : from);
    }
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof onStart === "function") onStart();

      const timeoutId = window.setTimeout(() => {
        motionValue.set(direction === "down" ? from : to);
      }, delay * 1000);

      const durationTimeoutId = window.setTimeout(() => {
        if (typeof onEnd === "function") onEnd();
      }, delay * 1000 + duration * 1000);

      return () => {
        window.clearTimeout(timeoutId);
        window.clearTimeout(durationTimeoutId);
      };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}

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
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (stored && token) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse user in landing page navbar", e);
      }
    }
  }, []);

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
            {currentUser ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="bg-accent text-neutral-900 text-sm font-bold px-4 py-2 rounded-lg hover:bg-accent-dark transition-all duration-200 hover:shadow-md cursor-pointer"
                >
                  Ke Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white font-bold border-2 border-accent transition-transform hover:scale-105 cursor-pointer overflow-hidden"
                  title={`Profil ${currentUser.name}`}
                >
                  {currentUser.avatar && (currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("/") || currentUser.avatar.startsWith("data:image")) ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0D8ABC&color=fff&bold=true`;
                      }}
                    />
                  ) : (
                    <span>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}</span>
                  )}
                </Link>
              </div>
            ) : (
              <>
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
              </>
            )}
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
          {currentUser ? (
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/dashboard"
                className="block w-full text-center bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-light transition"
              >
                Ke Dashboard
              </a>
              <a
                href="/dashboard/profile"
                className="block w-full text-center bg-neutral-100 text-neutral-700 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-neutral-200 transition"
              >
                Profil Saya ({currentUser.name})
              </a>
            </div>
          ) : (
            <a
              href="/login"
              className="block w-full text-center bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-light transition mt-2"
            >
              Masuk ke Platform
            </a>
          )}
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
    <section className="relative min-h-screen bg-primary flex items-center overflow-visible lg:overflow-hidden">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-28 sm:pb-32 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className={`transition-all duration-700 lg:-mt-36 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
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
          <div className={`flex justify-center items-center transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="relative w-full max-w-[320px] md:max-w-[420px] lg:max-w-[520px] px-4 sm:px-0 mt-16 sm:mt-20 lg:mt-0">
              <CardSwap
                width="100%"
                height="280px"
                cardDistance={15}
                verticalDistance={15}
                delay={4500}
                pauseOnHover={false}
                skewAmount={3}
                easing="elastic"
              >
                <Card>
                  <img
                    src="https://kabarterdepan.com/wp-content/uploads/2023/10/WhatsApp-Image-2023-10-03-at-18.06.03.webp"
                    alt="Preview 1"
                    className="h-full w-full rounded-[10px] object-cover transform-gpu backface-hidden will-change-transform ring-1 ring-transparent"
                  />
                </Card>
                <Card>
                  <img
                    src="https://vibes.koranjuri.com/wp-content/uploads/2024/08/IMG_20240829_181517.jpg"
                    alt="Preview 2"
                    className="h-full w-full rounded-[10px] object-cover transform-gpu backface-hidden will-change-transform ring-1 ring-transparent"
                  />
                </Card>
                <Card>
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKxYTpWnysl034eJwiHM-PLkdCzhg6zx1_NULPTye2aNXFopwCg7I3iMPX&s=10"
                    alt="Preview 3"
                    className="h-full w-full rounded-[10px] object-cover transform-gpu backface-hidden will-change-transform ring-1 ring-transparent"
                  />
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce" style={{ animationDuration: "2s" }}>
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
              <p className="text-3xl font-extrabold text-neutral-900 leading-none">
                {s.animate ? (
                  <CountUp from={0} to={Number(s.value)} duration={1.4} className="inline-block" />
                ) : (
                  <span>{s.value}</span>
                )}
                {s.suffix ? <span>{s.suffix}</span> : null}
              </p>
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
              className="inline-flex items-center gap-2 bg-accent text-neutral-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-dark transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              Masuk ke Platform <ChevronRight size={16} />
            </a>
          </div>

          {/* 8 Langkah visual */}
          <div>
            <p className="inline-block bg-accent text-neutral-900 text-xs font-bold uppercase rounded-full tracking-wider mb-4 px-3 py-1.5"> 
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

// ── FITUR ─────────────────────────────────────────────────────

function ModulSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <section id="modul" className="relative overflow-hidden bg-primary py-24 text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-20 opacity-20" style={{ backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)", backgroundSize: "200% 100%" }} />
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-32 opacity-20" preserveAspectRatio="none">
          <path d="M0,224L48,208C96,192,192,160,288,154C384,148,480,168,576,176C672,184,768,180,864,160C960,140,1056,104,1152,96C1248,88,1344,108,1392,118L1440,128L1440,320L0,320Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block bg-accent text-neutral-900 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            Fitur Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Apa yang Bisa Kamu Lakukan
            <br />
            <span className="text-accent">di Platform Ini?</span>
          </h2>
          <p className="text-white/75 text-sm mt-3 max-w-lg mx-auto">
            Enam aktivitas terstruktur untuk mendukung seluruh proses pelatihan Kaizen dari awal hingga sertifikasi.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {moduls.map((m, i) => {
            const cardContent = (
              <>
                <img
                  src={m.img}
                  alt={m.judul}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-primary/35" />

                <div className="relative flex min-h-[280px] flex-col justify-between p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-[#F5C400]/40 bg-[#F5C400] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-900 backdrop-blur-sm">
                      {m.tag}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5C400] text-neutral-900 shadow-sm">
                      <m.icon size={16} />
                    </div>
                  </div>

                  <div className="mt-25">
                    <h3 className="text-lg font-bold leading-snug text-white">{m.judul}</h3>
                    <p className="text-sm leading-relaxed text-white/80 mt-3">{m.deskripsi}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm font-medium text-white/80">
                  </div>
                </div>
              </>
            );

            const cardClassName = `group relative h-full overflow-hidden rounded-2xl border border-white/10 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer block ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`;
            const cardStyle = { transitionDelay: `${i * 80}ms` };

            if (m.link) {
              return (
                <Link
                  key={m.id}
                  href={m.link}
                  className={cardClassName}
                  style={cardStyle}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div
                key={m.id}
                className={cardClassName}
                style={cardStyle}
              >
                {cardContent}
              </div>
            );
          })}
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
            <div className="bg-white/10 rounded-xl p-4 inline-block">
              <p className="text-white font-bold text-sm">PT Toyota-Astra Motor</p>
              <p className="text-white/50 text-xs mt-0.5">Toyota Berbagi · Bersama Membangun Indonesia</p>
              <img src="/logo-toyota-berbagi.png" alt="Logo Toyota Berbagi" className="block mx-auto h-28 w-auto object-contain mt-2 rounded p-0.5" />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">
            © 2026 PT Toyota-Astra Motor.
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
