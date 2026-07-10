"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ClipboardList,
  FolderKanban,
  CheckCircle2,
  X,
  Search,
  ChevronRight,
  BookOpen,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Clock,
  Bold,
  Italic,
  Heading,
  List,
  Code,
  Image as ImageIcon,
  Check,
  Undo,
  Redo,
  FileText,
  AlertCircle
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface TeacherDashboardProps {
  tab?: "ringkasan" | "tugas" | "project" | "progres" | "materi";
}

export default function TeacherDashboard({ tab = "ringkasan" }: TeacherDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data states
  const [studentsProgress, setStudentsProgress] = useState<any[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<any[]>([]);
  const [projectSubmissions, setProjectSubmissions] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [latsolQuestions, setLatsolQuestions] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Selected details
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTaskSubmisi, setSelectedTaskSubmisi] = useState<any | null>(null);
  const [selectedProjectSubmisi, setSelectedProjectSubmisi] = useState<any | null>(null);

  // Review & Grading form state
  const [gradingScore, setGradingScore] = useState<number | "">("");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingRevisiFile, setGradingRevisiFile] = useState<{ name: string; url: string } | null>(null);
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Materi editing state
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSlug, setModuleSlug] = useState("");
  const [moduleUrutan, setModuleUrutan] = useState(1);
  const [moduleContentHtml, setModuleContentHtml] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);

  // Editor Sub-tabs inside Kelola Materi
  const [editorSubTab, setEditorSubTab] = useState<"konten" | "kuis" | "latsol">("konten");

  // Soal Latihan (Kuis Modul) editing state
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptA, setNewOptA] = useState("");
  const [newOptB, setNewOptB] = useState("");
  const [newOptC, setNewOptC] = useState("");
  const [newOptD, setNewOptD] = useState("");
  const [newCorrectAnswer, setNewCorrectAnswer] = useState<number>(0);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Latihan Soal (Latsol Mandiri - Google Forms style) editing state
  const [isAddingLatsol, setIsAddingLatsol] = useState(false);
  const [latsolPertanyaan, setLatsolPertanyaan] = useState("");
  const [latsolPilihan, setLatsolPilihan] = useState<string[]>(["", ""]);
  const [latsolJawabanBenar, setLatsolJawabanBenar] = useState<number>(0);
  const [latsolPoin, setLatsolPoin] = useState<number>(10);
  const [latsolImageUrl, setLatsolImageUrl] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const latsolImageInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }), [token]);

  // Load dashboard data
  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [progRes, tpRes, pkRes, modRes] = await Promise.all([
        fetch(`${API_URL}/materi/students-progress`, { headers }),
        fetch(`${API_URL}/tugas-praktek/all`, { headers }),
        fetch(`${API_URL}/project-kaizen/all`, { headers }),
        fetch(`${API_URL}/materi/all-modules`, { headers })
      ]);

      if (progRes.ok) setStudentsProgress(await progRes.json());
      if (tpRes.ok) setTaskSubmissions(await tpRes.json());
      if (pkRes.ok) setProjectSubmissions(await pkRes.json());
      if (modRes.ok) setModules(await modRes.json());

    } catch (err) {
      console.error("Gagal memuat data dashboard guru:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Fetch Latsol questions when selectedModule changes
  const loadLatsolQuestions = async (moduleId: number) => {
    try {
      const res = await fetch(`${API_URL}/latsol/modules/${moduleId}`, { headers });
      if (res.ok) {
        setLatsolQuestions(await res.json());
      }
    } catch (err) {
      console.error("Gagal memuat soal latihan:", err);
    }
  };

  useEffect(() => {
    if (selectedModule && !isCreatingModule) {
      loadLatsolQuestions(selectedModule.id);
    } else {
      setLatsolQuestions([]);
    }
  }, [selectedModule, isCreatingModule]);

  // Populate editor once when module is selected
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = moduleContentHtml;
    }
  }, [selectedModule?.id, isCreatingModule]);

  // Compute stats
  const stats = useMemo(() => {
    const totalSiswa = studentsProgress.length;
    const tugasPending = taskSubmissions.filter((t) => t.nilai === null).length;
    const projectPending = projectSubmissions.filter((p) => p.nilai === null).length;
    return { totalSiswa, tugasPending, projectPending };
  }, [studentsProgress, taskSubmissions, projectSubmissions]);

  // Classes list
  const classesList = useMemo(() => {
    const classes = new Set<string>();
    studentsProgress.forEach((s) => {
      if (s.kelas) classes.add(s.kelas);
    });
    return ["Semua", ...Array.from(classes)];
  }, [studentsProgress]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return studentsProgress.filter((student) => {
      const matchSearch = student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = selectedClass === "Semua" || student.kelas === selectedClass;
      return matchSearch && matchClass;
    });
  }, [studentsProgress, searchQuery, selectedClass]);

  // Filtered Task Submissions
  const filteredTasks = useMemo(() => {
    return taskSubmissions.filter((task) => {
      const matchSearch = task.siswa.nama.toLowerCase().includes(searchQuery.toLowerCase());
      let matchStatus = true;
      if (statusFilter === "Belum Dinilai") matchStatus = task.nilai === null;
      if (statusFilter === "Sudah Dinilai") matchStatus = task.nilai !== null;
      return matchSearch && matchStatus;
    });
  }, [taskSubmissions, searchQuery, statusFilter]);

  // Filtered Project Submissions
  const filteredProjects = useMemo(() => {
    return projectSubmissions.filter((proj) => {
      const matchSearch = proj.siswa.nama.toLowerCase().includes(searchQuery.toLowerCase());
      let matchStatus = true;
      if (statusFilter === "Belum Dinilai") matchStatus = proj.nilai === null;
      if (statusFilter === "Sudah Dinilai") matchStatus = proj.nilai !== null;
      return matchSearch && matchStatus;
    });
  }, [projectSubmissions, searchQuery, statusFilter]);

  // Handle grading Task
  const handleGradeTask = async () => {
    if (!selectedTaskSubmisi || gradingScore === "" || !token) return;
    try {
      setSubmittingGrade(true);
      const res = await fetch(`${API_URL}/tugas-praktek/submisi/${selectedTaskSubmisi.id}/grade`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          nilai: Number(gradingScore),
          catatan_guru: gradingFeedback
        })
      });
      if (res.ok) {
        setSelectedTaskSubmisi(null);
        setGradingScore("");
        setGradingFeedback("");
        loadData();
      } else {
        alert("Gagal menyimpan nilai kuis/tugas.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Handle grading/reviewing Project Kaizen
  const handleGradeProject = async () => {
    if (!selectedProjectSubmisi || gradingScore === "" || !token) return;
    try {
      setSubmittingGrade(true);
      const body: any = {
        nilai: Number(gradingScore),
        catatan_guru: gradingFeedback
      };
      if (gradingRevisiFile) {
        body.file_revisi_url = gradingRevisiFile.url;
        body.file_revisi_name = gradingRevisiFile.name;
      }
      const res = await fetch(`${API_URL}/project-kaizen/review/${selectedProjectSubmisi.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setSelectedProjectSubmisi(null);
        setGradingScore("");
        setGradingFeedback("");
        setGradingRevisiFile(null);
        loadData();
      } else {
        alert("Gagal mereview proyek.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Handle local file read for project revision upload
  const handleUploadRevisi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setGradingRevisiFile({
        name: file.name,
        url: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Executive commands for rich contentEditable WYSIWYG
  const execEditorCommand = (command: string, value: string = "") => {
    if (editorRef.current) {
      document.execCommand(command, false, value);
      setModuleContentHtml(editorRef.current.innerHTML);
    }
  };

  // Image insertion into contentEditable
  const handleInsertImageToEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      execEditorCommand("insertImage", base64Url);
    };
    reader.readAsDataURL(file);
  };

  // Module Submit (Create / Edit)
  const handleSubmitModule = async () => {
    if (!moduleTitle || !moduleSlug || !token) return;
    try {
      const body = {
        judul: moduleTitle,
        deskripsi: moduleContentHtml,
        slug: moduleSlug,
        urutan: Number(moduleUrutan)
      };

      let res;
      if (selectedModule && !isCreatingModule) {
        res = await fetch(`${API_URL}/materi/edit/${selectedModule.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(body)
        });
      } else {
        res = await fetch(`${API_URL}/materi/create`, {
          method: "POST",
          headers,
          body: JSON.stringify(body)
        });
      }

      if (res.ok) {
        setIsCreatingModule(false);
        setSelectedModule(null);
        setModuleTitle("");
        setModuleSlug("");
        setModuleUrutan(1);
        setModuleContentHtml("");
        loadData();
      } else {
        alert("Gagal menyimpan modul.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus modul ini beserta kuisnya?")) return;
    try {
      const res = await fetch(`${API_URL}/materi/${moduleId}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        if (selectedModule?.id === moduleId) setSelectedModule(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Question (Kuis Modul Pemahaman)
  const handleAddQuestion = async () => {
    if (!selectedModule || !newQuestionText || !newOptA || !newOptB || !token) return;
    try {
      const res = await fetch(`${API_URL}/materi/soal/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          modul_teori_id: selectedModule.id,
          pertanyaan: newQuestionText,
          pilihan_a: newOptA,
          pilihan_b: newOptB,
          pilihan_c: newOptC || "-",
          pilihan_d: newOptD || "-",
          jawaban_benar: newCorrectAnswer
        })
      });

      if (res.ok) {
        setNewQuestionText("");
        setNewOptA("");
        setNewOptB("");
        setNewOptC("");
        setNewOptD("");
        setNewCorrectAnswer(0);
        setIsAddingQuestion(false);
        // Refresh
        const updatedModRes = await fetch(`${API_URL}/materi/all-modules`, { headers });
        if (updatedModRes.ok) {
          const updatedModules = await updatedModRes.json();
          setModules(updatedModules);
          const freshModule = updatedModules.find((m: any) => m.id === selectedModule.id);
          if (freshModule) setSelectedModule(freshModule);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Question (Kuis Modul)
  const handleDeleteQuestion = async (soalId: number) => {
    if (!confirm("Hapus soal latihan ini?")) return;
    try {
      const res = await fetch(`${API_URL}/materi/soal/${soalId}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        const updatedModRes = await fetch(`${API_URL}/materi/all-modules`, { headers });
        if (updatedModRes.ok) {
          const updatedModules = await updatedModRes.json();
          setModules(updatedModules);
          const freshModule = updatedModules.find((m: any) => m.id === selectedModule.id);
          if (freshModule) setSelectedModule(freshModule);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Latsol Google Forms Handlers
  const handleLatsolImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLatsolImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddLatsolChoice = () => {
    setLatsolPilihan((p) => [...p, ""]);
  };

  const handleRemoveLatsolChoice = (idx: number) => {
    if (latsolPilihan.length <= 2) return;
    setLatsolPilihan((p) => p.filter((_, i) => i !== idx));
    if (latsolJawabanBenar >= latsolPilihan.length - 1) {
      setLatsolJawabanBenar(0);
    }
  };

  const handleLatsolChoiceChange = (idx: number, val: string) => {
    setLatsolPilihan((p) => {
      const copy = [...p];
      copy[idx] = val;
      return copy;
    });
  };

  // Submit Latsol Question to Database
  const handleSaveLatsolQuestion = async () => {
    if (!selectedModule || !latsolPertanyaan.trim() || !token) return;
    const filteredChoices = latsolPilihan.map((c) => c.trim()).filter((c) => c !== "");
    if (filteredChoices.length < 2) {
      alert("Masukkan minimal 2 pilihan jawaban yang tidak kosong.");
      return;
    }
    if (latsolJawabanBenar >= filteredChoices.length) {
      alert("Index kunci jawaban di luar jumlah pilihan.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/latsol/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          modul_teori_id: selectedModule.id,
          pertanyaan: latsolPertanyaan,
          pilihan: filteredChoices,
          jawaban_benar: latsolJawabanBenar,
          poin: latsolPoin,
          image_url: latsolImageUrl
        })
      });

      if (res.ok) {
        setLatsolPertanyaan("");
        setLatsolPilihan(["", ""]);
        setLatsolJawabanBenar(0);
        setLatsolPoin(10);
        setLatsolImageUrl(null);
        setIsAddingLatsol(false);
        loadLatsolQuestions(selectedModule.id);
      } else {
        const error = await res.json();
        alert("Gagal menambahkan soal: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Latsol Question
  const handleDeleteLatsolQuestion = async (id: number) => {
    if (!confirm("Hapus butir soal latihan ini?")) return;
    try {
      const res = await fetch(`${API_URL}/latsol/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        loadLatsolQuestions(selectedModule.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select module for editing
  const selectModuleForEdit = (mod: any) => {
    setSelectedModule(mod);
    setModuleTitle(mod.judul);
    setModuleSlug(mod.slug);
    setModuleUrutan(mod.urutan);
    setModuleContentHtml(mod.deskripsi || "");
    setIsCreatingModule(false);
    setEditorSubTab("konten");
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-6 w-full max-w-7xl mx-auto">
      
      {/* ── TAB 1: RINGKASAN ── */}
      {tab === "ringkasan" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Dashboard Guru</h1>
            <p className="text-neutral-400 text-xs font-semibold mt-1">
              Kelola aktivitas pembelajaran dan pantau perkembangan proyek Kaizen di sekolah Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-neutral-100 p-5 flex items-center gap-4 hover:border-neutral-200 transition shadow-xs">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Users size={20} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs font-semibold uppercase">Siswa Terdaftar</p>
                <p className="text-neutral-900 font-bold text-2xl mt-1">{stats.totalSiswa}</p>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/tugas")}
              className="bg-white rounded-xl border border-neutral-100 p-5 flex items-center gap-4 hover:border-neutral-200 transition cursor-pointer shadow-xs"
            >
              <div className="p-3 rounded-lg bg-warning/10 text-warning">
                <ClipboardList size={20} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs font-semibold uppercase">Tugas Butuh Penilaian</p>
                <p className="text-neutral-900 font-bold text-2xl mt-1 text-warning">{stats.tugasPending}</p>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/project")}
              className="bg-white rounded-xl border border-neutral-100 p-5 flex items-center gap-4 hover:border-neutral-200 transition cursor-pointer shadow-xs"
            >
              <div className="p-3 rounded-lg bg-danger/10 text-danger">
                <FolderKanban size={20} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs font-semibold uppercase">Proyek Kaizen Butuh Review</p>
                <p className="text-neutral-900 font-bold text-2xl mt-1 text-danger">{stats.projectPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-neutral-800 shadow-sm text-white">
            <div className="space-y-2">
              <span className="bg-accent text-neutral-900 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                Budaya Kaizen 2026
              </span>
              <h3 className="font-bold text-lg leading-snug">National Kaizen Goes To School</h3>
              <p className="text-neutral-400 text-xs leading-relaxed max-w-xl">
                Gunakan tab "Kelola Materi & Kuis" untuk menambahkan modul teori baru, mengedit artikel pembelajaran, serta mengedit butir soal kuis latihan secara visual.
              </p>
            </div>
            <button 
              onClick={() => router.push("/dashboard/materi")}
              className="bg-white hover:bg-accent text-neutral-900 text-xs font-bold px-5 py-3 rounded-lg transition shrink-0"
            >
              Kelola Materi Teori →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-xl border border-neutral-100 space-y-3 shadow-xs">
              <h3 className="font-bold text-sm text-neutral-900">Butuh Penilaian Segera</h3>
              <p className="text-xs text-neutral-400">Daftar tugas praktikum yang dikumpulkan siswa dan belum diberi skor.</p>
              <div className="divide-y divide-neutral-100">
                {taskSubmissions.filter((t) => t.nilai === null).slice(0, 3).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-neutral-800">{item.siswa.nama}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{item.tugas_praktek.judul}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedTaskSubmisi(item); setGradingScore(item.nilai || ""); setGradingFeedback(item.catatan_guru || ""); }}
                      className="text-primary hover:text-primary-light font-bold text-xs"
                    >
                      Nilai →
                    </button>
                  </div>
                ))}
                {taskSubmissions.filter((t) => t.nilai === null).length === 0 && (
                  <p className="text-xs text-neutral-400 italic py-3">Semua tugas observasi siswa sudah dinilai.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-100 space-y-3 shadow-xs">
              <h3 className="font-bold text-sm text-neutral-900">Review Proyek Kaizen Kelompok</h3>
              <p className="text-xs text-neutral-400">Unduhan dokumen proposal/laporan siswa yang menunggu pemeriksaan.</p>
              <div className="divide-y divide-neutral-100">
                {projectSubmissions.filter((p) => p.nilai === null).slice(0, 3).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-neutral-800">{item.siswa.nama}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Berkas: {item.file_name} ({item.tipe.toUpperCase()})</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedProjectSubmisi(item); setGradingScore(item.nilai || ""); setGradingFeedback(item.catatan_guru || ""); }}
                      className="text-primary hover:text-primary-light font-bold text-xs"
                    >
                      Periksa →
                    </button>
                  </div>
                ))}
                {projectSubmissions.filter((p) => p.nilai === null).length === 0 && (
                  <p className="text-xs text-neutral-400 italic py-3">Semua berkas proyek siswa sudah diperiksa.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TUGAS PRAKTIKUM ── */}
      {tab === "tugas" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Daftar Tugas Praktikum Siswa</h1>
              <p className="text-neutral-400 text-xs font-semibold mt-1">
                Tinjau laporan dan berikan nilai observasi area praktikum siswa.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari siswa..."
                  className="pl-8 pr-4 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none cursor-pointer font-bold"
              >
                <option value="Semua">Semua Status</option>
                <option value="Belum Dinilai">Belum Dinilai</option>
                <option value="Sudah Dinilai">Sudah Dinilai</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 font-extrabold uppercase border-b border-neutral-100">
                    <th className="px-6 py-4">Siswa</th>
                    <th className="px-6 py-4">Tugas</th>
                    <th className="px-6 py-4">Nilai</th>
                    <th className="px-6 py-4">Tanggal Kumpul</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-neutral-400 italic">Tidak ada berkas tugas ditemukan.</td>
                    </tr>
                  ) : (
                    filteredTasks.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/30 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-neutral-900">{item.siswa.nama}</p>
                            <p className="text-[10px] text-neutral-400">{item.siswa.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-neutral-800">{item.tugas_praktek.judul}</td>
                        <td className="px-6 py-4">
                          {item.nilai !== null ? (
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-success/10 text-success text-[10px]">
                              {item.nilai} / 100
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-warning/10 text-warning text-[10px]">
                              Belum Dinilai
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {new Date(item.submitted_at).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedTaskSubmisi(item);
                              setGradingScore(item.nilai ?? "");
                              setGradingFeedback(item.catatan_guru ?? "");
                            }}
                            className="text-primary hover:underline font-bold"
                          >
                            Tinjau & Beri Nilai
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PROJECT KAIZEN ── */}
      {tab === "project" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Pengumpulan Proyek Kaizen</h1>
              <p className="text-neutral-400 text-xs font-semibold mt-1">
                Tinjau berkas proposal kelompok & laporan proyek siswa di bawah sekolah Anda.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari siswa..."
                  className="pl-8 pr-4 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none cursor-pointer font-bold"
              >
                <option value="Semua">Semua Status</option>
                <option value="Belum Dinilai">Belum Dinilai</option>
                <option value="Sudah Dinilai">Sudah Dinilai</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 font-extrabold uppercase border-b border-neutral-100">
                    <th className="px-6 py-4">Siswa / Pengirim</th>
                    <th className="px-6 py-4">Tipe Berkas</th>
                    <th className="px-6 py-4">Nama Dokumen</th>
                    <th className="px-6 py-4">Nilai</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-neutral-400 italic">Belum ada pengumpulan berkas proyek Kaizen.</td>
                    </tr>
                  ) : (
                    filteredProjects.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/30 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-neutral-900">{item.siswa.nama}</p>
                            <p className="text-[10px] text-neutral-400">{item.siswa.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            item.tipe === "proposal" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {item.tipe}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-neutral-800 truncate max-w-[200px]">{item.file_name}</td>
                        <td className="px-6 py-4">
                          {item.nilai !== null ? (
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-success/10 text-success text-[10px]">
                              {item.nilai} / 100
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-warning/10 text-warning text-[10px]">
                              Menunggu Review
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedProjectSubmisi(item);
                              setGradingScore(item.nilai ?? "");
                              setGradingFeedback(item.catatan_guru ?? "");
                              setGradingRevisiFile(item.file_revisi_name ? { name: item.file_revisi_name, url: item.file_revisi_url || "" } : null);
                            }}
                            className="text-primary hover:underline font-bold"
                          >
                            Review Dokumen
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PROGRES SISWA ── */}
      {tab === "progres" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Progres Belajar Siswa</h1>
              <p className="text-neutral-400 text-xs font-semibold mt-1">
                Cari dan pantau persentase kelar membaca teori serta nilai latihan soal siswa per-modul secara instan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari siswa..."
                  className="pl-8 pr-4 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none"
                />
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none font-bold text-neutral-700 cursor-pointer"
              >
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>{cls === "Semua" ? "Semua Kelas" : `Kelas ${cls}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 font-extrabold uppercase border-b border-neutral-100">
                    <th className="px-6 py-4">Nama Siswa</th>
                    <th className="px-6 py-4">Kelas</th>
                    <th className="px-6 py-4">Status Modul Selesai</th>
                    <th className="px-6 py-4 text-right">Rincian Progres</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-neutral-400 italic">Siswa tidak ditemukan.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const completedCount = student.modules.filter((m: any) => m.completed).length;
                      const totalCount = student.modules.length;
                      return (
                        <tr key={student.id} className="hover:bg-neutral-50/30 transition">
                          <td className="px-6 py-4 font-bold text-neutral-900">{student.nama}</td>
                          <td className="px-6 py-4 text-neutral-500 font-semibold">{student.kelas || "-"}</td>
                          <td className="px-6 py-4 font-semibold text-neutral-600">
                            {completedCount} dari {totalCount} modul teori
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="inline-flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg font-bold"
                            >
                              Tampilkan Detail <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: KELOLA MATERI ── */}
      {tab === "materi" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Pengelolaan Modul Belajar & Latsol</h1>
              <p className="text-neutral-400 text-xs font-semibold mt-1">
                Tambahkan materi bacaan, kuis internal, dan latihan soal mandiri per-modul.
              </p>
            </div>
            {!isCreatingModule && !selectedModule && (
              <button
                onClick={() => {
                  setIsCreatingModule(true);
                  setSelectedModule(null);
                  setModuleTitle("");
                  setModuleSlug("");
                  setModuleUrutan(modules.length + 1);
                  setModuleContentHtml("");
                  setEditorSubTab("konten");
                }}
                className="inline-flex items-center gap-1 bg-primary hover:bg-primary-light text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 transition cursor-pointer"
              >
                <Plus size={15} /> Buat Modul Baru
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Module List (Lg: 4 columns) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-neutral-100 p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-neutral-850 text-xs uppercase tracking-wider">Daftar Modul Saat Ini</h3>
              <div className="space-y-2">
                {modules.map((m) => {
                  const isSelected = selectedModule?.id === m.id && !isCreatingModule;
                  return (
                    <div 
                      key={m.id}
                      onClick={() => selectModuleForEdit(m)}
                      className={`group p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected 
                          ? "bg-primary/5 border-primary text-primary font-bold" 
                          : "border-neutral-100 hover:bg-neutral-50 text-neutral-700"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold truncate text-[13px]">{m.urutan}. {m.judul}</p>
                        <p className="text-[10px] text-neutral-400">Slug: {m.slug}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(m.id);
                        }}
                        className="text-neutral-400 hover:text-danger opacity-0 group-hover:opacity-100 transition p-1 shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
                {modules.length === 0 && (
                  <p className="text-xs text-neutral-400 italic text-center py-4">Belum ada modul materi.</p>
                )}
              </div>
            </div>

            {/* Right Editor Workspace (Lg: 8 columns) */}
            <div className="lg:col-span-8">
              {isCreatingModule || selectedModule ? (
                <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-6 shadow-xs">
                  
                  {/* Title Bar */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="font-bold text-sm text-neutral-900">
                      {isCreatingModule ? "Membuat Modul Baru" : `Mengedit Modul: ${selectedModule?.judul}`}
                    </h3>
                    <button
                      onClick={() => { setSelectedModule(null); setIsCreatingModule(false); }}
                      className="text-neutral-400 hover:text-neutral-600 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Sub-tabs for content editable editor / Kuis / Latsol */}
                  {!isCreatingModule && selectedModule && (
                    <div className="flex border-b border-neutral-100 p-1 bg-neutral-50 rounded-lg">
                      <button
                        onClick={() => setEditorSubTab("konten")}
                        className={`flex-1 py-2 text-center text-xs font-bold rounded-md transition ${
                          editorSubTab === "konten" ? "bg-white text-primary shadow-xs" : "text-neutral-400 hover:text-neutral-700"
                        }`}
                      >
                        1. Konten Bacaan Modul
                      </button>
                      <button
                        onClick={() => setEditorSubTab("kuis")}
                        className={`flex-1 py-2 text-center text-xs font-bold rounded-md transition ${
                          editorSubTab === "kuis" ? "bg-white text-primary shadow-xs" : "text-neutral-400 hover:text-neutral-700"
                        }`}
                      >
                        2. Kuis Bacaan (Akhir Materi)
                      </button>
                      <button
                        onClick={() => setEditorSubTab("latsol")}
                        className={`flex-1 py-2 text-center text-xs font-bold rounded-md transition ${
                          editorSubTab === "latsol" ? "bg-white text-primary shadow-xs" : "text-neutral-400 hover:text-neutral-700"
                        }`}
                      >
                        3. Latihan Soal (Latsol Mandiri)
                      </button>
                    </div>
                  )}

                  {/* Sub-tab 1: Konten Bacaan Modul */}
                  {(isCreatingModule || editorSubTab === "konten") && (
                    <div className="space-y-4">
                      
                      {/* Meta Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="font-semibold text-xs text-neutral-600">Judul Modul *</label>
                          <input
                            type="text"
                            required
                            value={moduleTitle}
                            onChange={(e) => setModuleTitle(e.target.value)}
                            placeholder="Contoh: Identifikasi 5S"
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-xs text-neutral-600">Slug Modul *</label>
                          <input
                            type="text"
                            required
                            value={moduleSlug}
                            onChange={(e) => setModuleSlug(e.target.value)}
                            placeholder="contoh: identifikasi-5s"
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-xs text-neutral-600">Urutan Tampil *</label>
                          <input
                            type="number"
                            required
                            value={moduleUrutan}
                            onChange={(e) => setModuleUrutan(Number(e.target.value))}
                            className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-xs"
                          />
                        </div>
                      </div>

                      {/* Visual HTML WYSIWYG Editor */}
                      <div className="space-y-2">
                        <label className="font-semibold text-xs text-neutral-600">Isi Artikel Modul (Visual WYSIWYG)</label>
                        
                        {/* WYSIWYG Editor Toolbar */}
                        <div className="flex flex-wrap gap-1 p-2 bg-neutral-50 border border-neutral-200 rounded-t-xl select-none text-xs">
                          <button
                            type="button"
                            onClick={() => execEditorCommand("bold")}
                            title="Tebal (Bold)"
                            className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                          >
                            <Bold size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => execEditorCommand("italic")}
                            title="Miring (Italic)"
                            className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                          >
                            <Italic size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => execEditorCommand("formatBlock", "h2")}
                            title="Heading 2 (Sub-judul)"
                            className="p-2 rounded hover:bg-neutral-200 text-neutral-700 font-bold"
                          >
                            <Heading size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => execEditorCommand("insertUnorderedList")}
                            title="Bullet List"
                            className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                          >
                            <List size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => execEditorCommand("formatBlock", "pre")}
                            title="Code Block"
                            className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                          >
                            <Code size={15} />
                          </button>
                          
                          <div className="h-5 w-px bg-neutral-200 mx-1.5 self-center" />

                          <button
                            type="button"
                            onClick={() => execEditorCommand("undo")}
                            title="Undo (Ctrl+Z)"
                            className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                          >
                            <Undo size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => execEditorCommand("redo")}
                            title="Redo (Ctrl+Y)"
                            className="p-2 rounded hover:bg-neutral-200 text-neutral-700"
                          >
                            <Redo size={15} />
                          </button>

                          <div className="h-5 w-px bg-neutral-200 mx-1.5 self-center" />

                          {/* Image upload inside editor */}
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            title="Sisipkan Gambar"
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-primary hover:bg-primary/5 rounded font-semibold text-xs"
                          >
                            <ImageIcon size={15} /> Sisipkan Gambar
                          </button>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleInsertImageToEditor}
                            className="hidden"
                          />
                        </div>

                        {/* Editor contentEditable container */}
                        <div
                          ref={editorRef}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setModuleContentHtml(e.currentTarget.innerHTML)}
                          className="min-h-[300px] max-h-[500px] border border-t-0 border-neutral-200 rounded-b-xl p-4 focus:outline-none bg-white overflow-y-auto prose max-w-none text-xs text-neutral-700 leading-8 space-y-4"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => { setSelectedModule(null); setIsCreatingModule(false); }}
                          className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSubmitModule}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-5 py-2.5 text-xs font-bold hover:bg-primary-light shadow-sm"
                        >
                          <Save size={15} /> Simpan Modul
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: Kuis Bacaan (Akhir Materi) */}
                  {!isCreatingModule && editorSubTab === "kuis" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest">Kuis Pemahaman (Lama)</h4>
                        <button
                          onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                          className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                        >
                          <Plus size={13} /> {isAddingQuestion ? "Batal Tambah" : "Tambah Kuis"}
                        </button>
                      </div>

                      {isAddingQuestion && (
                        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-600">Pertanyaan *</label>
                            <input
                              type="text"
                              value={newQuestionText}
                              onChange={(e) => setNewQuestionText(e.target.value)}
                              placeholder="Tulis pertanyaan..."
                              className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-semibold text-neutral-500">Pilihan A</label>
                              <input type="text" value={newOptA} onChange={(e) => setNewOptA(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-neutral-500">Pilihan B</label>
                              <input type="text" value={newOptB} onChange={(e) => setNewOptB(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-neutral-500">Pilihan C</label>
                              <input type="text" value={newOptC} onChange={(e) => setNewOptC(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-neutral-500">Pilihan D</label>
                              <input type="text" value={newOptD} onChange={(e) => setNewOptD(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-neutral-600">Jawaban Benar *</label>
                            <select
                              value={newCorrectAnswer}
                              onChange={(e) => setNewCorrectAnswer(Number(e.target.value))}
                              className="bg-white border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none font-bold text-neutral-700"
                            >
                              <option value={0}>Pilihan A</option>
                              <option value={1}>Pilihan B</option>
                              <option value={2}>Pilihan C</option>
                              <option value={3}>Pilihan D</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsAddingQuestion(false)} className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 font-semibold">Batal</button>
                            <button onClick={handleAddQuestion} className="bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-light font-bold">Simpan Soal</button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {selectedModule.soal_latihan?.map((soal: any, idx: number) => (
                          <div key={soal.id} className="bg-neutral-50/50 border border-neutral-150 rounded-xl p-4 flex items-start justify-between gap-3 text-xs">
                            <div className="space-y-2">
                              <p className="font-bold text-neutral-800">{idx + 1}. {soal.pertanyaan}</p>
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
                                <p className={soal.jawaban_benar === 0 ? "text-success font-bold" : ""}>A. {soal.pilihan_a}</p>
                                <p className={soal.jawaban_benar === 1 ? "text-success font-bold" : ""}>B. {soal.pilihan_b}</p>
                                <p className={soal.jawaban_benar === 2 ? "text-success font-bold" : ""}>C. {soal.pilihan_c}</p>
                                <p className={soal.jawaban_benar === 3 ? "text-success font-bold" : ""}>D. {soal.pilihan_d}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(soal.id)}
                              className="text-neutral-400 hover:text-danger p-1 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {(!selectedModule.soal_latihan || selectedModule.soal_latihan.length === 0) && (
                          <p className="text-xs text-neutral-400 italic text-center py-4">Belum ada soal kuis artikel untuk modul ini.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 3: Latihan Soal (Latsol Mandiri - Google Forms style) */}
                  {!isCreatingModule && editorSubTab === "latsol" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-neutral-450 uppercase tracking-widest">Latihan Soal Evaluasi (Prasyarat 100% Kuis)</h4>
                        <button
                          onClick={() => setIsAddingLatsol(!isAddingLatsol)}
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                        >
                          <Plus size={13} /> {isAddingLatsol ? "Tutup Form" : "Tambah Soal Latsol"}
                        </button>
                      </div>

                      {/* Google Forms Style Form Creator */}
                      {isAddingLatsol && (
                        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4 text-xs">
                          <h4 className="font-bold text-sm text-neutral-800">Buat Soal Latsol Baru</h4>
                          
                          {/* 1. Pertanyaan */}
                          <div className="space-y-1.5">
                            <label className="font-bold text-neutral-600">1. Kalimat Pertanyaan *</label>
                            <textarea
                              value={latsolPertanyaan}
                              onChange={(e) => setLatsolPertanyaan(e.target.value)}
                              placeholder="Masukkan teks pertanyaan di sini..."
                              className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none h-20"
                            />
                          </div>

                          {/* 2. Gambar Pendukung */}
                          <div className="space-y-1.5">
                            <label className="font-bold text-neutral-600">2. Gambar Soal (Opsional)</label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => latsolImageInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg font-bold"
                              >
                                <ImageIcon size={14} /> Pilih Gambar
                              </button>
                              <input
                                ref={latsolImageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLatsolImageUpload}
                                className="hidden"
                              />
                              {latsolImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setLatsolImageUrl(null)}
                                  className="text-danger font-bold hover:underline"
                                >
                                  Hapus Gambar
                                </button>
                              )}
                            </div>
                            {latsolImageUrl && (
                              <img src={latsolImageUrl} alt="Preview Soal" className="max-h-32 w-auto object-contain rounded-lg border border-neutral-200 mt-2" />
                            )}
                          </div>

                          {/* 3. Pilihan Jawaban Dinamis */}
                          <div className="space-y-2">
                            <label className="font-bold text-neutral-600">3. Pilihan Jawaban *</label>
                            <div className="space-y-2">
                              {latsolPilihan.map((opsi, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="font-bold text-neutral-400 uppercase w-5 text-center">
                                    {String.fromCharCode(65 + idx)}.
                                  </span>
                                  <input
                                    type="text"
                                    value={opsi}
                                    onChange={(e) => handleLatsolChoiceChange(idx, e.target.value)}
                                    placeholder={`Pilihan ${String.fromCharCode(65 + idx)}...`}
                                    className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none"
                                  />
                                  {latsolPilihan.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLatsolChoice(idx)}
                                      className="text-neutral-400 hover:text-danger p-1 transition"
                                      title="Hapus opsi"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={handleAddLatsolChoice}
                              className="text-primary hover:underline font-bold text-[11px] inline-flex items-center gap-1 mt-1"
                            >
                              <Plus size={12} /> Tambah Opsi Jawaban
                            </button>
                          </div>

                          {/* 4. Kunci Jawaban & Poin */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="font-bold text-neutral-600">4. Kunci Jawaban Benar *</label>
                              <select
                                value={latsolJawabanBenar}
                                onChange={(e) => setLatsolJawabanBenar(Number(e.target.value))}
                                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none font-bold text-neutral-700 cursor-pointer"
                              >
                                {latsolPilihan.map((_, i) => (
                                  <option key={i} value={i}>Opsi {String.fromCharCode(65 + i)}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="font-bold text-neutral-600">5. Bobot Poin Soal *</label>
                              <input
                                type="number"
                                value={latsolPoin}
                                onChange={(e) => setLatsolPoin(Number(e.target.value))}
                                min={1}
                                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingLatsol(false);
                                setLatsolPertanyaan("");
                                setLatsolPilihan(["", ""]);
                              }}
                              className="px-4 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 font-semibold"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveLatsolQuestion}
                              className="bg-primary hover:bg-primary-light text-white px-5 py-2 rounded-lg font-bold"
                            >
                              Simpan Soal Latsol
                            </button>
                          </div>
                        </div>
                      )}

                      {/* List of Latsol questions */}
                      <div className="space-y-3">
                        {latsolQuestions.map((soal: any, idx: number) => (
                          <div key={soal.id} className="bg-white border border-neutral-250 rounded-xl p-4 flex items-start justify-between gap-3 text-xs shadow-2xs">
                            <div className="space-y-3 flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-neutral-400 shrink-0">{idx + 1}.</span>
                                <div className="space-y-1 flex-1">
                                  <p className="font-bold text-neutral-850">{soal.pertanyaan}</p>
                                  <p className="text-[10px] text-primary font-black uppercase tracking-wider">{soal.poin} Poin</p>
                                </div>
                              </div>

                              {soal.image_url && (
                                <img src={soal.image_url} alt="Gambar Soal" className="max-h-40 rounded border border-neutral-100 object-contain" />
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-600 pl-4">
                                {(soal.pilihan as string[]).map((opsi, oIdx) => {
                                  const isCorrect = oIdx === soal.jawaban_benar;
                                  return (
                                    <p key={oIdx} className={isCorrect ? "text-success font-black" : ""}>
                                      {String.fromCharCode(65 + oIdx)}. {opsi} {isCorrect && "✓"}
                                    </p>
                                  );
                                })}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteLatsolQuestion(soal.id)}
                              className="text-neutral-400 hover:text-danger p-1 transition shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {latsolQuestions.length === 0 && !isAddingLatsol && (
                          <div className="bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl p-8 text-center text-neutral-400">
                            <FileText size={32} className="mx-auto text-neutral-300" />
                            <p className="font-bold text-neutral-700 mt-2">Belum ada Latihan Soal</p>
                            <p className="text-[11px] mt-0.5">Latsol ini terpisah dari kuis materi dan berfungsi sebagai ujian modul.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white border border-neutral-100 rounded-xl p-12 text-center shadow-sm text-neutral-400">
                  <BookOpen size={48} className="mx-auto text-neutral-200 animate-pulse" />
                  <p className="mt-4 font-bold text-neutral-700">Pilih atau buat modul materi</p>
                  <p className="text-xs mt-1">Silakan pilih salah satu modul dari panel kiri untuk mulai mengedit artikel, gambar, kuis materi, dan latihan soal evaluasi.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL: PROGRES BELAJAR SISWA ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-neutral-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">{selectedStudent.nama}</h3>
                <p className="text-xs text-neutral-400 font-semibold">{selectedStudent.kelas || "Kelas belum diset"} • {selectedStudent.email}</p>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 hover:bg-neutral-50 rounded-lg text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-5">
              <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest">Detail Modul Teori & Latsol</h4>
              <div className="space-y-4">
                {selectedStudent.modules.map((m: any) => (
                  <div key={m.id} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between font-bold text-neutral-800">
                        <span>{m.judul}</span>
                        <span>{m.persentase}% dibaca</span>
                      </div>
                      <ProgressBar value={m.persentase} color={m.completed ? "bg-success" : "bg-primary"} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 shrink-0 sm:min-w-[200px] border-t sm:border-t-0 sm:border-l border-neutral-200/60 pt-3 sm:pt-0 sm:pl-4">
                      <div>
                        <p className="font-bold text-neutral-550 text-[10px]">Skor Kuis</p>
                        {m.score !== null ? (
                          <p className={`font-black text-sm mt-0.5 ${m.score >= 70 ? "text-success" : "text-warning"}`}>
                            {m.score}%
                          </p>
                        ) : (
                          <p className="text-neutral-450 mt-0.5 italic">Belum dikerjakan</p>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-550 text-[10px]">Nilai Latsol</p>
                        {m.latsol_score !== undefined && m.latsol_score !== null ? (
                          <p className="font-black text-sm mt-0.5 text-primary">
                            {m.latsol_score}% ({m.latsol_poin ?? 0} Poin)
                          </p>
                        ) : (
                          <p className="text-neutral-450 mt-0.5 italic">Belum ujian</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL: PENILAIAN TUGAS PRAKTIKUM ── */}
      {selectedTaskSubmisi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Penilaian Tugas Praktikum</h3>
                <p className="text-[10px] text-neutral-450 font-bold uppercase mt-0.5">Siswa: {selectedTaskSubmisi.siswa.nama}</p>
              </div>
              <button 
                onClick={() => setSelectedTaskSubmisi(null)}
                className="p-1 hover:bg-neutral-50 rounded text-neutral-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-neutral-50 rounded-xl space-y-2 border border-neutral-100">
                <p className="font-bold text-neutral-700">Topik Praktikum:</p>
                <p className="font-semibold text-neutral-900 text-sm">{selectedTaskSubmisi.tugas_praktek.judul}</p>
              </div>

              {selectedTaskSubmisi.tugas_praktek.deskripsi && (
                <div className="space-y-1">
                  <p className="font-bold text-neutral-500">Hasil Pengamatan Siswa:</p>
                  <p className="text-neutral-800 font-semibold whitespace-pre-wrap border border-neutral-100 p-3 bg-white rounded-lg leading-relaxed">
                    {selectedTaskSubmisi.pengamatan}
                  </p>
                </div>
              )}

              {selectedTaskSubmisi.foto_area && (
                <div className="space-y-1">
                  <p className="font-bold text-neutral-500">Foto Area Terkait:</p>
                  <img src={selectedTaskSubmisi.foto_area} alt="Foto Area" className="max-h-48 w-full object-cover rounded-lg border border-neutral-200 mt-1" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600">Skor Penilaian (0-100) *</label>
                  <input
                    type="number"
                    value={gradingScore}
                    onChange={(e) => setGradingScore(e.target.value === "" ? "" : Number(e.target.value))}
                    min={0}
                    max={100}
                    placeholder="Contoh: 85"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600">Catatan/Feedback Guru</label>
                  <input
                    type="text"
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    placeholder="Saran perbaikan..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
              <button 
                onClick={() => setSelectedTaskSubmisi(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700"
              >
                Batal
              </button>
              <button 
                onClick={handleGradeTask}
                disabled={submittingGrade || gradingScore === ""}
                className="bg-primary hover:bg-primary-light text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {submittingGrade ? "Menyimpan..." : "Kirim Penilaian"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL: PENILAIAN & REVIEW PROJECT KAIZEN ── */}
      {selectedProjectSubmisi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Review & Revisi Proyek Kaizen</h3>
                <p className="text-[10px] text-neutral-450 font-bold uppercase mt-0.5">Siswa: {selectedProjectSubmisi.siswa.nama}</p>
              </div>
              <button 
                onClick={() => setSelectedProjectSubmisi(null)}
                className="p-1 hover:bg-neutral-50 rounded text-neutral-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between gap-3 border border-neutral-100">
                <div className="min-w-0">
                  <p className="font-bold text-neutral-400 text-[10px] uppercase">Tipe Pengumpulan</p>
                  <p className="font-semibold text-neutral-900 capitalize text-sm">{selectedProjectSubmisi.tipe}</p>
                </div>
                <a 
                  href={selectedProjectSubmisi.file_url} 
                  download={selectedProjectSubmisi.file_name}
                  className="inline-flex items-center gap-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-3 py-1.5 rounded-lg font-bold shadow-2xs"
                >
                  <Download size={13} /> Unduh Berkas
                </a>
              </div>

              {selectedProjectSubmisi.catatan_siswa && (
                <div className="space-y-1">
                  <p className="font-bold text-neutral-500">Catatan Kelompok:</p>
                  <p className="text-neutral-700 italic bg-white p-3 border border-neutral-100 rounded-lg whitespace-pre-wrap">
                    "{selectedProjectSubmisi.catatan_siswa}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600">Berikan Nilai (0-100) *</label>
                  <input
                    type="number"
                    value={gradingScore}
                    onChange={(e) => setGradingScore(e.target.value === "" ? "" : Number(e.target.value))}
                    min={0}
                    max={100}
                    placeholder="Contoh: 85"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600">Catatan/Feedback Guru</label>
                  <input
                    type="text"
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    placeholder="Masukan perbaikan..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload revised doc back to student */}
              <div className="space-y-1.5 border-t border-neutral-100 pt-3">
                <label className="block font-bold text-neutral-600">Kirim Balik Berkas Koreksi/Revisi (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 rounded-lg font-bold cursor-pointer transition select-none">
                    <Upload size={14} /> Pilih File Revisi
                    <input type="file" onChange={handleUploadRevisi} className="hidden" />
                  </label>
                  <span className="text-[11px] text-neutral-500 truncate max-w-[200px]">
                    {gradingRevisiFile ? gradingRevisiFile.name : "Belum memilih file"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
              <button 
                onClick={() => setSelectedProjectSubmisi(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700"
              >
                Batal
              </button>
              <button 
                onClick={handleGradeProject}
                disabled={submittingGrade || gradingScore === ""}
                className="bg-primary hover:bg-primary-light text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {submittingGrade ? "Menyimpan..." : "Kirim Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
