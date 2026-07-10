"use client";

import { useState, useEffect, useMemo } from "react";
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
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { MateriCard } from "@/components/dashboard/MateriCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import materiModules from "@/lib/materi-data";
import { API_URL } from "@/lib/api";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});

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
    setIsLoaded(true);
  }, []);

  // Fetch real-time progress map from backend database
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/materi/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProgressMap(data);
        }
      } catch (err) {
        console.error("Gagal mengambil progres dari database:", err);
      }
    };
    fetchProgress();
  }, []);

  // Compute real-time stats count
  const stats = useMemo(() => {
    const accessedCount = Object.values(progressMap).filter(
      (p: any) => p.scrollProgress > 0 || (p.score !== null && p.score > 0)
    ).length;

    return [
      { label: "Materi Diakses", value: accessedCount, total: 5, icon: BookOpen, color: "text-primary" },
      { label: "Tugas Selesai", value: 0, total: 0, icon: ClipboardList, color: "text-success" },
      { label: "Laporan Progress", value: accessedCount >= 5 ? 100 : Math.round((accessedCount / 5) * 100), total: null, icon: FolderKanban, color: "text-accent-dark" },
    ];
  }, [progressMap]);

  // Compute real-time Materi Lanjutkan (first 4 modules)
  const materiLanjutkan = useMemo(() => {
    return materiModules.slice(0, 4).map((module) => {
      const progress = progressMap[module.id.toString()] ?? { completed: false, scrollProgress: 0, score: null };
      const percent = Math.max(progress.scrollProgress, progress.score ?? 0);
      const isCompleted = progress.completed || (progress.score ?? 0) >= 70;
      return {
        id: module.id,
        topik: module.topic,
        judul: module.title,
        progress: percent,
        durasi: module.duration,
        slug: module.slug,
        tag: isCompleted ? "Selesai" : "Teori",
        tagColor: isCompleted ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
      };
    });
  }, [progressMap]);

  // Compute active recent materi list (highest progress first)
  const recentMateri = useMemo(() => {
    const active = materiModules
      .map((module) => {
        const progress = progressMap[module.id.toString()] ?? { completed: false, scrollProgress: 0, score: null };
        const percent = Math.max(progress.scrollProgress, progress.score ?? 0);
        return {
          id: module.id,
          judul: module.title,
          topik: module.topic,
          progress: percent,
          slug: module.slug,
          lastAccessed: percent > 0 ? "Baru saja diakses" : "Belum diakses",
        };
      })
      .filter((m) => m.progress > 0);

    if (active.length > 0) return active.slice(0, 2);

    // Fallback to first 2 modules if no progress yet
    return materiModules.slice(0, 2).map((m) => ({
      id: m.id,
      judul: m.title,
      topik: m.topic,
      progress: 0,
      slug: m.slug,
      lastAccessed: "Belum diakses",
    }));
  }, [progressMap]);

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (currentUser?.role === "guru") {
    return <TeacherDashboard />;
  }

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
              <Link key={item.id} href={`/dashboard/materi/${(item as any).slug}`}>
                <MateriCard item={item} index={i} />
              </Link>
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
              <Link
                key={m.id}
                href={`/dashboard/materi/${m.slug}`}
                className="block p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100/50 transition-colors duration-200 cursor-pointer border border-neutral-100/50 group"
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
              </Link>
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
