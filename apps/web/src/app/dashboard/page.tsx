"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  ClipboardList,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookMarked,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { MateriCard } from "@/components/dashboard/MateriCard";
import { ProgressBar } from "@/components/ui/ProgressBar";

// ── DATA DUMMY ──────────────────────────────────────────────
const user = {
  name: "Budi Santoso",
  school: "SMK Negeri 1 Semarang",
  avatar: "BS",
};

const stats = [
  { label: "Materi Diakses", value: 8, total: 15, icon: BookOpen, color: "text-primary" },
  { label: "Tugas Selesai", value: 3, total: 5, icon: ClipboardList, color: "text-success" },
  { label: "Laporan Progress", value: 2, total: null, icon: FolderKanban, color: "text-accent-dark" },
];

const materiLanjutkan = [
  {
    id: 1,
    topik: "Topik 3",
    judul: "Diagram Pareto & Analisis Data",
    progress: 60,
    durasi: "45 menit",
    tag: "Teori",
    tagColor: "bg-primary/10 text-primary",
  },
  {
    id: 2,
    topik: "Topik 4",
    judul: "Diagram Tulang Ikan (Fishbone)",
    progress: 20,
    durasi: "30 menit",
    tag: "Teori",
    tagColor: "bg-primary/10 text-primary",
  },
  {
    id: 3,
    topik: "Topik 2",
    judul: "Checksheet & Pengumpulan Data",
    progress: 100,
    durasi: "30 menit",
    tag: "Selesai",
    tagColor: "bg-success/10 text-success",
  },
  {
    id: 4,
    topik: "Topik 1",
    judul: "Pengenalan Metodologi Kaizen",
    progress: 100,
    durasi: "60 menit",
    tag: "Selesai",
    tagColor: "bg-success/10 text-success",
  },
];

const recentMateri = [
  {
    id: 1,
    judul: "Diagram Pareto & Analisis Data",
    topik: "Topik 3",
    lastAccessed: "Hari ini, 09.30",
    progress: 60,
  },
  {
    id: 2,
    judul: "Checksheet & Pengumpulan Data",
    topik: "Topik 2",
    lastAccessed: "Kemarin, 14.00",
    progress: 100,
  },
];

const tugasBelumDikumpulkan = [
  {
    id: 1,
    judul: "Identifikasi Masalah Area Praktik",
    deadline: "Besok, 23.59",
    urgent: true,
  },
  {
    id: 2,
    judul: "Laporan Observasi Lingkungan",
    deadline: "3 hari lagi",
    urgent: false,
  },
];

const statusProject = {
  judul: "Optimasi Alur Kerja Bengkel Otomotif",
  status: "Disetujui",
  statusColor: "bg-success/10 text-success border border-success/30",
  lastUpdate: "2 hari lalu",
  progress: 35,
};

// ── HELPERS ─────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Selamat Pagi");
  const [currentUser, setCurrentUser] = useState({
    name: "Budi Santoso",
    school: "SMK Negeri 1 Semarang",
    avatar: "BS",
  });

  useEffect(() => {
    setGreeting(getGreeting());
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* Left scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        {/* Greeting Banner */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
            {greeting}, <span className="text-primary">{currentUser.name.split(" ")[0]}</span>
          </h1>
          <p className="text-neutral-400 text-xs font-semibold mt-1">
            Lanjutkan progres belajar Anda untuk menyelesaikan program Kaizen Goes To School.
          </p>
        </div>

        {/* Banner Announcement */}
        <div className="bg-neutral-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-neutral-800 shadow-sm">
          <div className="space-y-2.5 max-w-xl">
            <span className="bg-accent text-neutral-900 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              N-KGTS 2026
            </span>
            <h3 className="text-white font-bold text-lg sm:text-xl leading-snug">
              Program National Kaizen Goes To School
            </h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Selesaikan seluruh modul teori, latihan soal, dan project Kaizen untuk mendapatkan sertifikasi resmi dari PT Toyota-Astra Motor.
            </p>
          </div>
          
          <button className="bg-white hover:bg-accent text-neutral-900 text-xs font-bold px-5 py-3 rounded-lg transition-colors duration-200 shrink-0">
            Lihat Sertifikasi →
          </button>
        </div>

        {/* Stats Grid */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Ringkasan Aktivitas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {stats.map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 100} />
            ))}
          </div>
        </div>

        {/* Lanjutkan Belajar Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Lanjutkan Belajar
            </h2>
            <a
              href="/dashboard/materi"
              className="text-xs font-bold text-primary hover:text-primary-light flex items-center gap-1 transition-colors duration-200"
            >
              Lihat Semua <ChevronRight size={14} />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {materiLanjutkan.map((item, i) => (
              <MateriCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar Panel */}
      <aside className="hidden xl:flex flex-col w-80 flex-shrink-0 border-l border-neutral-100 bg-white px-6 py-8 space-y-8 overflow-y-auto">
        {/* Recent Materi */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <BookMarked size={14} className="text-neutral-400" />
            Materi Terkini
          </h3>
          <div className="space-y-3">
            {recentMateri.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100/50 transition-colors duration-200 cursor-pointer border border-neutral-100/50 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-neutral-900 text-xs font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
                    {m.judul}
                  </p>
                  {m.progress === 100 ? (
                    <CheckCircle2 size={15} className="text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock size={15} className="text-warning flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <p className="text-neutral-400 text-[10px] font-bold tracking-wider mt-2 uppercase">{m.topik}</p>
                <div className="mt-3.5 space-y-1.5">
                  <ProgressBar
                    value={m.progress}
                    color={m.progress === 100 ? "bg-success" : "bg-primary"}
                  />
                  <p className="text-neutral-400 text-[10px] font-semibold mt-1">{m.lastAccessed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Pending */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle size={14} className="text-neutral-400" />
            Tugas Pending
          </h3>
          <div className="space-y-3">
            {tugasBelumDikumpulkan.map((t) => (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-colors duration-200 cursor-pointer ${
                  t.urgent
                    ? "bg-danger/5 border-danger/20 hover:border-danger/30"
                    : "bg-neutral-50 border-neutral-100 hover:border-neutral-200"
                }`}
              >
                <p className="text-neutral-900 text-xs font-bold leading-snug line-clamp-2">
                  {t.judul}
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Clock
                    size={13}
                    className={t.urgent ? "text-danger" : "text-neutral-400"}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      t.urgent ? "text-danger" : "text-neutral-400"
                    }`}
                  >
                    Deadline: {t.deadline}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Kaizen Status */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <FolderKanban size={14} className="text-neutral-400" />
            Project Kaizen
          </h3>
          <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors duration-200 cursor-pointer">
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <p className="text-neutral-900 text-xs font-bold leading-snug flex-1">
                {statusProject.judul}
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusProject.statusColor}`}
              >
                {statusProject.status}
              </span>
            </div>
            <p className="text-neutral-400 text-xs font-medium mb-4">
              Diperbarui {statusProject.lastUpdate}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-neutral-400">
                <span>Progress Keseluruhan</span>
                <span className="font-bold text-primary">{statusProject.progress}%</span>
              </div>
              <ProgressBar value={statusProject.progress} color="bg-accent-dark" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
