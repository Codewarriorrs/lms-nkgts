"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, Sparkles, Lock } from "lucide-react";
import materiModules from "@/lib/materi-data";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { API_URL } from "@/lib/api";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

interface ModuleProgressState {
  completed: boolean;
  scrollProgress: number;
  score: number | null;
}

const STORAGE_KEY = "kaizen-module-progress";

function getAllProgress(): Record<string, ModuleProgressState> {
  if (typeof window === "undefined") return {};

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return {};

  try {
    return JSON.parse(saved) as Record<string, ModuleProgressState>;
  } catch {
    return {};
  }
}

const pptxLinks: Record<number, string> = {
  1: "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%201%20(PENGENALAN%20BUDAYA%20KAIZEN)%20(1).pptx",
  2: "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%202%20(5R).pptx",
  3: "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%203%20(6%20POTENSI%20BAHAYA).pptx",
  4: "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%204%20(7%20PEMBOROSAN).pptx",
  5: "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%205%20(8%20LANGKAH%20PENYELESAIAN%20MASALAH).pptx"
};

export default function MateriPage() {
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgressState>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {}
        }
        if (!token) {
          setProgressMap(getAllProgress());
          setIsLoaded(true);
          return;
        }
        const res = await fetch(`${API_URL}/materi/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProgressMap(data);
        } else {
          setProgressMap(getAllProgress());
        }
      } catch (err) {
        console.error("Gagal mengambil progres dari database, menggunakan lokal:", err);
        setProgressMap(getAllProgress());
      } finally {
        setIsLoaded(true);
      }
    };
    fetchProgress();
  }, []);

  const modules = useMemo(() => {
    return materiModules.map((module) => {
      const progress = progressMap[module.id.toString()] ?? { completed: false, scrollProgress: 0, score: null };
      const percent = Math.max(progress.scrollProgress, progress.score ?? 0);
      return {
        ...module,
        progress,
        percent,
      };
    });
  }, [progressMap]);

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (currentUser?.role === "admin") {
    return <TeacherDashboard tab="materi" />;
  }

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          Materi Pelatihan
        </h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">
          Pilih salah satu dari 5 modul materi Kaizen untuk dibuka dan lanjutkan belajar Anda.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {modules.map((module, idx) => {
          const isCompleted = module.progress.completed || (module.progress.score ?? 0) >= 70;
          const locked = currentUser?.role !== "guru" && currentUser?.role !== "admin" && idx > 0 && !(modules[idx - 1].progress.completed || (modules[idx - 1].progress.score ?? 0) >= 70);

          const cardClass = `group rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md ${locked ? 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-sm' : ''}`;

          return locked ? (
            <div key={module.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">{module.topic}</p>
                  <h3 className="mt-1 text-lg font-bold text-neutral-900">{module.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{module.description}</p>
                </div>
                <div className="text-neutral-400 flex items-center gap-2">
                  <Lock size={16} /> <span className="text-sm">Terkunci</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs font-semibold text-neutral-400">
                <span>{module.duration}</span>
                <span>Belum tersedia</span>
              </div>

              <div className="mt-3">
                <ProgressBar value={module.percent} color={isCompleted ? "bg-success" : "bg-primary"} />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                <span className="text-neutral-400">Terkunci</span>
                <span className="text-neutral-400">{module.percent}%</span>
              </div>
            </div>
          ) : (
            <div
              key={module.id}
              className={cardClass}
            >
              <Link href={`/dashboard/materi/${module.slug}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">{module.topic}</p>
                    <h3 className="mt-1 text-lg font-bold text-neutral-900">{module.title}</h3>
                    <p className="mt-2 text-sm text-neutral-600">{module.description}</p>
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : (
                    <Circle size={18} className="text-neutral-300" />
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between text-xs font-semibold text-neutral-400">
                  <span>{module.duration}</span>
                  <span>{isCompleted ? "Selesai" : "Belum selesai"}</span>
                </div>

                <div className="mt-3">
                  <ProgressBar value={module.percent} color={isCompleted ? "bg-success" : "bg-primary"} />
                </div>
              </Link>

              <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                <Link href={`/dashboard/materi/${module.slug}`} className="text-primary hover:underline">
                  Buka modul
                </Link>
                {pptxLinks[module.id] && (
                  <a
                    href={pptxLinks[module.id]}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-primary transition flex items-center gap-1 border border-neutral-200 rounded px-2 py-1 bg-neutral-50 hover:bg-neutral-100"
                  >
                    Unduh Slide (.pptx)
                  </a>
                )}
                <span className="text-neutral-400">{module.percent}%</span>
              </div>
            </div>

          );
        })}
      </div>

      <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles size={18} />
          <h3 className="text-sm font-bold text-neutral-900">Tips belajar</h3>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Scroll sampai akhir modul, lalu isi kuis untuk mengubah status modul menjadi selesai dan melihat nilai progres di daftar materi.
        </p>
      </div>
    </div>
  );
}
