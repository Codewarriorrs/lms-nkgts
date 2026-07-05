"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, Sparkles } from "lucide-react";
import materiModules from "@/lib/materi-data";
import { ProgressBar } from "@/components/ui/ProgressBar";

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

export default function MateriPage() {
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgressState>>({});

  useEffect(() => {
    setProgressMap(getAllProgress());
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
        {modules.map((module) => {
          const isCompleted = module.progress.completed || (module.progress.score ?? 0) >= 70;
          return (
            <Link
              key={module.id}
              href={`/dashboard/materi/${module.slug}`}
              className="group rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
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

              <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                <span className="text-primary">Buka modul</span>
                <span className="text-neutral-400">{module.percent}%</span>
              </div>
            </Link>
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
