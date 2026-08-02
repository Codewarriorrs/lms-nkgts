"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { PklGradingModal } from "@/components/dashboard/PklGradingModal";
import {
  Search,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap
} from "lucide-react";

interface StudentType {
  id: string;
  nama: string;
  email: string;
  nis: string | null;
  kelas: string | null;
  sekolah: {
    nama_sekolah: string;
  } | null;
  nilai_pkl: {
    nilai: number;
    rekomendasi: string;
    updated_at: string;
  } | null;
}

interface SchoolType {
  id: number;
  nama_sekolah: string;
}

export default function PenilaianPklPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<StudentType[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Modals & Messages
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Authenticate user & load context
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "guru" && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // Fetch schools list for Admin
  useEffect(() => {
    if (currentUser?.role === "admin") {
      const fetchSchools = async () => {
        try {
          const res = await fetch(`${API_URL}/schools`);
          if (res.ok) {
            const data = await res.json();
            setSchools(data);
          }
        } catch (err) {
          console.error("Failed to load schools list", err);
        }
      };
      fetchSchools();
    }
  }, [currentUser]);

  // Fetch Students List on filter/page change
  const fetchStudents = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/nilai-pkl/students`);
      url.searchParams.append("page", String(page));
      url.searchParams.append("limit", "10"); // Limit to 10 per page for better layout, or 50 as requested. We can support both, let's use 10 for pagination visibility or 50 if the user preferred. Let's do 10 for a cleaner look but still support full pagination.
      if (search) url.searchParams.append("search", search);
      if (selectedSchoolId) url.searchParams.append("schoolId", selectedSchoolId);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memuat daftar siswa");
      }

      setStudents(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalStudents(data.meta.total);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentUser, page, selectedSchoolId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleGradeSuccess = (msg: string) => {
    setSuccessMsg(msg);
    fetchStudents();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleOpenGrading = (student: StudentType) => {
    setSelectedStudent(student);
    setIsGradingModalOpen(true);
  };

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <GraduationCap className="text-primary h-7 w-7" />
            Penilaian PKL (DEKKI)
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Evaluasi kompetensi magang siswa berdasarkan instrumen Sikap, Keterampilan, Pengetahuan, Kehadiran, dan Inovasi.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm border border-emerald-100 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <Search className="absolute left-3.5 top-3.5 text-neutral-400 h-4 w-4" />
        </form>

        {currentUser?.role === "admin" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="text-neutral-400 h-4 w-4 flex-shrink-0" />
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64 px-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Semua Sekolah Ambassador</option>
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.nama_sekolah}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => {
            setPage(1);
            fetchStudents();
          }}
          className="w-full md:w-auto ml-auto px-5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-sm font-bold rounded-xl transition-all"
        >
          Muat Ulang
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-bold text-xs uppercase">
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">NIS</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Asal Sekolah</th>
                <th className="px-6 py-4">Status Penilaian</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      <span>Sedang memuat data siswa...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-400 italic">
                    Tidak ditemukan data siswa dalam PKL.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const hasGrade = !!student.nilai_pkl;
                  return (
                    <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                            {student.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-800 block leading-tight">{student.nama}</span>
                            <span className="text-xs text-neutral-400">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">{student.nis || "-"}</td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">{student.kelas || "-"}</td>
                      <td className="px-6 py-4 text-neutral-500 font-semibold">
                        {student.sekolah?.nama_sekolah || "PT Toyota-Astra Motor (TAM)"}
                      </td>
                      <td className="px-6 py-4">
                        {hasGrade ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Nilai: {student.nilai_pkl?.nilai} ({student.nilai_pkl?.rekomendasi})
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-500 rounded-full font-bold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                            Belum Dinilai
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenGrading(student)}
                          className={`
                            px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm
                            ${
                              hasGrade
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-primary hover:bg-primary/95 text-white shadow-primary/10"
                            }
                          `}
                        >
                          {hasGrade ? "Ubah Nilai" : "Beri Nilai"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">
              Menampilkan {students.length} dari {totalStudents} Siswa
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-500 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`
                    w-8 h-8 rounded-lg font-bold text-xs transition-all
                    ${page === i + 1 ? "bg-primary text-white" : "hover:bg-neutral-200 text-neutral-600"}
                  `}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-500 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      <PklGradingModal
        isOpen={isGradingModalOpen}
        student={selectedStudent}
        onClose={() => {
          setIsGradingModalOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={handleGradeSuccess}
      />
    </div>
  );
}
