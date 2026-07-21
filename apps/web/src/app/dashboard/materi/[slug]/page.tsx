"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  BookOpen,
  BrainCircuit,
  Trophy,
  Edit,
  Save,
  X,
  FileText,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Sidebar
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { API_URL } from "@/lib/api";
import materiModules from "@/lib/materi-data";

interface ModuleProgressState {
  completed: boolean;
  scrollProgress: number;
  scrollTop: number;
  score: number | null;
}

const STORAGE_KEY = "kaizen-module-progress";

const pdfMap: Record<string, string> = {
  "pengenalan-kaizen": "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%201%20(PENGENALAN%20BUDAYA%20KAIZEN)%20(1).pptx",
  "5r": "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%202%20(5R).pptx",
  "6-potensi-bahaya": "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%203%20(6%20POTENSI%20BAHAYA).pptx",
  "7-pemborosan": "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%204%20(7%20PEMBOROSAN).pptx",
  "8-langkah-penyelesaian-masalah": "https://mlgsbknueptsrayfrkts.supabase.co/storage/v1/object/public/lms-files/materi/MATERI%205%20(8%20LANGKAH%20PENYELESAIAN%20MASALAH).pptx"
};

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

  const [dbModule, setDbModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [progress, setProgress] = useState<ModuleProgressState>({ completed: false, scrollProgress: 0, scrollTop: 0, score: null });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [lockedByPrev, setLockedByPrev] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const lastSavedProgressRef = useRef<number>(0);
  const editorRef = useRef<HTMLDivElement>(null);

  // 1. Memuat Info User dari LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user in page", e);
      }
    }
  }, []);

  // 2. Memuat Detail Modul & Kuis dari Database API
  useEffect(() => {
    const fetchModuleDetails = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/materi/modules/${slug}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDbModule(data);
          setHtmlContent(data.deskripsi || "");
        }
      } catch (err) {
        console.error("Gagal memuat detail modul dari database:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModuleDetails();
  }, [slug]);

  // 3. Memuat Progres Awal
  useEffect(() => {
    if (!dbModule) return;

    // Set awal dari local storage
    const initial = getInitialProgress(dbModule.id);
    setProgress(initial);
    setSubmitted(Boolean(initial.score !== null));
    lastSavedProgressRef.current = initial.scrollProgress;

    // Load jawaban kuis dari local storage
    const savedAnswers = window.localStorage.getItem(`${STORAGE_KEY}-answers-${dbModule.id}`);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch {
        setAnswers({});
      }
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
          const dbProgress = data[dbModule.id.toString()];
          const initial = getInitialProgress(dbModule.id);
          
          let nextProgress = initial.scrollProgress;
          let nextCompleted = initial.completed;
          let nextScore = initial.score;

          if (dbProgress) {
            nextProgress = Math.max(initial.scrollProgress, dbProgress.scrollProgress);
            nextCompleted = dbProgress.completed || initial.completed;
            nextScore = dbProgress.score ?? initial.score;
            
            setProgress((current) => {
              const updated = {
                ...current,
                completed: nextCompleted,
                scrollProgress: nextProgress,
                score: nextScore,
              };
              lastSavedProgressRef.current = updated.scrollProgress;
              return updated;
            });
            if (dbProgress.score !== null) {
              setSubmitted(true);
            }
          }
          
          // SINKRONISASI KE DB: Jika progres lokal lebih tinggi atau sudah selesai dibanding DB
          if (!dbProgress || initial.scrollProgress > dbProgress.scrollProgress || (initial.completed && !dbProgress.completed)) {
            await saveProgressToDb(nextProgress, nextCompleted);
          }
        }
      } catch (err) {
        console.error("Gagal memuat progres awal dari database:", err);
      }
    };
    fetchDbProgress();
  }, [dbModule]);

  // 4. Event Listener untuk Scroll Progres Membaca & Sistem Lock Modul
  useEffect(() => {
    if (!dbModule || isEditing) return;

    if (currentUser?.role === "siswa" && dbModule.urutan && dbModule.urutan > 1) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const prev = parsed[(dbModule.id - 1).toString()];
        setLockedByPrev(!(prev && prev.completed));
      } catch {
        setLockedByPrev(true);
      }
    } else {
      setLockedByPrev(false);
    }
  }, [dbModule, isEditing, currentUser]);

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
  }, [dbModule, isEditing, progress.scrollTop]);

  // Fungsi helper untuk menyimpan progres membaca ke database
  const saveProgressToDb = async (percentage: number, isCompleted: boolean) => {
    if (!dbModule) return;
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
          modul_teori_id: dbModule.id,
          scroll_progress: percentage,
          status: isCompleted ? "selesai" : "sedang_dibaca"
        })
      });
    } catch (err) {
      console.error("Gagal sinkronisasi progres ke database:", err);
    }
  };

  // 5. Efek Sinkronisasi Progres ke LocalStorage & Database
  useEffect(() => {
    if (!dbModule || typeof window === "undefined") return;

    // Simpan ke localStorage
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    parsed[dbModule.id] = progress;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    // Kirim ke database jika ada kenaikan progres >= 20%, atau selesai 100%
    const diff = progress.scrollProgress - lastSavedProgressRef.current;
    if (diff >= 20 || progress.scrollProgress === 100 || progress.completed) {
      if (lastSavedProgressRef.current !== progress.scrollProgress) {
        lastSavedProgressRef.current = progress.scrollProgress;
        saveProgressToDb(progress.scrollProgress, progress.completed);
      }
    }
  }, [dbModule, progress]);

  // 6. Efek Penyimpanan Jawaban Kuis ke LocalStorage
  useEffect(() => {
    if (!dbModule || typeof window === "undefined") return;
    window.localStorage.setItem(`${STORAGE_KEY}-answers-${dbModule.id}`, JSON.stringify(answers));
  }, [answers, dbModule]);

  // 7. Simpan Perubahan Artikel WYSIWYG ke Database (Admin/Guru)
  const handleSave = async () => {
    if (!dbModule) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/materi/${dbModule.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deskripsi: htmlContent
        })
      });
      if (res.ok) {
        setDbModule((prev: any) => ({ ...prev, deskripsi: htmlContent }));
        setIsEditing(false);
      } else {
        alert("Gagal menyimpan perubahan artikel.");
      }
    } catch (err) {
      console.error("Gagal menyimpan perubahan artikel ke DB:", err);
      alert("Kesalahan jaringan saat menyimpan artikel.");
    } finally {
      setSaving(false);
    }
  };

  // Exec Editor Formatting Commands
  const execEditorCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const handleAddImage = () => {
    const url = prompt("Masukkan URL gambar ilustrasi (misal dari Unsplash/Cloud):");
    if (url) {
      execEditorCommand("insertImage", url);
      // Berikan style rapi dan responsif secara otomatis ke image yang dimasukkan
      setTimeout(() => {
        if (editorRef.current) {
          const images = editorRef.current.getElementsByTagName("img");
          for (let i = 0; i < images.length; i++) {
            images[i].className = "rounded-2xl my-6 mx-auto max-w-full h-auto shadow-md border border-neutral-100";
          }
          setHtmlContent(editorRef.current.innerHTML);
        }
      }, 50);
    }
  };

  // 8. Submit Kuis
  const handleSubmit = async () => {
    if (!dbModule) return;

    const quizList = dbModule.soal_latihan || [];
    if (quizList.length === 0) return;

    const correctAnswers = quizList.reduce((count: number, item: any, index: number) => {
      return count + (answers[index] === item.jawaban_benar ? 1 : 0);
    }, 0);

    const score = Math.round((correctAnswers / quizList.length) * 100);
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
          modul_teori_id: dbModule.id,
          score
        })
      });
    } catch (err) {
      console.error("Gagal mengirimkan nilai kuis ke database:", err);
    }
  };

  // State loading spinner
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!dbModule) {
    return (
      <div className="px-6 py-8 text-center text-neutral-500">
        <p className="font-bold text-lg">Modul tidak ditemukan</p>
        <Link href="/dashboard/materi" className="mt-4 inline-block text-primary font-semibold hover:underline">
          Kembali ke daftar materi
        </Link>
      </div>
    );
  }

  const completionLabel = progress.completed ? "Selesai" : "Belum selesai";
  const pdfUrl = dbModule?.file_url || (slug && typeof slug === "string" ? pdfMap[slug] : null) || "#";
  const quizList = dbModule.soal_latihan || [];

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header navigasi */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard/materi" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-light">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div className="flex items-center gap-3">
          {/* Tombol Edit khusus Admin */}
          {currentUser?.role === "admin" && (
            <button
              onClick={() => {
                if (isEditing) {
                  setHtmlContent(dbModule.deskripsi || "");
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                isEditing
                  ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                  : "bg-primary hover:bg-primary-light text-white"
              }`}
            >
              {isEditing ? (
                <>
                  <X size={15} /> Batal
                </>
              ) : (
                <>
                  <Edit size={15} /> Edit Artikel
                </>
              )}
            </button>
          )}

          {/* Tombol Toggle Sidebar Ringkasan */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            title={showSidebar ? "Sembunyikan Ringkasan" : "Tampilkan Ringkasan"}
            className="inline-flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 w-9 h-9 transition-all shadow-sm hover:scale-105 active:scale-95"
          >
            <Sidebar size={16} />
          </button>
        </div>
      </div>

      <div className={`grid gap-5 transition-all duration-300 ${showSidebar ? "lg:grid-cols-[2fr_0.6fr]" : "grid-cols-1"}`}>
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm flex flex-col min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">Modul Teori</p>
              <h1 className="text-2xl font-bold text-neutral-900 mt-1">{dbModule.judul}</h1>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${progress.completed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              {completionLabel}
            </div>
          </div>

          <div className="self-start mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-neutral-700">
              <span>Progress belajar Anda</span>
              <span>{Math.max(progress.scrollProgress, progress.score ?? 0)}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={Math.max(progress.scrollProgress, progress.score ?? 0)} color={progress.completed ? "bg-success" : "bg-primary"} />
            </div>
          </div>

          {/* Bagian Artikel / WYSIWYG Editor */}
          {isEditing ? (
            <div className="mt-6 flex flex-col flex-1">
              {/* WYSIWYG Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 bg-neutral-50 border border-neutral-200 rounded-t-xl select-none">
                <button
                  type="button"
                  onClick={() => execEditorCommand("bold")}
                  title="Tebal (Bold)"
                  className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => execEditorCommand("italic")}
                  title="Miring (Italic)"
                  className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                >
                  <Italic size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => execEditorCommand("underline")}
                  title="Garis Bawah (Underline)"
                  className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                >
                  <Underline size={16} />
                </button>
                <div className="h-6 w-px bg-neutral-300 mx-1 align-middle self-center" />
                <button
                  type="button"
                  onClick={() => execEditorCommand("formatBlock", "H2")}
                  title="Judul Bab (Heading 2)"
                  className="px-2.5 py-1 text-xs font-extrabold rounded hover:bg-neutral-200 text-neutral-700"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => execEditorCommand("formatBlock", "H3")}
                  title="Sub-Bab (Heading 3)"
                  className="px-2.5 py-1 text-xs font-bold rounded hover:bg-neutral-200 text-neutral-700"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => execEditorCommand("formatBlock", "P")}
                  title="Paragraf Biasa"
                  className="px-2 py-1 text-xs rounded hover:bg-neutral-200 text-neutral-700"
                >
                  Normal
                </button>
                <div className="h-6 w-px bg-neutral-300 mx-1 align-middle self-center" />
                <button
                  type="button"
                  onClick={() => execEditorCommand("insertUnorderedList")}
                  title="Bullet List"
                  className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => execEditorCommand("insertOrderedList")}
                  title="Number List"
                  className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                >
                  <ListOrdered size={16} />
                </button>
                <div className="h-6 w-px bg-neutral-300 mx-1 align-middle self-center" />
                <button
                  type="button"
                  onClick={handleAddImage}
                  title="Masukkan Gambar Ilustrasi"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded hover:bg-neutral-200 text-primary"
                >
                  <ImageIcon size={15} /> Tambah Gambar
                </button>
              </div>

              {/* contentEditable Div */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: dbModule.deskripsi || "" }}
                className="min-h-[400px] border border-t-0 border-neutral-200 rounded-b-xl p-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white overflow-y-auto prose max-w-none text-neutral-700 leading-8 space-y-4"
              />

              <div className="mt-4 flex items-center gap-3 justify-end">
                <button
                  onClick={() => {
                    setHtmlContent(dbModule.deskripsi || "");
                    setIsEditing(false);
                  }}
                  className="rounded-xl border border-neutral-200 text-neutral-600 px-4 py-2.5 text-sm font-bold transition hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-5 py-2.5 text-sm font-bold transition shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <>Menyimpan...</>
                  ) : (
                    <>
                      <Save size={16} /> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : lockedByPrev ? (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-6 text-center mt-6">
              <p className="text-sm font-semibold text-neutral-800">Modul ini terkunci</p>
              <p className="mt-2 text-sm text-neutral-600">Selesaikan modul sebelumnya terlebih dahulu untuk membuka akses ke materi ini.</p>
              {(() => {
                const prevModule = materiModules.find((m) => m.id === dbModule.urutan - 1);
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
            /* Ruangguru / Zenius Style flowing article view */
            <div
              id="module-content"
              className="mt-6 max-h-[600px] overflow-y-auto pr-2 space-y-6 prose max-w-none text-neutral-700 leading-8"
            >
              {/* Render Rich HTML Artikel */}
              <div
                dangerouslySetInnerHTML={{ __html: dbModule.deskripsi || "" }}
                className="space-y-4
                  prose-h2:text-xl prose-h2:font-extrabold prose-h2:text-neutral-900 prose-h2:pt-4 prose-h2:pb-2
                  prose-h3:text-lg prose-h3:font-bold prose-h3:text-neutral-800 prose-h3:pt-2
                  prose-p:text-neutral-600 prose-p:leading-8
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                  prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                  prose-li:text-neutral-600
                  prose-img:mx-auto prose-img:rounded-2xl prose-img:shadow-sm"
              />

              {/* Section Kuis */}
              {quizList.length > 0 && (
                <section className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-5 mt-10 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <BrainCircuit size={18} />
                    <h2 className="text-lg font-bold text-neutral-900">Kuis Pemahaman</h2>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Selesaikan kuis pemahaman berikut ini untuk menguji pemahaman Anda. Anda dianggap lulus jika skor mencapai minimal 70.
                  </p>
                  
                  <div className="space-y-5 mt-4">
                    {quizList.map((quiz: any, quizIndex: number) => {
                      const options = [quiz.pilihan_a, quiz.pilihan_b, quiz.pilihan_c, quiz.pilihan_d];
                      return (
                        <div key={`${quiz.id}-${quizIndex}`} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                          <p className="text-sm font-bold text-neutral-800">{quizIndex + 1}. {quiz.pertanyaan}</p>
                          <div className="mt-4 space-y-2.5">
                            {options.map((option, optionIndex) => {
                              const selected = answers[quizIndex] === optionIndex;
                              const isCorrectAnswer = optionIndex === quiz.jawaban_benar;

                              let itemStyle = "border-neutral-200 text-neutral-700 bg-neutral-50/10";
                              if (selected) {
                                itemStyle = "border-primary bg-primary/5 text-primary";
                              }

                              if (submitted) {
                                if (isCorrectAnswer) {
                                  itemStyle = "border-success bg-success/5 text-success font-bold";
                                } else if (selected) {
                                  itemStyle = "border-danger bg-danger/5 text-danger";
                                } else {
                                  itemStyle = "border-neutral-200 text-neutral-400 opacity-60";
                                }
                              }

                              return (
                                <label
                                  key={`${quiz.id}-${optionIndex}`}
                                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                    !submitted ? "cursor-pointer hover:border-primary/45" : "cursor-default"
                                  } ${itemStyle}`}
                                >
                                  <input
                                    type="radio"
                                    name={`quiz-${quizIndex}`}
                                    checked={selected}
                                    disabled={submitted}
                                    onChange={() => setAnswers((current) => ({ ...current, [quizIndex]: optionIndex }))}
                                    className="h-4 w-4 accent-primary"
                                  />
                                  <span className="flex-1">{option}</span>
                                  {submitted && isCorrectAnswer && (
                                    <span className="text-success text-xs font-bold bg-success/10 px-2 py-0.5 rounded flex-shrink-0">Benar</span>
                                  )}
                                  {submitted && selected && !isCorrectAnswer && (
                                    <span className="text-danger text-xs font-bold bg-danger/10 px-2 py-0.5 rounded flex-shrink-0">Salah</span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-5 py-3 text-sm font-bold transition-all shadow-md"
                  >
                    Kirim Jawaban Kuis
                  </button>

                  {submitted && progress.score !== null && (
                    <div className={`mt-5 rounded-xl border p-4 text-sm font-semibold ${
                      progress.score >= 70
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-warning/20 bg-warning/10 text-warning"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Trophy size={18} />
                        <span>Skor Kuis Anda: {progress.score}%</span>
                      </div>
                      <p className="mt-1 text-xs opacity-80 font-normal">
                        {progress.score >= 70
                          ? "Selamat! Anda dinyatakan lulus pada kuis modul ini."
                          : "Skor belum mencapai target kelulusan 70%. Silakan coba lagi."}
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        {/* Panel Samping / Info Modul */}
        {showSidebar && (
          <aside className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm self-start">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen size={18} />
              <h2 className="text-base font-bold text-neutral-900">Ringkasan Modul</h2>
            </div>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Durasi Belajar</p>
                <p className="mt-1 font-semibold text-neutral-800">
                  {(() => {
                    const staticModule = materiModules.find((m) => m.id === dbModule.id);
                    return staticModule?.duration || "45 menit";
                  })()}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Status Penyelesaian</p>
                <p className="mt-1 font-semibold text-neutral-800">{progress.completed ? "Lulus / Selesai" : "Belum Selesai"}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Persentase Baca</p>
                <p className="mt-1 font-semibold text-neutral-800">{progress.scrollProgress}%</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Skor Kuis Tertinggi</p>
                <p className="mt-1 font-semibold text-neutral-800">{progress.score !== null ? `${progress.score}%` : "Belum Mengerjakan"}</p>
              </div>
            </div>

            {/* Download Original File Button in Sidebar */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Berkas Asli</p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm"
              >
                <FileText size={15} /> Download PPT/PDF Asli
              </a>
            </div>

            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-accent-dark">
                <Trophy size={18} />
                <h3 className="text-sm font-bold text-neutral-900">Target Belajar</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Silakan baca artikel secara perlahan untuk memahami isinya. Setelah selesai membaca, Anda bisa mencoba kuis kelulusan di bagian bawah artikel.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
