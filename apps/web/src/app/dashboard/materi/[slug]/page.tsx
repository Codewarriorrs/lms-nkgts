"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, BookOpen, BrainCircuit, Trophy } from "lucide-react";
import materiModules, { MateriModule } from "@/lib/materi-data";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ModuleProgressState {
  completed: boolean;
  scrollProgress: number;
  scrollTop: number;
  score: number | null;
}

const STORAGE_KEY = "kaizen-module-progress";

function getInitialProgress(moduleId: number): ModuleProgressState {
  if (typeof window === "undefined") {
    return { completed: false, scrollProgress: 0, scrollTop: 0, score: null };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { completed: false, scrollProgress: 0, scrollTop: 0, score: null };
  }

  try {
    const parsed = JSON.parse(saved) as Record<string, ModuleProgressState>;
    return parsed[moduleId.toString()] ?? { completed: false, scrollProgress: 0, scrollTop: 0, score: null };
  } catch {
    return { completed: false, scrollProgress: 0, scrollTop: 0, score: null };
  }
}

export default function MateriDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const module = useMemo(
    () => materiModules.find((item) => item.slug === slug) ?? materiModules[0],
    [slug]
  );

  const [progress, setProgress] = useState<ModuleProgressState>({ completed: false, scrollProgress: 0, scrollTop: 0, score: null });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [lockedByPrev, setLockedByPrev] = useState(false);

  useEffect(() => {
    setProgress(getInitialProgress(module.id));
    setSubmitted(Boolean(getInitialProgress(module.id).score !== null));
    const savedAnswers = window.localStorage.getItem(`${STORAGE_KEY}-answers-${module.id}`);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch {
        setAnswers({});
      }
    } else {
      setAnswers({});
    }
  }, [module.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (module.id > 1) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const prev = parsed[(module.id - 1).toString()];
        setLockedByPrev(!(prev && prev.completed));
      } catch {
        setLockedByPrev(true);
      }
    } else {
      setLockedByPrev(false);
    }
  }, [module.id]);

  useEffect(() => {
    const container = document.getElementById("module-content");
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercent = Math.min(100, Math.max(0, Math.round(((scrollTop + clientHeight) / scrollHeight) * 100)));
      setProgress((current) => {
        const nextScrollTop = Math.max(current.scrollTop, scrollTop);
        const nextScrollProgress = Math.max(current.scrollProgress, scrollPercent);
        const updated = { ...current, scrollTop: nextScrollTop, scrollProgress: nextScrollProgress };
        if (nextScrollProgress >= 100) {
          updated.completed = true;
        }
        return updated;
      });
    };

    container.addEventListener("scroll", handleScroll);
    const restorePosition = window.setTimeout(() => {
      container.scrollTop = progress.scrollTop;
    }, 80);
    handleScroll();

    return () => {
      window.clearTimeout(restorePosition);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [module.id, progress.scrollTop]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    parsed[module.id] = progress;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }, [module.id, progress]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`${STORAGE_KEY}-answers-${module.id}`, JSON.stringify(answers));
  }, [answers, module.id]);

  const handleSubmit = () => {
    const correctAnswers = module.quiz.reduce((count, item, index) => {
      return count + (answers[index] === item.correct ? 1 : 0);
    }, 0);
    const score = Math.round((correctAnswers / module.quiz.length) * 100);
    const completed = score >= 70;
    setProgress((current) => ({ ...current, completed, score }));
    setSubmitted(true);
  };

  const completionLabel = progress.completed ? "Selesai" : "Belum selesai";

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/materi" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-light">
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_0.6fr]">
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">{module.topic}</p>
              <h1 className="text-2xl font-bold text-neutral-900">{module.title}</h1>
              <p className="mt-2 text-sm text-neutral-500">{module.description}</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${progress.completed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              {completionLabel}
            </div>
          </div>

          <div className="self-start mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-neutral-700">
              <span>Progress modul</span>
              <span>{Math.max(progress.scrollProgress, progress.score ?? 0)}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={Math.max(progress.scrollProgress, progress.score ?? 0)} color={progress.completed ? "bg-success" : "bg-primary"} />
            </div>
          </div>

          <div id="module-content" className="mt-6 max-h-[820px] lg:max-h-[920px] overflow-y-auto pr-2 space-y-6">
            {lockedByPrev ? (
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-6 text-center">
                <p className="text-sm font-semibold text-neutral-800">Modul ini terkunci</p>
                <p className="mt-2 text-sm text-neutral-600">Selesaikan modul sebelumnya terlebih dahulu untuk membuka akses ke materi ini.</p>
                {(() => {
                  const prevModule = materiModules.find((m) => m.id === module.id - 1);
                  if (prevModule) {
                    return (
                      <div className="mt-4">
                        <Link href={`/dashboard/materi/${prevModule.slug}`} className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
                          Buka modul sebelumnya
                        </Link>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              module.sections.map((section, index) => (
                <section key={`${section.title}-${index}`} className="space-y-3 rounded-xl border border-neutral-100 p-4">
                  <h2 className="text-lg font-bold text-neutral-900">{section.title}</h2>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${section.title}-${paragraphIndex}`} className="text-sm leading-7 text-neutral-600">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))
            )}

            <section className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-primary">
                <BrainCircuit size={18} />
                <h2 className="text-lg font-bold text-neutral-900">Quiz pemahaman</h2>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                Selesaikan quiz di bagian bawah untuk mengonfirmasi pemahaman Anda terhadap modul ini.
              </p>
              <div className="mt-4 space-y-4">
                {module.quiz.map((quiz, quizIndex) => (
                  <div key={`${quiz.question}-${quizIndex}`} className="rounded-lg border border-neutral-200 bg-white p-4">
                    <p className="text-sm font-semibold text-neutral-800">{quizIndex + 1}. {quiz.question}</p>
                    <div className="mt-3 space-y-2">
                      {quiz.options.map((option, optionIndex) => {
                        const selected = answers[quizIndex] === optionIndex;
                        return (
                          <label key={`${quiz.question}-${optionIndex}`} className={`flex ${lockedByPrev ? "opacity-60 pointer-events-none" : "cursor-pointer"} items-center gap-3 rounded-lg border px-3 py-2 text-sm ${selected ? "border-primary bg-primary/5 text-primary" : "border-neutral-200 text-neutral-700"}`}>
                            <input
                              type="radio"
                              name={`quiz-${quizIndex}`}
                              checked={selected}
                              onChange={() => setAnswers((current) => ({ ...current, [quizIndex]: optionIndex }))}
                              className="h-4 w-4 accent-primary"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {!lockedByPrev && (
                <button onClick={handleSubmit} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light">
                  Submit jawaban
                </button>
              )}
              {submitted && progress.score !== null && (
                <div className="mt-4 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">
                  Skor quiz Anda: {progress.score}%
                </div>
              )}
            </section>
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm self-start">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen size={16} />
            <h2 className="text-sm font-semibold text-neutral-900">Ringkasan modul</h2>
          </div>
          <div className="space-y-2 text-xs text-neutral-600">
            <div className="rounded-md bg-neutral-50 p-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Durasi</p>
              <p className="mt-1 font-semibold text-neutral-800">{module.duration}</p>
            </div>
            <div className="rounded-md bg-neutral-50 p-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Status</p>
              <p className="mt-1 font-semibold text-neutral-800">{progress.completed ? "Selesai" : "Belum selesai"}</p>
            </div>
            <div className="rounded-md bg-neutral-50 p-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Progress scroll</p>
              <p className="mt-1 font-semibold text-neutral-800">{progress.scrollProgress}%</p>
            </div>
            <div className="rounded-md bg-neutral-50 p-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Nilai quiz</p>
              <p className="mt-1 font-semibold text-neutral-800">{progress.score ?? "Belum ada"}</p>
            </div>
          </div>

          <div className="rounded-md border border-neutral-100 bg-neutral-50 p-3">
            <div className="flex items-center gap-2 text-accent-dark">
              <Trophy size={16} />
              <h3 className="text-xs font-semibold text-neutral-900">Target pencapaian</h3>
            </div>
            <p className="mt-1 text-xs text-neutral-600">
              Baca seluruh isi modul, lalu selesaikan kuis agar status modul berubah menjadi selesai dan nilai muncul di daftar modul.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
