"use client";

import { useEffect, useState } from "react";
import { Briefcase, CheckCircle, Lock } from "lucide-react";

type Task = {
  id: number;
  title: string;
  description: string;
  date: string; // ISO date
  note: string; // keterangan
  area: string; // area pengisian
  submitted: boolean;
};

const STORAGE_KEY = "tugas-praktik-v1";

const defaultTasks = (): Task[] => {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: 1,
      title: "Pengenalan Budaya Kaizen",
      description: "Lakukan observasi dan catat contoh penerapan budaya Kaizen di lingkungan Anda.",
      date: today,
      note: "",
      area: "",
      submitted: false,
    },
    {
      id: 2,
      title: "5R (Ringkas, Rapi, Resik, Rawat, Rajin)",
      description: "Terapkan dan dokumentasikan langkah 5R pada area kerja yang Anda pilih.",
      date: today,
      note: "",
      area: "",
      submitted: false,
    },
    {
      id: 3,
      title: "6 Potensi Bahaya",
      description: "Identifikasi enam potensi bahaya di lokasi kerja dan usulkan mitigasinya.",
      date: today,
      note: "",
      area: "",
      submitted: false,
    },
    {
      id: 4,
      title: "7 Pemborosan",
      description: "Amati contoh pemborosan (muda-mudahan) dan catat cara menguranginya.",
      date: today,
      note: "",
      area: "",
      submitted: false,
    },
    {
      id: 5,
      title: "8 Langkah Penyelesaian Masalah",
      description: "Praktikkan 8 langkah penyelesaian masalah pada studi kasus sederhana.",
      date: today,
      note: "",
      area: "",
      submitted: false,
    },
  ];
};

import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

export default function TugasPage() {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Task[];
        // Ensure date for non-submitted stays today's date
        const today = new Date().toISOString().slice(0, 10);
        const merged = defaultTasks().map((d) => {
          const existing = parsed.find((p) => p.id === d.id);
          if (!existing) return d;
          return {
            ...d,
            date: existing.submitted ? existing.date : today,
            note: existing.note || "",
            area: existing.area || "",
            submitted: !!existing.submitted,
          };
        });
        setTasks(merged);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const handleChange = (id: number, field: "note" | "area" | "date", value: string) => {
    setTasks((s) => s.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleSubmit = (id: number) => {
    // Only allow submit if previous tasks completed
    const index = tasks.findIndex((t) => t.id === id);
    if (index > 0) {
      const prev = tasks[index - 1];
      if (!prev.submitted) return;
    }

    setTasks((s) =>
      s.map((t) => (t.id === id ? { ...t, submitted: true, date: t.date || new Date().toISOString().slice(0, 10) } : t))
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (currentUser?.role === "guru") {
    return <TeacherDashboard tab="tugas" />;
  }

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Tugas Praktek</h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">Kumpulkan hasil observasi lapangan dan tugas implementasi Kaizen Anda. Kerjakan secara berurutan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task, idx) => {
          const locked = idx > 0 && !tasks[idx - 1].submitted;
          return (
            <div key={task.id} className="bg-white rounded-xl border border-neutral-100 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-neutral-900 font-bold">{task.title}</h3>
                  <p className="text-neutral-400 text-xs mt-1">{task.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {task.submitted ? (
                    <div className="text-success flex items-center gap-2">
                      <CheckCircle size={18} /> <span className="text-sm font-medium">Selesai</span>
                    </div>
                  ) : locked ? (
                    <div className="text-neutral-400 flex items-center gap-2">
                      <Lock size={16} /> <span className="text-sm">Terkunci</span>
                    </div>
                  ) : (
                    <div className="text-primary flex items-center gap-2">
                      <Briefcase size={16} /> <span className="text-sm">Belum dikumpulkan</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label className="text-xs text-neutral-500">Tanggal</label>
                <input
                  type="date"
                  value={task.date}
                  onChange={(e) => handleChange(task.id, "date", e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                  disabled={task.submitted}
                />

                <label className="text-xs text-neutral-500">Area pengisian</label>
                <textarea
                  value={task.area}
                  onChange={(e) => handleChange(task.id, "area", e.target.value)}
                  rows={3}
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Jelaskan observasi / langkah yang Anda lakukan"
                  disabled={task.submitted || locked}
                />

                <label className="text-xs text-neutral-500">Keterangan</label>
                <input
                  value={task.note}
                  onChange={(e) => handleChange(task.id, "note", e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Catatan singkat atau link bukti"
                  disabled={task.submitted || locked}
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={() => handleSubmit(task.id)}
                  disabled={task.submitted || locked || (!task.area.trim() && !task.note.trim())}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${task.submitted || locked || (!task.area.trim() && !task.note.trim()) ? "bg-neutral-100 text-neutral-400" : "bg-primary text-white"}`}
                >
                  {task.submitted ? "Terkirim" : "Submit"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
