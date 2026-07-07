"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, BookOpen, BrainCircuit, Trophy } from "lucide-react";
import materiModules, { MateriModule } from "@/lib/materi-data";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { API_URL } from "@/lib/api";

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

  // Menyimpan progres terakhir yang berhasil disimpan ke database untuk mencegah request berlebih
  const lastSavedProgressRef = useRef<number>(0);

  // 1. Memuat progres awal (gabungan localStorage + Database)
  useEffect(() => {
    // Set awal dari local storage
    const initial = getInitialProgress(module.id);
    setProgress(initial);
    setSubmitted(Boolean(initial.score !== null));
    lastSavedProgressRef.current = initial.scrollProgress;

    // Load jawaban kuis dari local storage
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

    // Ambil progres ter-update dari database
    const fetchDbProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/materi/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const dbProgress = data[module.id.toString()];
          if (dbProgress) {
            setProgress((current) => {
              const updated = {
                ...current,
                completed: dbProgress.completed || current.completed,
                scrollProgress: Math.max(current.scrollProgress, dbProgress.scrollProgress),
                score: dbProgress.score ?? current.score,
              };
              lastSavedProgressRef.current = updated.scrollProgress;
              return updated;
            });
            if (dbProgress.score !== null) {
              setSubmitted(true);
            }
          }
        }
      } catch (err) {
        console.error("Gagal memuat progres awal dari database:", err);
      }
    };
    fetchDbProgress();
  }, [module.id]);

  // 2. Event Listener untuk Scroll
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

  // Fungsi helper untuk menyimpan progres membaca ke database
  const saveProgressToDb = async (percentage: number, isCompleted: boolean) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API_URL}/materi/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          modul_teori_id: module.id,
          scroll_progress: percentage,
          status: isCompleted ? "selesai" : "sedang_dibaca"
        })
      });
    } catch (err) {
      console.error("Gagal sinkronisasi progres ke database:", err);
    }
  };

  // 3. Efek Sinkronisasi Progres ke LocalStorage & Database (Hanya jika perubahan >= 5%)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Simpan ke localStorage
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    parsed[module.id] = progress;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    // Kirim ke database hanya jika ada kenaikan progres >= 5% atau selesai 100%
    const diff = progress.scrollProgress - lastSavedProgressRef.current;
    if (diff >= 5 || (progress.scrollProgress === 100 && lastSavedProgressRef.current < 100)) {
      lastSavedProgressRef.current = progress.scrollProgress;
      saveProgressToDb(progress.scrollProgress, progress.completed);
    }
  }, [module.id, progress]);

  // 4. Efek Penyimpanan Jawaban Kuis ke LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`${STORAGE_KEY}-answers-${module.id}`, JSON.stringify(answers));
  }, [answers, module.id]);

  // 5. Submit Kuis
  const handleSubmit = async () => {
    const correctAnswers = module.quiz.reduce((count, item, index) => {
      return count + (answers[index] === item.correct ? 1 : 0);
    }, 0);
    const score = Math.round((correctAnswers / module.quiz.length) * 100);
    const completed = score >= 70;

    setProgress((current) => ({ ...current, completed, score }));
    setSubmitted(true);

    // Kirim nilai kuis ke database
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API_URL}/materi/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          modul_teori_id: module.id,
          score
        })
      });
    } catch (err) {
      console.error("Gagal mengirimkan nilai kuis ke database:", err);
    }
  };

  const completionLabel = progress.completed ? "Selesai" : "Belum selesai";

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/materi" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-light">
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
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

          <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-neutral-700">
              <span>Progress modul</span>
              <span>{Math.max(progress.scrollProgress, progress.score ?? 0)}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={Math.max(progress.scrollProgress, progress.score ?? 0)} color={progress.completed ? "bg-success" : "bg-primary"} />
            </div>
          </div>

          <div id="module-content" className="mt-6 max-h-[520px] overflow-y-auto pr-2 space-y-6">
            {module.sections.map((section, index) => (
              <section key={`${section.title}-${index}`} className="space-y-3 rounded-xl border border-neutral-100 p-4">
                <h2 className="text-lg font-bold text-neutral-900">{section.title}</h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${section.title}-${paragraphIndex}`} className="text-sm leading-7 text-neutral-600">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

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
                          <label key={`${quiz.question}-${optionIndex}`} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${selected ? "border-primary bg-primary/5 text-primary" : "border-neutral-200 text-neutral-700"}`}>
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
              <button onClick={handleSubmit} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light">
                Submit jawaban
              </button>
              {submitted && progress.score !== null && (
                <div className="mt-4 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">
                  Skor quiz Anda: {progress.score}%
                </div>
              )}
            </section>
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen size={18} />
            <h2 className="text-base font-bold text-neutral-900">Ringkasan modul</h2>
          </div>
          <div className="space-y-3 text-sm text-neutral-600">
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Durasi</p>
              <p className="mt-1 font-semibold text-neutral-800">{module.duration}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Status</p>
              <p className="mt-1 font-semibold text-neutral-800">{progress.completed ? "Selesai" : "Belum selesai"}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Progress scroll</p>
              <p className="mt-1 font-semibold text-neutral-800">{progress.scrollProgress}%</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Nilai quiz</p>
              <p className="mt-1 font-semibold text-neutral-800">{progress.score ?? "Belum ada"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-accent-dark">
              <Trophy size={18} />
              <h3 className="text-sm font-bold text-neutral-900">Target pencapaian</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Baca seluruh isi modul, lalu selesaikan kuis agar status modul berubah menjadi selesai dan nilai muncul di daftar modul.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
