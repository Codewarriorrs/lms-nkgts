"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ═══ Types ═══ */
interface Slide {
  year: string;
  tag: string;
  title: string;
  body: string;
  stats: [string, string][];
  note?: string;
  list?: string[];
}

/* ═══ Page ═══ */
export default function Home() {
  const [s, setS] = useState(0);
  const [faq, setFaq] = useState<number | null>(null);
  const [mob, setMob] = useState(false);

  /* Journey slides */
  const slides: Slide[] = [
    {
      year: "2022 – 2026", tag: "N-KGTS",
      title: "N-KGTS JOURNEY",
      body: "Program CSR PT Toyota-Astra Motor untuk memberdayakan guru & siswa SMK dalam budaya Kaizen — perbaikan berkelanjutan ala Toyota.",
      stats: [["4 Fase", "Program"], ["CSR", "Toyota-Astra Motor"]],
      note: "Mencetak inovator masa depan Indonesia.",
    },
    {
      year: "2022", tag: "FASE 1",
      title: "Program Dimulai",
      body: "85 sekolah di 7 provinsi. Guru terpilih melaksanakan proyek kaizen berdampak nyata di lingkungan sekolah.",
      stats: [["85", "Sekolah"], ["7", "Provinsi"]],
      list: ["Fondasi karakter DEKKI ditanamkan."],
    },
    {
      year: "2023", tag: "FASE 2",
      title: "Pendampingan Hybrid",
      body: "Praktek implementasi didampingi TAM secara online & tatap muka. Kontes Komunikasi Kaizen digelar.",
      stats: [["Hybrid", "Webinar & Training"], ["5", "Sekolah Terbaik"]],
      note: "5 sekolah terpilih menjadi Kandidat Ambassador.",
    },
    {
      year: "2024", tag: "FASE 3",
      title: "Sertifikasi & Ambassador",
      body: "TAM memberikan sertifikasi kepada 5 Sekolah Ambassador dan 17 Guru Praktisi Kaizen bersertifikat.",
      stats: [["5", "Ambassador"], ["17", "Guru Praktisi"]],
    },
    {
      year: "2026", tag: "FASE 4",
      title: "Penguatan Budaya Kaizen",
      body: "Fokus mengasah soft-skill problem solving 210 siswa SMK, selaras kebutuhan industri & arahan Dinas Pendidikan.",
      stats: [["210", "Siswa"], ["7", "SMK Sasaran"]],
      note: "FGD bersama Dinas Pendidikan & DUDI.",
    },
    {
      year: "2026", tag: "T-TEP",
      title: "Ekspansi T-TEP",
      body: "Jangkauan N-KGTS diperluas ke 2 sekolah mitra Toyota Technical Education Program unggulan.",
      stats: [["2", "Sekolah T-TEP"], ["Mitra", "Toyota Technical"]],
      list: ["SMK Negeri 26 Jakarta", "SMK Negeri 2 Surabaya"],
    },
  ];

  const next = () => setS((p) => (p + 1) % slides.length);
  const prev = () => setS((p) => (p === 0 ? slides.length - 1 : p - 1));
  useEffect(() => { const id = setInterval(next, 7000); return () => clearInterval(id); }, []);

  /* Slide bg */
  const slideBg = [
    "bg-primary", "bg-[#2980b9]", "bg-primary-dark",
    "bg-[#1a7a4c]", "bg-[#c65d1a]", "bg-accent",
  ];
  const slideTextDark = s === 5;

  /* Nav */
  const links = [
    { l: "Beranda", h: "#hero" },
    { l: "Tentang", h: "#about" },
    { l: "Modul", h: "#modul" },
    { l: "FAQ", h: "#faq" },
  ];

  /* FAQ */
  const faqs = [
    { q: "Apa itu program N-KGTS?", a: "N-KGTS (National Kaizen Goes To School) adalah program CSR PT Toyota-Astra Motor yang melatih guru dan siswa SMK dalam metodologi Kaizen — budaya perbaikan berkelanjutan ala Toyota. Program ini telah berjalan sejak 2022 dan kini memasuki Fase 4 dengan sasaran 210 siswa dari 7 SMK." },
    { q: "Siapa saja yang menggunakan LMS ini?", a: "LMS digunakan oleh tiga peran: Admin (pengelola sistem), Guru Praktisi Kaizen bersertifikat (instruktur), dan Siswa SMK peserta program N-KGTS. Setiap peran memiliki akses dan dashboard yang berbeda." },
    { q: "Apakah siswa bisa langsung mengerjakan soal?", a: "Tidak. Siswa harus membuka dan membaca materi teori terlebih dahulu. Soal latihan baru dapat diakses setelah materi pada topik terkait berstatus \"sudah diakses\"." },
    { q: "Bagaimana alur Project Kaizen siswa?", a: "Siswa mendaftarkan judul proyek → Guru mereview dan menyetujui → Siswa mengisi laporan progress berkala mengikuti langkah-langkah Kaizen → Siswa mengumpulkan hasil akhir berupa dokumen PDF → Guru menilai dan memberikan feedback." },
    { q: "Sertifikasi apa yang diperoleh setelah program?", a: "Dua jenis: Sertifikat Partisipasi Kaizen (setelah menyelesaikan materi & ujian) dan Sertifikat Penyelesaian Project (setelah mempresentasikan dan melaporkan proyek Kaizen)." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-700">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2.5">
            <img src="/logo-kaizen-lLOIwLqFwQetrVPO.avif" alt="Logo Kaizen" className="h-9 w-auto object-contain" />
            <div className="leading-none">
              <div className="text-[15px] font-bold text-primary tracking-tight">N-KGTS</div>
              <div className="text-[10px] font-semibold text-neutral-400 tracking-[0.12em] uppercase">LMS Platform</div>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((n) => (
              <a key={n.h} href={n.h} className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-primary hover:bg-neutral-50 rounded-lg transition-colors">{n.l}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden md:flex px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-light rounded-lg transition-colors">Masuk</Link>
            <button onClick={() => setMob(!mob)} className="md:hidden p-2 text-neutral-400 hover:text-primary rounded-lg hover:bg-neutral-50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mob ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {mob && (
          <div className="md:hidden bg-white border-t border-neutral-100 px-4 sm:px-6 pb-4">
            {links.map((n) => <a key={n.h} href={n.h} onClick={() => setMob(false)} className="block py-2.5 text-sm font-semibold text-neutral-700 hover:text-primary">{n.l}</a>)}
            <Link href="/login" onClick={() => setMob(false)} className="block mt-2 w-full py-2.5 text-center text-sm font-bold text-white bg-primary rounded-lg">Masuk</Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="hero" className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div className="inline-block px-3 py-1 mb-6 text-[11px] font-bold tracking-widest uppercase bg-white/10 border border-white/15 rounded-full">
                Toyota Astra Motor · Fase 4 · 2026
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight">
                Membentuk Budaya <span className="text-accent">Kaizen</span> di Sekolah
              </h1>
              <p className="mt-5 text-base sm:text-lg text-white/75 leading-[1.7] max-w-lg">
                Platform LMS terintegrasi untuk mendukung program National Kaizen Goes To School. Mempermudah pembelajaran teori, monitoring proyek, serta pembentukan karakter DEKKI bagi siswa SMK.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/login" className="px-7 py-3 text-sm font-bold bg-accent text-neutral-900 hover:bg-accent-dark rounded-lg transition-colors">
                  Masuk ke LMS
                </Link>
                <a href="#modul" className="px-7 py-3 text-sm font-bold text-white border border-white/25 hover:bg-white/10 rounded-lg transition-colors">
                  Lihat Modul
                </a>
              </div>
              <div className="flex gap-10 mt-10 pt-6 border-t border-white/10">
                {[["210", "Siswa"], ["7", "SMK"], ["30+", "Guru"], ["5", "Topik"]].map(([v, l]) => (
                  <div key={l}>
                    <div className="text-2xl font-extrabold text-accent">{v}</div>
                    <div className="text-[11px] text-white/50 font-semibold uppercase tracking-wide mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Slider */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/5 border border-white/10">
              <div className={`p-8 sm:p-10 min-h-[380px] sm:min-h-[430px] flex flex-col justify-between transition-colors duration-500 ${slideTextDark ? "text-neutral-900" : "text-white"} ${slideBg[s]}`}>
                <div className="flex items-center justify-between border-b pb-3 border-current/15">
                  <span className="text-xs font-bold tracking-widest uppercase bg-current/10 px-3 py-1 rounded-full">{slides[s].year}</span>
                  <span className="text-[11px] font-bold tracking-widest uppercase opacity-60">{slides[s].tag}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-3 my-6">
                  <h2 className={`text-2xl sm:text-3xl font-extrabold italic uppercase tracking-tight ${slideTextDark ? "text-primary-dark" : "text-accent"}`}>{slides[s].title}</h2>
                  <p className="text-sm sm:text-base opacity-85 leading-relaxed font-medium">{slides[s].body}</p>
                  {slides[s].list && <ul className="list-disc pl-5 text-sm font-semibold space-y-0.5 opacity-80">{slides[s].list!.map((e, i) => <li key={i}>{e}</li>)}</ul>}
                  {slides[s].note && <p className="text-xs opacity-55 font-semibold">{slides[s].note}</p>}
                </div>
                <div className="flex gap-8 pt-3 border-t border-current/10">
                  {slides[s].stats.map(([v, l], i) => (
                    <div key={i}><span className="text-2xl font-extrabold leading-none">{v}</span><span className="block text-[10px] opacity-50 mt-0.5 font-semibold uppercase tracking-wider">{l}</span></div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                <button onClick={prev} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={next} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="absolute bottom-3.5 left-7 hidden sm:flex gap-1">
                {slides.map((_, i) => <button key={i} onClick={() => setS(i)} className={`h-2 rounded-full transition-all duration-300 ${s === i ? "w-5 bg-white" : "w-2 bg-white/30"}`} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT — Asymmetric 2-col ── */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Left text (3 cols) */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">Tentang Program</p>
            <h2 className="text-3xl font-bold text-neutral-900 leading-tight">
              National Kaizen Goes To School
            </h2>
            <p className="mt-4 text-base text-neutral-700 leading-[1.7]">
              N-KGTS merupakan inisiatif CSR unggulan <strong className="text-neutral-900">PT Toyota-Astra Motor</strong> yang melatih guru dan siswa SMK dalam metodologi Kaizen — budaya perbaikan berkelanjutan ala Toyota. Pada Fase 4 tahun 2026, program ini berfokus pada penguatan budaya kaizen secara masif dengan sasaran <strong className="text-neutral-900">210 siswa dari 7 SMK terpilih</strong>.
            </p>
            <p className="mt-3 text-base text-neutral-700 leading-[1.7]">
              Siswa dipandu menguasai 8 Langkah Kaizen Toyota dan tools standar industri (Checksheet, Grafik, Diagram Pareto, Diagram Fishbone) untuk menyelesaikan masalah nyata di lingkungan sekolah. Setiap siswa juga dibekali pembentukan karakter <strong className="text-neutral-900">DEKKI</strong> — Disiplin, Empati, Kritis, Kreatif, Inovatif.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {["Disiplin", "Empati", "Kritis", "Kreatif", "Inovatif"].map((c) => (
                <span key={c} className="text-xs font-semibold px-3 py-1 bg-primary/8 text-primary rounded-full">{c}</span>
              ))}
            </div>
          </div>

          {/* Right cards (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="text-sm font-bold text-neutral-900 mb-1">Kaizen Tools yang Diajarkan</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Checksheet", "Grafik", "Diagram Pareto", "Diagram Fishbone"].map((t) => (
                  <span key={t} className="text-xs font-semibold px-2.5 py-1 bg-accent/12 text-accent-dark rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="text-sm font-bold text-neutral-900 mb-1">Sertifikasi Siswa</div>
              <ul className="mt-2 space-y-2 text-sm text-neutral-700 leading-relaxed">
                <li className="flex gap-2 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span><strong>Sertifikat Partisipasi</strong> — memahami 8 langkah + tools kaizen</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-dark shrink-0" />
                  <span><strong>Sertifikat Penyelesaian Project</strong> — presentasi & laporan proyek</span>
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-primary text-white">
              <div className="text-sm font-bold mb-1">Skala Program</div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                {[["7", "SMK"], ["210", "Siswa"], ["17+", "Guru"], ["5", "Topik"]].map(([v, l]) => (
                  <div key={l}>
                    <div className="text-xl font-extrabold text-accent">{v}</div>
                    <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wide">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODUL (6 cards, varied layout) ── */}
      <section id="modul" className="bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">Fitur Utama</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <h2 className="text-3xl font-bold text-neutral-900">Modul Sistem LMS</h2>
            <p className="text-sm text-neutral-400 max-w-sm">6 modul terintegrasi untuk mendukung administrasi sekolah & proses belajar-mengajar.</p>
          </div>

          {/* Top row — 2 large cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {[
              { title: "Manajemen Pengguna & Sekolah", desc: "Admin dapat mengelola akun Guru & Siswa, mendaftarkan data sekolah, serta melakukan import massal pengguna melalui file Excel/CSV secara instan.", accent: "border-t-primary" },
              { title: "Materi Teori & Latihan Soal", desc: "Guru mengupload modul PDF dan menyematkan video YouTube. Siswa mengakses materi lalu mengerjakan latihan soal pilihan ganda & essay — dengan sistem tracking otomatis.", accent: "border-t-primary-light" },
            ].map((m) => (
              <div key={m.title} className={`p-8 rounded-2xl bg-white border border-neutral-100 shadow-md border-t-[3px] ${m.accent}`}>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{m.title}</h3>
                <p className="text-sm text-neutral-700 leading-[1.6]">{m.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom row — 4 smaller cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Tugas Praktek", desc: "Siswa mengumpulkan hasil praktek (PDF/gambar). Guru memberikan penilaian angka + feedback tertulis.", accent: "bg-primary" },
              { title: "Project Kaizen", desc: "Registrasi judul project, laporan progress berkala mengikuti langkah Kaizen, dan pengumpulan dokumen final.", accent: "bg-accent-dark" },
              { title: "Penilaian & Rekap", desc: "Nilai otomatis untuk pilihan ganda. Essay dinilai guru. Ekspor rekapitulasi ke Excel.", accent: "bg-primary-light" },
              { title: "Dashboard & Monitoring", desc: "Dashboard per role. Guru memonitor progress siswa. Admin melihat rekap lintas sekolah.", accent: "bg-[#1a7a4c]" },
            ].map((m) => (
              <div key={m.title} className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-md">
                <div className={`w-8 h-1 rounded-full ${m.accent} mb-4`} />
                <h3 className="text-base font-semibold text-neutral-900 mb-1.5">{m.title}</h3>
                <p className="text-sm text-neutral-700 leading-[1.6]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl bg-neutral-900 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">Siap untuk memulai?</h2>
            <p className="text-sm text-white/60 leading-[1.7] mb-6">
              Masuk ke platform LMS untuk mengakses materi teori, mengerjakan latihan soal, mengelola tugas praktek, dan memulai proyek Kaizen Anda.
            </p>
            <Link href="/login" className="inline-block px-7 py-3 text-sm font-bold bg-accent text-neutral-900 hover:bg-accent-dark rounded-lg transition-colors">
              Masuk ke LMS
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">Bantuan</p>
          <h2 className="text-3xl font-bold text-neutral-900 mb-10">Pertanyaan Umum</h2>

          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl bg-white border border-neutral-100 overflow-hidden">
                <button onClick={() => setFaq(faq === i ? null : i)}
                  className="w-full px-6 py-5 text-left text-[15px] font-semibold text-neutral-900 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                  <span>{f.q}</span>
                  <svg className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${faq === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${faq === i ? "max-h-60" : "max-h-0"}`}>
                  <p className="px-6 pb-5 text-sm text-neutral-700 leading-[1.7]">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="flex flex-col lg:flex-row justify-between gap-10 pb-10 border-b border-white/10">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo-kaizen-lLOIwLqFwQetrVPO.avif" alt="Logo Kaizen" className="h-8 w-auto object-contain bg-white rounded p-0.5" />
                <span className="text-lg font-bold tracking-tight">N-KGTS LMS</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">Platform pembelajaran digital untuk guru & siswa SMK dalam menguasai budaya perbaikan berkelanjutan ala Toyota.</p>
              <div className="flex gap-5 text-sm font-semibold text-white/50 mt-4">
                <a href="#faq" className="hover:text-accent transition-colors">FAQ</a>
                <a href="#about" className="hover:text-accent transition-colors">Kontak</a>
                <a href="#modul" className="hover:text-accent transition-colors">Dukungan</a>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 lg:self-end">
              <div className="px-5 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider">CSR Partner</span>
                <p className="text-sm font-bold mt-0.5">PT Toyota-Astra Motor</p>
              </div>
              <div className="px-5 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider">Developed By</span>
                <p className="text-sm font-bold mt-0.5">PT Kode Solusi</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[11px] text-white/25 gap-3">
            <p>© 2026 N-KGTS LMS. All rights reserved.</p>
            <p>Kerja Praktik</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
