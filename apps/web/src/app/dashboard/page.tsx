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

const statusProject = {
  judul: "Optimasi Alur Kerja Bengkel Otomotif",
  status: "Disetujui",
  statusColor: "bg-success/10 text-success border border-success/30",
  lastUpdate: "2 hari lalu",
  progress: 35,
};

const STORAGE_KEY = "kaizen-module-progress";

function getAllProgress(): Record<string, any> {
  if (typeof window === "undefined") return {};
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

// ── HELPERS ─────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

const ProfileCard = ({ user }: { user: any }) => {
  if (!user) return null;
  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    guru: "bg-blue-100 text-blue-700",
    siswa: "bg-green-100 text-green-700"
  };
  const displayName = user.nama || user.name || "Nama Pengguna";
  const displayRole = user.role || "siswa";
  const displaySchool = user.sekolah?.nama_sekolah || user.sekolah_nama || user.school || "N-KGTS Pusat";
  const displayClass = user.kelas || "-";
  const avatarUrl = user.foto_profil || user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm max-w-sm shrink-0">
      <img
        src={avatarUrl}
        alt={displayName}
        className="w-12 h-12 rounded-full object-cover border border-neutral-100 shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";
        }}
      />
      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-neutral-900 text-sm truncate">{displayName}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${roleColors[displayRole] || "bg-neutral-100 text-neutral-700"}`}>
            {displayRole}
          </span>
          {displayRole === "siswa" && (
            <span className="text-[10px] text-neutral-500 font-bold">
              Kelas {displayClass}
            </span>
          )}
        </div>
        <p className="text-[10px] text-neutral-400 font-semibold mt-1 truncate">{displaySchool}</p>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Selamat Pagi");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [tugasPending, setTugasPending] = useState<any[]>([]);

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
        const localData = getAllProgress();
        if (!token) {
          setProgressMap(localData);
          return;
        }
        const res = await fetch(`${API_URL}/materi/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const dbData = await res.json();
          // Database is the absolute Source of Truth
          const updatedMap: Record<string, any> = {};

          for (const [key, dbVal] of Object.entries(dbData as Record<string, any>)) {
            updatedMap[key] = {
              completed: Boolean(dbVal.completed),
              scrollProgress: dbVal.scrollProgress || 0,
              score: dbVal.score ?? null,
            };
          }

          // Update localstorage to match Database state exactly
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("kaizen-module-progress", JSON.stringify(updatedMap));
            } catch (e) {}
          }

          setProgressMap(updatedMap);
        } else {
          setProgressMap(localData);
        }
      } catch (err) {
        console.error("Gagal mengambil progres dari database:", err);
        setProgressMap(getAllProgress());
      }
    };
    fetchProgress();
  }, []);

  // Fetch real pending tasks from database
  useEffect(() => {
    const fetchPendingTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/tugas-praktek/status-siswa`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter tasks that do not have any submissions
          const pending = data.filter((t: any) => !t.submisi || t.submisi.length === 0);
          setTugasPending(pending);
        }
      } catch (err) {
        console.error("Gagal mengambil tugas pending:", err);
      }
    };
    fetchPendingTasks();
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

  if (currentUser?.role === "guru" || currentUser?.role === "admin") {
    return <TeacherDashboard />;
  }

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* Left scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        {/* Top Banner and Profile Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
              {greeting}, <span className="text-primary">{currentUser.nama || currentUser.name}</span>
            </h1>
            <p className="text-neutral-400 text-xs font-semibold mt-1">
              Lanjutkan progres belajar Anda untuk menyelesaikan program Kaizen Goes To School.
            </p>
          </div>
          <ProfileCard user={currentUser} />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <StatCard
              key={i}
              label={stat.label}
              value={stat.value}
              total={stat.total}
              icon={stat.icon}
              color={stat.color}
              delay={i * 100}
            />
          ))}
        </div>

        {/* Lanjutkan Belajar Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-neutral-950 uppercase tracking-wider">
              Lanjutkan Belajar
            </h2>
            <Link
              href="/dashboard/materi"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              Semua Materi <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {materiLanjutkan.map((m, idx) => (
              <MateriCard
                key={m.id}
                item={m}
                index={idx}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar Widgets */}
      <aside className="w-80 border-l border-neutral-100 bg-white p-6 space-y-8 overflow-y-auto hidden xl:block flex-shrink-0">
        {/* Recent Materials */}
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
            {tugasPending.map((t) => (
              <Link
                key={t.id}
                href="/dashboard/tugas"
                className="block p-4 rounded-xl border transition-colors duration-200 cursor-pointer bg-neutral-50 border-neutral-100 hover:border-neutral-200"
              >
                <p className="text-neutral-900 text-xs font-bold leading-snug line-clamp-2">
                  {t.judul}
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Clock
                    size={13}
                    className="text-neutral-400"
                  />
                  <span className="text-xs font-semibold text-neutral-400">
                    Belum dikerjakan
                  </span>
                </div>
              </Link>
            ))}
            {tugasPending.length === 0 && (
              <p className="text-xs text-neutral-400 italic text-center py-4">Tidak ada tugas pending.</p>
            )}
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
