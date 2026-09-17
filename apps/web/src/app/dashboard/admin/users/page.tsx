"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { ResetProgressModal } from "@/components/dashboard/ResetProgressModal";
import { 
  Users, 
  Mail, 
  Upload, 
  UserPlus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  FileSpreadsheet,
  KeyRound,
  Send,
  Edit,
  RotateCcw,
  GraduationCap,
  Phone,
  Lock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

type SortField = "none" | "nama" | "date";
type SortOrder = "asc" | "desc";

interface UserType {
  id: string;
  nama: string;
  email: string;
  role: string;
  nis: string | null;
  kelas?: string | null;
  jurusan?: string | null;
  no_hp?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  tahun_pendaftaran?: number | null;
  sekolah_id?: number | null;
  nama_sekolah: string;
  created_at: string;
  reset_password_expires?: string | null;
  has_active_reset_token?: boolean;
}

interface ActiveResetUserType {
  id: string;
  nama: string;
  email: string;
  role: string;
  nis: string | null;
  kelas?: string | null;
  nama_sekolah: string;
  created_at: string;
  reset_password_expires: string;
  token?: string;
}

interface StagingUserRow {
  tempId: string;
  nama: string;
  email: string;
  role: "siswa" | "guru" | "admin";
  sekolah: string;
  sekolah_id?: number;
  nis?: string;
  kelas?: string;
  jurusan?: string;
  no_hp?: string;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  tahun_pendaftaran?: number;
  status: "valid" | "warning" | "error";
  issues: string[];
}

interface StagingSchoolOption {
  id: number;
  nama_sekolah: string;
}

interface ImportPreviewData {
  totalRows: number;
  validCount: number;
  issueCount: number;
  rows: StagingUserRow[];
  availableSchools: StagingSchoolOption[];
}

function formatTimeRemaining(dateStr: string) {
  const diffMs = new Date(dateStr).getTime() - new Date().getTime();
  if (diffMs <= 0) return "Kedaluwarsa";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `Sisa ${hours} jam ${minutes} mnt`;
  return `Sisa ${minutes} menit`;
}

function formatKelasDisplay(kelas?: string | null, jurusan?: string | null) {
  const cleanKelas = (kelas || "").trim().replace(/^(kelas\s+)+/i, "Kelas ");
  const cleanJurusan = (jurusan || "").trim();

  if (cleanKelas && cleanJurusan) {
    return `${cleanKelas} • ${cleanJurusan}`;
  }
  return cleanKelas || cleanJurusan || "-";
}

interface InvitationType {
  id: number;
  nama: string;
  email: string;
  role: string;
  nis: string | null;
  kelas?: string | null;
  nama_sekolah: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
}

interface SchoolType {
  id: number;
  nama_sekolah: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "resets">("active");

  // State Data
  const [users, setUsers] = useState<UserType[]>([]);
  const [invitations, setInvitations] = useState<InvitationType[]>([]);
  const [activeResets, setActiveResets] = useState<ActiveResetUserType[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);

  // Filtering / Pagination Active Users
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [exportSekolahId, setExportSekolahId] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Multi-Select & Bulk Action States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkResetModalOpen, setIsBulkResetModalOpen] = useState(false);
  const [isBulkCancelResetModalOpen, setIsBulkCancelResetModalOpen] = useState(false);

  const masterCheckboxRef = useRef<HTMLInputElement>(null);
  const mobileMasterCheckboxRef = useRef<HTMLInputElement>(null);

  // Filter & Search Handlers (Auto-reset pagination across all tabs)
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    setPendingPage(1);
    setResetsPage(1);
  };

  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val);
    setPage(1);
    setPendingPage(1);
    setResetsPage(1);
  };

  const handleSekolahFilterChange = (val: string) => {
    setExportSekolahId(val);
    setPage(1);
    setPendingPage(1);
    setResetsPage(1);
  };

  // Toggle Sorting Handlers
  const handleToggleSortNama = () => {
    if (sortField !== "nama") {
      setSortField("nama");
      setSortOrder("asc");
    } else {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  const handleToggleSortBergabung = () => {
    if (sortField !== "date") {
      setSortField("date");
      setSortOrder("desc"); // Default: terbaru lebih dahulu
    } else {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    }
  };

  const handleToggleSortKedaluwarsa = () => {
    if (sortField !== "date") {
      setSortField("date");
      setSortOrder("asc"); // Default: kedaluwarsa terdekat lebih dahulu
    } else {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  const renderSortIcon = (field: "nama" | "date") => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-neutral-400 group-hover:text-neutral-600 transition shrink-0" />;
    }
    if (sortOrder === "asc") {
      return <ArrowUp size={14} className="text-blue-600 shrink-0 stroke-[2.5]" />;
    }
    return <ArrowDown size={14} className="text-blue-600 shrink-0 stroke-[2.5]" />;
  };

  // Modals & Forms
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [selectedEditUser, setSelectedEditUser] = useState<UserType | null>(null);
  const [resetTargetUser, setResetTargetUser] = useState<{ id: string; nama: string } | null>(null);
  const [sendResetTargetUser, setSendResetTargetUser] = useState<UserType | ActiveResetUserType | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const [cancelResetTargetUser, setCancelResetTargetUser] = useState<UserType | ActiveResetUserType | null>(null);
  const [cancelingReset, setCancelingReset] = useState(false);
  const [loadingResets, setLoadingResets] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const [resetsPage, setResetsPage] = useState(1);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [editForm, setEditForm] = useState({
    nama: "",
    email: "",
    role: "siswa",
    sekolah_id: "",
    nis: "",
    kelas: "",
    jurusan: "",
    no_hp: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    tahun_pendaftaran: "",
  });
  const [inviteForm, setInviteForm] = useState({
    email: "",
    nama: "",
    role: "siswa",
    sekolah_id: "",
    nis: "",
    kelas: ""
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSekolahId, setImportSekolahId] = useState("");

  // Staging & Review Wizard States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [previewFilter, setPreviewFilter] = useState<"all" | "issues" | "valid">("all");
  const [previewPage, setPreviewPage] = useState(1);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  
  // Loading & Messages
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Authenticate Admin
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(userStr);
      if (u.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setIsAdmin(true);
      setCurrentUser(u);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  // Fetch Initial Data
  useEffect(() => {
    if (!isAdmin) return;
    fetchActiveUsers();
    fetchPendingInvitations();
    fetchActiveResets();
    fetchSchools();
  }, [isAdmin, page, search, roleFilter]);

  // 1. Fetch Active Users
  const fetchActiveUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/admin/users?page=${page}&limit=10&search=${encodeURIComponent(search)}&role=${roleFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengambil data pengguna aktif");
      setUsers(data.users || []);
      setTotalPages(data.pagination.pages || 1);
      setTotalUsers(data.pagination.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Pending Invitations
  const fetchPendingInvitations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInvitations(data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data undangan pending", err);
    }
  };

  // 2b. Fetch Active Password Resets
  const fetchActiveResets = async () => {
    setLoadingResets(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/active-resets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActiveResets(data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data reset password aktif", err);
    } finally {
      setLoadingResets(false);
    }
  };

  // 3. Fetch Schools List
  const fetchSchools = async () => {
    try {
      const res = await fetch(`${API_URL}/schools`);
      const data = await res.json();
      if (res.ok) {
        const invalidHeaderRegex = /^(asal[\s_]*sekolah|nama[\s_]*sekolah|sekolah|school|institusi|lembaga|null|undefined|-)$/i;
        const academicTitlesRegex = /(\b|,|\s)(s\.?pd|m\.?pd|s\.?t|m\.?t|s\.?kom|dr\.|drs\.)/i;
        const knownCoords = ['anang waskito', 'budi setiawan', 'hasan ismail', 'heri suryono', 'tohadi', 'tri mardiyanto', 'windhu pinundi'];

        const validSchools = (data || []).filter((s: any) => {
          if (!s?.nama_sekolah) return false;
          const trimmed = s.nama_sekolah.trim();
          if (invalidHeaderRegex.test(trimmed)) return false;
          if (academicTitlesRegex.test(trimmed)) return false;
          if (knownCoords.some(c => trimmed.toLowerCase().includes(c))) return false;
          return true;
        });

        setSchools(validSchools);
        if (validSchools.length > 0) {
          setInviteForm(prev => ({ ...prev, sekolah_id: validSchools[0].id.toString() }));
          setImportSekolahId(validSchools[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Gagal mengambil daftar sekolah", err);
    }
  };

  // 4. Handle Manual Invite Submit
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.nama || !inviteForm.sekolah_id) {
      setErrorMsg("Semua kolom bertanda bintang wajib diisi.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteForm.email,
          nama: inviteForm.nama,
          role: inviteForm.role,
          sekolah_id: parseInt(inviteForm.sekolah_id, 10),
          nis: inviteForm.nis || undefined,
          kelas: inviteForm.kelas?.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim undangan");

      if (data.emailError) {
        setErrorMsg(`Undangan disimpan, tetapi email gagal dikirim: ${data.emailError}`);
      } else {
        setSuccessMsg(`Undangan aktivasi berhasil dikirim ke ${inviteForm.email}`);
      }
      setIsInviteModalOpen(false);
      setInviteForm({
        email: "",
        nama: "",
        role: "siswa",
        sekolah_id: schools[0]?.id.toString() || "",
        nis: "",
        kelas: ""
      });
      fetchPendingInvitations();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4b. Handle open modal detail/edit user
  const handleOpenEditUser = (user: UserType) => {
    setSelectedEditUser(user);
    let formattedTglLahir = "";
    if (user.tanggal_lahir) {
      try {
        const d = new Date(user.tanggal_lahir);
        if (!isNaN(d.getTime())) {
          formattedTglLahir = d.toISOString().split("T")[0];
        }
      } catch {
        formattedTglLahir = "";
      }
    }

    let targetSekolahId = user.sekolah_id?.toString() || "";
    if (!targetSekolahId && schools.length > 0) {
      const matched = schools.find((s) => s.nama_sekolah === user.nama_sekolah);
      targetSekolahId = matched ? matched.id.toString() : schools[0].id.toString();
    }

    setEditForm({
      nama: user.nama || "",
      email: user.email || "",
      role: user.role || "siswa",
      sekolah_id: targetSekolahId,
      nis: user.nis || "",
      kelas: user.kelas || "",
      jurusan: user.jurusan || "",
      no_hp: user.no_hp || "",
      tempat_lahir: user.tempat_lahir || "",
      tanggal_lahir: formattedTglLahir,
      tahun_pendaftaran: user.tahun_pendaftaran ? user.tahun_pendaftaran.toString() : "",
    });
  };

  // 4b2. Handle detail/edit user submit
  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditUser) return;
    if (!editForm.nama.trim()) {
      setErrorMsg("Nama lengkap tidak boleh kosong.");
      return;
    }

    setUpdatingUser(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const payload: any = {
        nama: editForm.nama.trim(),
        role: editForm.role,
        sekolah_id: editForm.sekolah_id ? parseInt(editForm.sekolah_id, 10) : undefined,
      };

      if (editForm.role === "siswa") {
        payload.nis = editForm.nis.trim() || null;
        payload.kelas = editForm.kelas.trim() || null;
        payload.jurusan = editForm.jurusan.trim() || null;
        payload.no_hp = editForm.no_hp.trim() || null;
        payload.tempat_lahir = editForm.tempat_lahir.trim() || null;
        payload.tanggal_lahir = editForm.tanggal_lahir ? editForm.tanggal_lahir : null;
        payload.tahun_pendaftaran = editForm.tahun_pendaftaran ? parseInt(editForm.tahun_pendaftaran, 10) : null;
      } else {
        payload.nis = editForm.nis.trim() || null;
        payload.kelas = editForm.kelas.trim() || null;
        payload.jurusan = editForm.jurusan.trim() || null;
        payload.no_hp = editForm.no_hp.trim() || null;
        payload.tempat_lahir = editForm.tempat_lahir.trim() || null;
        payload.tanggal_lahir = editForm.tanggal_lahir ? editForm.tanggal_lahir : null;
      }

      const res = await fetch(`${API_URL}/admin/users/${selectedEditUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui data pengguna");
      setSuccessMsg(`Data pengguna "${editForm.nama}" berhasil diperbarui.`);
      setSelectedEditUser(null);
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingUser(false);
    }
  };

  // Reusable Pagination Component Helper
  const renderPagination = (
    currentPage: number,
    totalPgs: number,
    totalItems: number,
    label: string,
    onPageChange: (newPage: number) => void
  ) => {
    if (totalItems === 0) return null;
    const startItem = (currentPage - 1) * 10 + 1;
    const endItem = Math.min(currentPage * 10, totalItems);

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      if (totalPgs <= 7) {
        for (let i = 1; i <= totalPgs; i++) pages.push(i);
      } else {
        if (currentPage <= 4) {
          pages.push(1, 2, 3, 4, 5, "...", totalPgs);
        } else if (currentPage >= totalPgs - 3) {
          pages.push(1, "...", totalPgs - 4, totalPgs - 3, totalPgs - 2, totalPgs - 1, totalPgs);
        } else {
          pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPgs);
        }
      }
      return pages;
    };

    return (
      <div className="p-4 sm:p-5 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
        <div>
          Menampilkan <span className="font-bold text-neutral-800">{startItem}</span> - <span className="font-bold text-neutral-800">{endItem}</span> dari <span className="font-bold text-neutral-800">{totalItems}</span> {label}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer font-semibold text-neutral-600"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) =>
              typeof p === "number" ? (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    currentPage === p
                      ? "bg-primary text-white shadow-xs"
                      : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={idx} className="px-1 text-neutral-400">...</span>
              )
            )}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPgs}
            onClick={() => onPageChange(Math.min(totalPgs, currentPage + 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer font-semibold text-neutral-600"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  // 4c. Handle delete user
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus pengguna");
      setSuccessMsg(`Pengguna "${name}" berhasil dihapus.`);
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // 4d. Handle send reset password email
  const handleSendResetPasswordSubmit = async () => {
    if (!sendResetTargetUser) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setSendingReset(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/${sendResetTargetUser.id}/send-reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirimkan email reset kata sandi");
      setSuccessMsg(data.message || `Email petunjuk atur ulang kata sandi berhasil dikirim ke ${sendResetTargetUser.email}!`);
      setSendResetTargetUser(null);
      fetchActiveResets();
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSendingReset(false);
    }
  };

  // 4e. Handle cancel reset password token
  const handleCancelResetPasswordSubmit = async () => {
    if (!cancelResetTargetUser) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setCancelingReset(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/${cancelResetTargetUser.id}/cancel-reset-password`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membatalkan tautan reset password");
      setSuccessMsg(data.message || `Tautan atur ulang kata sandi berhasil dibatalkan.`);
      setCancelResetTargetUser(null);
      fetchActiveResets();
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCancelingReset(false);
    }
  };

  // 5. Handle Excel/CSV Import - Dry Run Preview
  const handleStartImportPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setErrorMsg("Pilih file CSV / Excel terlebih dahulu.");
      return;
    }
    setIsPreviewLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setImportSummary(null);

    const formData = new FormData();
    formData.append("file", importFile);
    if (importSekolahId) {
      formData.append("sekolah_id", importSekolahId);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/import-preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membaca atau memindai berkas import");

      setPreviewData(data);
      setPreviewFilter("all");
      setPreviewPage(1);
      setIsImportModalOpen(false);
      setIsReviewModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 5b. Update Single Row Field in Staging Data & Recompute Status
  const handleUpdateRowFields = (tempId: string, updates: Partial<StagingUserRow>) => {
    if (!previewData) return;

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const academicTitlesRegex = /(\b|,|\s)(s\.?pd|m\.?pd|s\.?t|m\.?t|s\.?kom|dr\.|drs\.)/i;

    const updatedRows = previewData.rows.map(row => {
      if (row.tempId !== tempId) return row;

      const updatedRow = { ...row, ...updates };
      const issues: string[] = [];
      let hasError = false;

      // 1. Validasi Email
      const emailStr = (updatedRow.email || '').trim();
      if (!emailStr) {
        issues.push('Email wajib diisi');
        hasError = true;
      } else if (!EMAIL_REGEX.test(emailStr)) {
        issues.push('Format email tidak valid');
        hasError = true;
      } else {
        const duplicateInFile = previewData.rows.some(
          r => r.tempId !== tempId && (r.email || '').trim().toLowerCase() === emailStr.toLowerCase()
        );
        if (duplicateInFile) {
          issues.push('Email terduplikasi di dalam berkas ini');
          hasError = true;
        }
        const originalDbIssue = row.issues.find(iss => iss.includes('terdaftar aktif') || iss.includes('undangan aktivasi'));
        if (originalDbIssue && row.email.trim().toLowerCase() === emailStr.toLowerCase()) {
          issues.push(originalDbIssue);
          hasError = true;
        }
      }

      // 2. Validasi Nama
      const namaStr = (updatedRow.nama || '').trim();
      if (!namaStr) {
        issues.push('Nama lengkap wajib diisi');
        hasError = true;
      } else if (namaStr.length < 2) {
        issues.push('Nama minimal 2 karakter');
        hasError = true;
      }

      // 3. Validasi Sekolah
      if (!updatedRow.sekolah_id && !updatedRow.sekolah) {
        issues.push('Asal sekolah belum dipilih');
        hasError = true;
      }

      // 4. Deteksi Gelar Akademik vs Role Siswa
      const hasAcademicTitle = academicTitlesRegex.test(namaStr);
      if (hasAcademicTitle && updatedRow.role === 'siswa') {
        issues.push('Terindikasi guru/kaprodi/bergelar akademik tetapi peran dipilih sebagai siswa');
      }

      const status: 'valid' | 'warning' | 'error' = hasError ? 'error' : issues.length > 0 ? 'warning' : 'valid';

      return {
        ...updatedRow,
        status,
        issues,
      };
    });

    const validCount = updatedRows.filter(r => r.status === 'valid').length;
    const issueCount = updatedRows.filter(r => r.status !== 'valid').length;

    setPreviewData({
      ...previewData,
      rows: updatedRows,
      validCount,
      issueCount,
    });
  };

  // 5c. Hapus Satu Baris dari Staging Data
  const handleDeleteRow = (tempId: string) => {
    if (!previewData) return;
    const updatedRows = previewData.rows.filter(r => r.tempId !== tempId);
    const validCount = updatedRows.filter(r => r.status === 'valid').length;
    const issueCount = updatedRows.filter(r => r.status !== 'valid').length;
    setPreviewData({
      ...previewData,
      rows: updatedRows,
      validCount,
      issueCount,
    });
  };

  // 5d. Hapus Semua Baris Error Sekaligus
  const handleDeleteAllErrors = () => {
    if (!previewData) return;
    const updatedRows = previewData.rows.filter(r => r.status !== 'error');
    const validCount = updatedRows.filter(r => r.status === 'valid').length;
    const issueCount = updatedRows.filter(r => r.status !== 'valid').length;
    setPreviewData({
      ...previewData,
      rows: updatedRows,
      validCount,
      issueCount,
    });
    setPreviewPage(1);
  };

  // 5e. Konfirmasi & Eksekusi Batch Import ke Database
  const handleConfirmImport = async () => {
    if (!previewData) return;

    const rowsToImport = previewData.rows.filter(r => r.status !== 'error');
    if (rowsToImport.length === 0) {
      setErrorMsg("Tidak ada baris data valid yang dapat diimpor.");
      return;
    }

    setIsConfirmingImport(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        users: rowsToImport.map(r => ({
          tempId: r.tempId,
          nama: r.nama,
          email: r.email,
          role: r.role,
          sekolah_id: r.sekolah_id,
          sekolah: r.sekolah,
          nis: r.nis || undefined,
          kelas: r.kelas || undefined,
          jurusan: r.jurusan || undefined,
          no_hp: r.no_hp || undefined,
          tanggal_lahir: r.tanggal_lahir || undefined,
          tempat_lahir: r.tempat_lahir || undefined,
          tahun_pendaftaran: r.tahun_pendaftaran || undefined,
        }))
      };

      const res = await fetch(`${API_URL}/admin/users/import-confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memproses import data pengguna");

      setSuccessMsg(data.message);
      setImportSummary(data.data);
      setIsReviewModalOpen(false);
      setPreviewData(null);
      setImportFile(null);
      fetchPendingInvitations();
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsConfirmingImport(false);
    }
  };

  // 5f. Filter & Pagination Staging Rows
  const getFilteredPreviewRows = () => {
    if (!previewData) return [];
    if (previewFilter === 'issues') {
      return previewData.rows.filter(r => r.status !== 'valid');
    }
    if (previewFilter === 'valid') {
      return previewData.rows.filter(r => r.status === 'valid');
    }
    return previewData.rows;
  };

  const filteredPreviewRows = getFilteredPreviewRows();
  const PREVIEW_PAGE_SIZE = 10;
  const totalPreviewPages = Math.ceil(filteredPreviewRows.length / PREVIEW_PAGE_SIZE) || 1;
  const paginatedPreviewRows = filteredPreviewRows.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE
  );

  // 6. Resend Invitation
  const handleResendInvite = async (id: number, email: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/invitations/${id}/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim ulang undangan");

      if (data.emailError) {
        setErrorMsg(`Undangan berhasil diperbarui, tetapi gagal mengirim email: ${data.emailError}`);
      } else {
        setSuccessMsg(`Undangan aktivasi berhasil dikirim ulang ke ${email}`);
      }
      fetchPendingInvitations();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 7. Delete/Cancel Invitation
  const confirmDeleteInvite = async (id: number) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/invitations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus undangan");

      setSuccessMsg("Undangan berhasil dibatalkan dan dihapus.");
      fetchPendingInvitations();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download Excel Template Helper (.xlsx)
  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/Template_Import_Pengguna_NKGTS.xlsx";
    link.setAttribute("download", "Template_Import_Pengguna_NKGTS.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 8. Handle Export Excel Nilai Siswa
  const handleExportExcel = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/admin/export-nilai`;
      if (exportSekolahId) {
        url += `?sekolah_id=${exportSekolahId}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal mengekspor data nilai siswa");
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `rekap_nilai_lms_nkgts${exportSekolahId ? `_sekolah_${exportSekolahId}` : ""}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      setSuccessMsg("Rekapitulasi nilai siswa berhasil diunduh ke format Excel.");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunduh file Excel nilai");
    } finally {
      setIsExporting(false);
    }
  };

  // ================= DATA PROCESSING PIPELINE (FILTER & SORT) =================
  const selectedSchool = schools.find((s) => s.id.toString() === exportSekolahId);
  const selectedSchoolName = selectedSchool?.nama_sekolah?.trim().toLowerCase();

  // 1. Process Active Users
  const processedUsers = users.filter((u) => {
    if (exportSekolahId) {
      const matchSekolah =
        (u.sekolah_id && u.sekolah_id.toString() === exportSekolahId) ||
        (selectedSchoolName && u.nama_sekolah && u.nama_sekolah.trim().toLowerCase() === selectedSchoolName);
      if (!matchSekolah) return false;
    }
    return true;
  });

  const sortedUsers = [...processedUsers].sort((a, b) => {
    if (sortField === "nama") {
      const cmp = a.nama.localeCompare(b.nama, "id", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortField === "date") {
      const timeA = new Date(a.created_at).getTime() || 0;
      const timeB = new Date(b.created_at).getTime() || 0;
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    }
    return 0;
  });

  // 2. Process Pending Invitations
  const filteredInvitations = invitations.filter((inv) => {
    const term = search.toLowerCase().trim();
    if (term) {
      const matchSearch =
        (inv.nama && inv.nama.toLowerCase().includes(term)) ||
        (inv.email && inv.email.toLowerCase().includes(term)) ||
        (inv.nis && inv.nis.toLowerCase().includes(term)) ||
        (inv.nama_sekolah && inv.nama_sekolah.toLowerCase().includes(term));
      if (!matchSearch) return false;
    }
    if (roleFilter && inv.role.toLowerCase() !== roleFilter.toLowerCase()) {
      return false;
    }
    if (exportSekolahId) {
      const matchSekolah =
        selectedSchoolName && inv.nama_sekolah && inv.nama_sekolah.trim().toLowerCase() === selectedSchoolName;
      if (!matchSekolah) return false;
    }
    return true;
  });

  const sortedInvitations = [...filteredInvitations].sort((a, b) => {
    if (sortField === "nama") {
      const cmp = a.nama.localeCompare(b.nama, "id", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortField === "date") {
      const timeA = new Date(a.expires_at).getTime() || 0;
      const timeB = new Date(b.expires_at).getTime() || 0;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }
    return 0;
  });

  const totalPendingPages = Math.ceil(sortedInvitations.length / 10) || 1;
  const currentPendingPage = Math.min(pendingPage, totalPendingPages);
  const paginatedInvitations = sortedInvitations.slice(
    (currentPendingPage - 1) * 10,
    currentPendingPage * 10
  );

  // 3. Process Active Password Resets
  const filteredResets = activeResets.filter((u) => {
    const term = search.toLowerCase().trim();
    if (term) {
      const matchSearch =
        (u.nama && u.nama.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.nis && u.nis.toLowerCase().includes(term)) ||
        (u.nama_sekolah && u.nama_sekolah.toLowerCase().includes(term));
      if (!matchSearch) return false;
    }
    if (roleFilter && u.role.toLowerCase() !== roleFilter.toLowerCase()) {
      return false;
    }
    if (exportSekolahId) {
      const matchSekolah =
        selectedSchoolName && u.nama_sekolah && u.nama_sekolah.trim().toLowerCase() === selectedSchoolName;
      if (!matchSekolah) return false;
    }
    return true;
  });

  const sortedResets = [...filteredResets].sort((a, b) => {
    if (sortField === "nama") {
      const cmp = a.nama.localeCompare(b.nama, "id", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortField === "date") {
      const timeA = new Date(a.reset_password_expires).getTime() || 0;
      const timeB = new Date(b.reset_password_expires).getTime() || 0;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }
    return 0;
  });

  const totalResetsPages = Math.ceil(sortedResets.length / 10) || 1;
  const currentResetsPage = Math.min(resetsPage, totalResetsPages);
  const paginatedResets = sortedResets.slice(
    (currentResetsPage - 1) * 10,
    currentResetsPage * 10
  );

  // ================= MULTI-SELECT & BULK ACTIONS LOGIC =================

  // Reset selectedIds setiap kali admin berpindah tab, halaman, filter, atau sort
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, page, pendingPage, resetsPage, search, roleFilter, exportSekolahId, sortField, sortOrder]);

  // Dapatkan seluruh ID data pada halaman aktif saat ini
  const getCurrentPageIds = (): string[] => {
    if (activeTab === "active") {
      return sortedUsers.map((u) => u.id);
    }
    if (activeTab === "pending") {
      return paginatedInvitations.map((inv) => String(inv.id));
    }
    if (activeTab === "resets") {
      return paginatedResets.map((u) => u.id);
    }
    return [];
  };

  const currentPageIds = getCurrentPageIds();
  const selectedOnCurrentPage = currentPageIds.filter((id) => selectedIds.includes(id));
  const isAllCurrentPageSelected = currentPageIds.length > 0 && selectedOnCurrentPage.length === currentPageIds.length;
  const isSomeCurrentPageSelected = selectedOnCurrentPage.length > 0 && !isAllCurrentPageSelected;

  // Set indeterminate state pada master checkbox desktop & mobile
  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeCurrentPageSelected;
    }
    if (mobileMasterCheckboxRef.current) {
      mobileMasterCheckboxRef.current.indeterminate = isSomeCurrentPageSelected;
    }
  }, [isSomeCurrentPageSelected, activeTab, selectedIds, currentPageIds.length]);

  // Toggle Pilih Semua pada halaman aktif
  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const set = new Set([...prev, ...currentPageIds]);
        return Array.from(set);
      });
    }
  };

  // Toggle Pilih Satu Baris / Kartu
  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Eksekusi Hapus Massal (Pengguna Aktif, Undangan Tertunda, atau Token Reset)
  const handleExecuteBulkDelete = async () => {
    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      setErrorMsg("Silakan pilih setidaknya satu pengguna / data untuk dihapus.");
      setIsBulkDeleteModalOpen(false);
      return;
    }

    const targetIds = selectedIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0 && id !== "undefined" && id !== "null");

    if (targetIds.length === 0) {
      setErrorMsg("Tidak ada data valid yang dipilih untuk dihapus.");
      setIsBulkDeleteModalOpen(false);
      return;
    }

    setBulkLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      if (activeTab === "active") {
        endpoint = `${API_URL}/admin/users/bulk-delete`;
      } else if (activeTab === "pending") {
        endpoint = `${API_URL}/admin/invitations/bulk-delete`;
      } else {
        endpoint = `${API_URL}/admin/resets/bulk-cancel`;
      }

      console.log(`[BULK DELETE] activeTab: ${activeTab}, target IDs:`, targetIds);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: targetIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal melakukan penghapusan massal");

      setSuccessMsg(data.message || `Berhasil memproses penghapusan massal pada ${targetIds.length} item.`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);

      if (activeTab === "active") {
        fetchActiveUsers();
      } else if (activeTab === "pending") {
        fetchPendingInvitations();
      } else {
        fetchActiveResets();
        fetchActiveUsers();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Eksekusi Kirim Massal Link Reset Kata Sandi (Tab Pengguna Aktif)
  const handleExecuteBulkSendReset = async () => {
    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      setErrorMsg("Silakan pilih setidaknya satu pengguna.");
      setIsBulkResetModalOpen(false);
      return;
    }

    const targetIds = selectedIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0 && id !== "undefined" && id !== "null");

    if (targetIds.length === 0) {
      setErrorMsg("Tidak ada pengguna valid yang dipilih.");
      setIsBulkResetModalOpen(false);
      return;
    }

    setBulkLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/bulk-send-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: targetIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirimkan link reset sandi massal");

      setSuccessMsg(data.message || `Selesai mengirim link reset sandi ke ${targetIds.length} pengguna.`);
      setSelectedIds([]);
      setIsBulkResetModalOpen(false);
      fetchActiveResets();
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Eksekusi Kirim Ulang Massal Email Undangan (Tab Undangan Tertunda)
  const handleExecuteBulkResendInvitations = async () => {
    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      setErrorMsg("Silakan pilih setidaknya satu undangan.");
      return;
    }

    const targetIds = selectedIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0 && id !== "undefined" && id !== "null");

    if (targetIds.length === 0) {
      setErrorMsg("Tidak ada undangan valid yang dipilih.");
      return;
    }

    setBulkLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/invitations/bulk-resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: targetIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim ulang undangan massal");

      setSuccessMsg(data.message || `Selesai mengirim ulang ${targetIds.length} undangan aktivasi.`);
      setSelectedIds([]);
      fetchPendingInvitations();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Eksekusi Perpanjang & Kirim Ulang Massal Token Reset (Tab Reset Sandi)
  const handleExecuteBulkResendResetPassword = async () => {
    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      setErrorMsg("Silakan pilih setidaknya satu token reset.");
      return;
    }

    const targetIds = selectedIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0 && id !== "undefined" && id !== "null");

    if (targetIds.length === 0) {
      setErrorMsg("Tidak ada token reset valid yang dipilih.");
      return;
    }

    setBulkLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/resets/bulk-resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: targetIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperpanjang link reset sandi massal");

      setSuccessMsg(data.message || `Selesai mengirim ulang link reset sandi ke ${targetIds.length} pengguna.`);
      setSelectedIds([]);
      fetchActiveResets();
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Eksekusi Batalkan Massal Token Reset (Tab Reset Sandi)
  const handleExecuteBulkCancelResets = async () => {
    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      setErrorMsg("Silakan pilih setidaknya satu token reset.");
      setIsBulkCancelResetModalOpen(false);
      return;
    }

    const targetIds = selectedIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0 && id !== "undefined" && id !== "null");

    if (targetIds.length === 0) {
      setErrorMsg("Tidak ada token reset valid yang dipilih.");
      setIsBulkCancelResetModalOpen(false);
      return;
    }

    setBulkLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/resets/bulk-cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: targetIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membatalkan tautan reset massal");

      setSuccessMsg(data.message || `Berhasil membatalkan ${targetIds.length} tautan reset sandi.`);
      setSelectedIds([]);
      setIsBulkCancelResetModalOpen(false);
      fetchActiveResets();
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 flex items-center gap-3">
            <Users className="text-primary h-7 w-7" />
            Kelola Pengguna
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Undang guru dan siswa baru secara manual atau massal, dan kelola akun aktif pada platform N-KGTS.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-neutral-200 bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 transition duration-200 cursor-pointer w-full"
          >
            <Upload size={15} />
            Import CSV/Excel
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/20 transition duration-200 cursor-pointer w-full"
          >
            <UserPlus size={15} />
            Undang Manual
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-start gap-3">
          <CheckCircle2 className="flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="font-semibold">{successMsg}</p>
            {importSummary && (
              <div className="mt-2 text-xs font-mono space-y-1 text-success-dark">
                <p>Berhasil diundang: {importSummary.success} baris</p>
                <p>Gagal diproses: {importSummary.failed} baris</p>
                {importSummary.errors.length > 0 && (
                  <details className="mt-1 cursor-pointer">
                    <summary className="font-bold underline hover:text-success">Tampilkan log kesalahan</summary>
                    <ul className="mt-1 list-disc list-inside max-h-40 overflow-y-auto bg-white/50 p-2 rounded border border-success/10">
                      {importSummary.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-100 mb-6 bg-white rounded-xl p-1 shadow-xs">
        <button
          onClick={() => {
            setActiveTab("active");
            setPage(1);
            setSortField("none");
          }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "active"
              ? "bg-primary text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          <Users size={16} />
          Pengguna Aktif ({totalUsers})
        </button>
        <button
          onClick={() => {
            setActiveTab("pending");
            setPendingPage(1);
            setSortField("none");
          }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "pending"
              ? "bg-primary text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          <Mail size={16} />
          Undangan Tertunda ({invitations.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("resets");
            setResetsPage(1);
            setSortField("none");
          }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "resets"
              ? "bg-primary text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          <KeyRound size={16} />
          Reset Sandi ({activeResets.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {/* Universal Filter & Search Bar (Tampil di Seluruh Tab) */}
        <div className={`p-4 sm:p-5 border-b border-neutral-100 grid grid-cols-1 sm:grid-cols-2 ${
          activeTab === "active" ? "lg:grid-cols-4" : "lg:grid-cols-3"
        } gap-3 items-center`}>
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari nama, email, NIS..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-primary transition"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-700 focus:outline-none focus:border-primary transition cursor-pointer font-semibold"
          >
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="guru">Guru</option>
            <option value="siswa">Siswa</option>
          </select>

          <select
            value={exportSekolahId}
            onChange={(e) => handleSekolahFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-700 focus:outline-none focus:border-primary transition cursor-pointer truncate font-semibold"
          >
            <option value="">Semua Sekolah</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {s.nama_sekolah}
              </option>
            ))}
          </select>

          {activeTab === "active" && (
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white shadow-xs transition cursor-pointer"
              title="Tarik Rekapitulasi Nilai Siswa Ke Format Excel"
            >
              <FileSpreadsheet size={15} />
              {isExporting ? "Mengekspor..." : "Export Excel Nilai"}
            </button>
          )}
        </div>

        {activeTab === "active" ? (
          /* ================= TAMPILAN PENGGUNA AKTIF ================= */
          <div>
            {/* Mobile Select All Bar */}
            {sortedUsers.length > 0 && (
              <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 text-xs text-neutral-600 font-semibold">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    ref={activeTab === "active" ? mobileMasterCheckboxRef : undefined}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span>Pilih Semua di Halaman Ini ({sortedUsers.length})</span>
                </label>
                {selectedOnCurrentPage.length > 0 && (
                  <span className="text-[11px] text-primary font-bold">
                    {selectedOnCurrentPage.length} dipilih
                  </span>
                )}
              </div>
            )}

            {/* Mobile Cards (< md) */}
            <div className="block md:hidden divide-y divide-neutral-100">
              {loading ? (
                <div className="p-8 text-center text-neutral-400 text-xs">Memuat data pengguna...</div>
              ) : sortedUsers.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  {search || roleFilter || exportSekolahId
                    ? "Tidak ada data pengguna yang cocok dengan pencarian."
                    : "Tidak ada pengguna aktif ditemukan."}
                </div>
              ) : (
                sortedUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 space-y-2.5 transition-colors ${
                      selectedIds.includes(user.id) ? "bg-blue-50/50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => handleToggleSelectOne(user.id)}
                          aria-label={`Pilih ${user.nama}`}
                          className="mt-0.5 w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600 flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-extrabold text-neutral-900 text-xs">{user.nama}</h4>
                          <p className="text-[11px] text-neutral-500 font-mono leading-tight">{user.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        user.role === "admin" ? "bg-purple-100 text-purple-700" : user.role === "guru" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-500 space-y-0.5 pl-7">
                      <p>Sekolah: <strong className="text-neutral-700 font-semibold">{user.nama_sekolah || "N-KGTS"}</strong></p>
                      <p>NIS: <strong className="font-mono text-neutral-700">{user.nis || "-"}</strong></p>
                      <p>Kelas / Jurusan: <strong className="text-primary font-bold">{formatKelasDisplay(user.kelas, user.jurusan)}</strong></p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-lg cursor-pointer transition"
                      >
                        <Edit size={11} />
                        Detail & Edit
                      </button>
                      {user.role === "siswa" && (
                        <button
                          onClick={() => {
                            setResetTargetUser({ id: user.id, nama: user.nama });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 border border-amber-600/30 rounded-lg cursor-pointer transition"
                        >
                          <RotateCcw size={11} />
                          Reset Progres
                        </button>
                      )}
                      <button
                        onClick={() => setSendResetTargetUser(user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700/30 rounded-lg cursor-pointer transition"
                      >
                        <KeyRound size={11} />
                        Reset Sandi
                      </button>
                      {user.email !== "admin@nkgts.com" && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.nama)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-700/30 rounded-lg cursor-pointer transition"
                        >
                          <Trash2 size={11} />
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 text-xs font-extrabold uppercase tracking-wider border-b border-neutral-50">
                    <th className="w-12 px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        ref={activeTab === "active" ? masterCheckboxRef : undefined}
                        checked={isAllCurrentPageSelected}
                        onChange={handleToggleSelectAll}
                        aria-label="Pilih semua baris pada halaman ini"
                        className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </th>
                    <th className="px-6 py-4">
                      <button
                        type="button"
                        onClick={handleToggleSortNama}
                        className={`cursor-pointer select-none hover:text-neutral-900 transition flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${
                          sortField === "nama" ? "text-neutral-900" : "text-neutral-400"
                        } group`}
                      >
                        <span>Nama</span>
                        {renderSortIcon("nama")}
                      </button>
                    </th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">NIS / Kelas / Jurusan</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Sekolah</th>
                    <th className="px-6 py-4">
                      <button
                        type="button"
                        onClick={handleToggleSortBergabung}
                        className={`cursor-pointer select-none hover:text-neutral-900 transition flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${
                          sortField === "date" ? "text-neutral-900" : "text-neutral-400"
                        } group`}
                      >
                        <span>Bergabung</span>
                        {renderSortIcon("date")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-sm text-neutral-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                        <div className="flex items-center justify-center gap-2.5">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
                           Memuat data pengguna...
                        </div>
                      </td>
                    </tr>
                  ) : sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                        {search || roleFilter || exportSekolahId
                          ? "Tidak ada data pengguna yang cocok dengan pencarian."
                          : "Tidak ada pengguna aktif ditemukan."}
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`transition duration-150 ${
                          selectedIds.includes(user.id) ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-neutral-50/50"
                        }`}
                      >
                        <td className="w-12 px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={() => handleToggleSelectOne(user.id)}
                            aria-label={`Pilih ${user.nama}`}
                            className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-neutral-900">
                          <div className="flex items-center gap-2">
                            <span>{user.nama}</span>
                            {user.has_active_reset_token && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                                title={`Reset terkirim (aktif s.d. ${user.reset_password_expires ? new Date(user.reset_password_expires).toLocaleString("id-ID") : ""})`}
                              >
                                <KeyRound size={10} />
                                Reset Terkirim
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{user.email}</td>
                        <td className="px-6 py-4 text-xs text-neutral-600">
                          <div className="font-mono text-neutral-800 font-semibold">{user.nis || "-"}</div>
                          {(user.kelas || user.jurusan) ? (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                              {formatKelasDisplay(user.kelas, user.jurusan)}
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.role === "admin" 
                              ? "bg-purple-100 text-purple-700" 
                              : user.role === "guru" 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-green-100 text-green-700"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-600">
                          {user.nama_sekolah || <span className="text-neutral-400 italic">N-KGTS</span>}
                        </td>
                        <td className="px-6 py-4 text-neutral-400 text-xs">
                          {new Date(user.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap min-w-[280px]">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs border border-slate-300/80 cursor-pointer whitespace-nowrap"
                              title="Lihat profil lengkap dan ubah data pengguna"
                            >
                              <Edit size={13} />
                              Detail & Edit
                            </button>

                            {user.role === "siswa" && (
                              <button
                                onClick={() => {
                                  setResetTargetUser({ id: user.id, nama: user.nama });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs border border-amber-600/30 cursor-pointer whitespace-nowrap"
                                title="Reset total progres belajar siswa"
                              >
                                <RotateCcw size={13} />
                                Reset Progres
                              </button>
                            )}

                            <button
                              onClick={() => setSendResetTargetUser(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs border border-blue-700/30 cursor-pointer whitespace-nowrap"
                              title="Kirim link reset kata sandi langsung ke email pengguna"
                            >
                              <KeyRound size={13} />
                              Reset Sandi
                            </button>

                            {user.email !== "admin@nkgts.com" && user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.nama)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs border border-rose-700/30 cursor-pointer whitespace-nowrap"
                                title="Hapus pengguna"
                              >
                                <Trash2 size={13} />
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {renderPagination(page, totalPages, totalUsers, "pengguna aktif", setPage)}
          </div>
        ) : activeTab === "pending" ? (
          /* ================= TAMPILAN UNDANGAN TERTUNDA ================= */
          <div>
            {/* Mobile Select All Bar */}
            {sortedInvitations.length > 0 && (
              <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 text-xs text-neutral-600 font-semibold">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    ref={activeTab === "pending" ? mobileMasterCheckboxRef : undefined}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span>Pilih Semua di Halaman Ini ({paginatedInvitations.length})</span>
                </label>
                {selectedOnCurrentPage.length > 0 && (
                  <span className="text-[11px] text-primary font-bold">
                    {selectedOnCurrentPage.length} dipilih
                  </span>
                )}
              </div>
            )}

            {/* Mobile Cards (< md) */}
            <div className="block md:hidden divide-y divide-neutral-100">
              {sortedInvitations.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  {search || roleFilter || exportSekolahId
                    ? "Tidak ada data undangan yang cocok dengan pencarian."
                    : "Tidak ada undangan tertunda yang aktif."}
                </div>
              ) : (
                paginatedInvitations.map((invite) => {
                  const idStr = String(invite.id);
                  const isSelected = selectedIds.includes(idStr);
                  return (
                    <div
                      key={invite.id}
                      className={`p-4 space-y-2.5 transition-colors ${
                        isSelected ? "bg-blue-50/50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(idStr)}
                            aria-label={`Pilih ${invite.nama}`}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600 flex-shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-neutral-900 text-xs">{invite.nama}</h4>
                            <p className="text-[11px] text-neutral-500 font-mono leading-tight">{invite.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          invite.role === "admin" ? "bg-purple-100 text-purple-700" : invite.role === "guru" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>
                          {invite.role}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-500 space-y-0.5 pl-7">
                        <p>Sekolah: <strong className="text-neutral-700 font-semibold">{invite.nama_sekolah || "N-KGTS"}</strong></p>
                        <p>NIS: <strong className="font-mono text-neutral-700">{invite.nis || "-"}</strong></p>
                        <p>Kedaluwarsa: <strong className={invite.is_expired ? "text-danger" : "text-neutral-600"}>
                          {invite.is_expired ? "Kedaluwarsa" : new Date(invite.expires_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </strong></p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                        <button
                          onClick={() => handleResendInvite(invite.id, invite.email)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs border border-blue-700/30 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          title="Kirim ulang email undangan"
                        >
                          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                          Kirim Ulang
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(invite.id)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs border border-rose-700/30 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          title="Batalkan dan hapus undangan"
                        >
                          <Trash2 size={12} />
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 text-xs font-extrabold uppercase tracking-wider border-b border-neutral-50">
                    <th className="w-12 px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        ref={activeTab === "pending" ? masterCheckboxRef : undefined}
                        checked={isAllCurrentPageSelected}
                        onChange={handleToggleSelectAll}
                        aria-label="Pilih semua baris pada halaman ini"
                        className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </th>
                    <th className="px-6 py-4">
                      <button
                        type="button"
                        onClick={handleToggleSortNama}
                        className={`cursor-pointer select-none hover:text-neutral-900 transition flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${
                          sortField === "nama" ? "text-neutral-900" : "text-neutral-400"
                        } group`}
                      >
                        <span>Nama</span>
                        {renderSortIcon("nama")}
                      </button>
                    </th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">NIS</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Sekolah</th>
                    <th className="px-6 py-4">
                      <button
                        type="button"
                        onClick={handleToggleSortKedaluwarsa}
                        className={`cursor-pointer select-none hover:text-neutral-900 transition flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${
                          sortField === "date" ? "text-neutral-900" : "text-neutral-400"
                        } group`}
                      >
                        <span>Kedaluwarsa</span>
                        {renderSortIcon("date")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-sm text-neutral-700">
                  {sortedInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                        {search || roleFilter || exportSekolahId
                          ? "Tidak ada data undangan yang cocok dengan pencarian."
                          : "Tidak ada undangan tertunda yang aktif."}
                      </td>
                    </tr>
                  ) : (
                    paginatedInvitations.map((invite) => {
                      const idStr = String(invite.id);
                      const isSelected = selectedIds.includes(idStr);
                      return (
                        <tr
                          key={invite.id}
                          className={`transition duration-150 ${
                            isSelected ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-neutral-50/50"
                          }`}
                        >
                          <td className="w-12 px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(idStr)}
                              aria-label={`Pilih ${invite.nama}`}
                              className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-neutral-900">{invite.nama}</td>
                          <td className="px-6 py-4 font-mono text-xs">{invite.email}</td>
                          <td className="px-6 py-4 text-neutral-400">{invite.nis || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                              invite.role === "admin" 
                                ? "bg-purple-100 text-purple-700" 
                                : invite.role === "guru" 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {invite.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">{invite.nama_sekolah}</td>
                          <td className="px-6 py-4 text-xs">
                            <span className={`font-semibold ${invite.is_expired ? "text-danger" : "text-neutral-400"}`}>
                              {invite.is_expired ? "Kedaluwarsa" : new Date(invite.expires_at).toLocaleDateString("id-ID", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap min-w-[220px]">
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <button
                                onClick={() => handleResendInvite(invite.id, invite.email)}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs border border-blue-700/30 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                title="Kirim ulang email undangan"
                              >
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                                Kirim Ulang
                              </button>
                              <button
                                onClick={() => setDeleteTargetId(invite.id)}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs border border-rose-700/30 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                title="Batalkan dan hapus undangan"
                              >
                                <Trash2 size={13} />
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {renderPagination(
              currentPendingPage,
              totalPendingPages,
              sortedInvitations.length,
              "undangan tertunda",
              setPendingPage
            )}
          </div>
        ) : (
          /* ================= TAMPILAN RESET SANDI AKTIF ================= */
          <div>
            <div className="p-5 border-b border-neutral-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Daftar Token Reset Sandi Aktif</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Pengguna yang saat ini memiliki tautan atur ulang kata sandi aktif (berlaku 24 jam).
                </p>
              </div>
              <button
                onClick={fetchActiveResets}
                disabled={loadingResets}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw size={12} className={loadingResets ? "animate-spin" : ""} />
                Segarkan
              </button>
            </div>

            {/* Mobile Select All Bar */}
            {sortedResets.length > 0 && (
              <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 text-xs text-neutral-600 font-semibold">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    ref={activeTab === "resets" ? mobileMasterCheckboxRef : undefined}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span>Pilih Semua di Halaman Ini ({paginatedResets.length})</span>
                </label>
                {selectedOnCurrentPage.length > 0 && (
                  <span className="text-[11px] text-primary font-bold">
                    {selectedOnCurrentPage.length} dipilih
                  </span>
                )}
              </div>
            )}

            {/* Mobile Cards (< md) */}
            <div className="block md:hidden divide-y divide-neutral-100">
              {loadingResets ? (
                <div className="p-8 text-center text-neutral-400 text-xs">Memuat data token aktif...</div>
              ) : sortedResets.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  {search || roleFilter || exportSekolahId
                    ? "Tidak ada data token reset yang cocok dengan pencarian."
                    : "Tidak ada token reset password yang sedang aktif saat ini."}
                </div>
              ) : (
                paginatedResets.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className={`p-4 space-y-2.5 transition-colors ${
                        isSelected ? "bg-blue-50/50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(user.id)}
                            aria-label={`Pilih ${user.nama}`}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600 flex-shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-neutral-900 text-xs">{user.nama}</h4>
                            <p className="text-[11px] text-neutral-500 font-mono leading-tight">{user.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          user.role === "admin" ? "bg-purple-100 text-purple-700" : user.role === "guru" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>
                          {user.role}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-500 space-y-0.5 pl-7">
                        <p>Sekolah: <strong className="text-neutral-700 font-semibold">{user.nama_sekolah || "N-KGTS"}</strong></p>
                        <p>NIS: <strong className="font-mono text-neutral-700">{user.nis || "-"}</strong></p>
                        <p>Kedaluwarsa: <strong className="text-amber-700 font-semibold">
                          {new Date(user.reset_password_expires).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </strong> ({formatTimeRemaining(user.reset_password_expires)})</p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                        <button
                          onClick={() => setSendResetTargetUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs border border-blue-700/30 cursor-pointer"
                        >
                          <RefreshCw size={12} />
                          Kirim Ulang
                        </button>
                        <button
                          onClick={() => setCancelResetTargetUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs border border-rose-700/30 cursor-pointer"
                        >
                          <X size={12} />
                          Batalkan
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 text-xs font-extrabold uppercase tracking-wider border-b border-neutral-50">
                    <th className="w-12 px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        ref={activeTab === "resets" ? masterCheckboxRef : undefined}
                        checked={isAllCurrentPageSelected}
                        onChange={handleToggleSelectAll}
                        aria-label="Pilih semua baris pada halaman ini"
                        className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </th>
                    <th className="px-6 py-4">
                      <button
                        type="button"
                        onClick={handleToggleSortNama}
                        className={`cursor-pointer select-none hover:text-neutral-900 transition flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${
                          sortField === "nama" ? "text-neutral-900" : "text-neutral-400"
                        } group`}
                      >
                        <span>Nama</span>
                        {renderSortIcon("nama")}
                      </button>
                    </th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">NIS</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Sekolah</th>
                    <th className="px-6 py-4">
                      <button
                        type="button"
                        onClick={handleToggleSortKedaluwarsa}
                        className={`cursor-pointer select-none hover:text-neutral-900 transition flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${
                          sortField === "date" ? "text-neutral-900" : "text-neutral-400"
                        } group`}
                      >
                        <span>Kedaluwarsa</span>
                        {renderSortIcon("date")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-sm text-neutral-700">
                  {loadingResets ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                        <div className="flex items-center justify-center gap-2.5">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
                          Memuat data token aktif...
                        </div>
                      </td>
                    </tr>
                  ) : sortedResets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                        {search || roleFilter || exportSekolahId
                          ? "Tidak ada data token reset yang cocok dengan pencarian."
                          : "Tidak ada token reset password yang sedang aktif saat ini."}
                      </td>
                    </tr>
                  ) : (
                    paginatedResets.map((user) => {
                      const isSelected = selectedIds.includes(user.id);
                      return (
                        <tr
                          key={user.id}
                          className={`transition duration-150 ${
                            isSelected ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-neutral-50/50"
                          }`}
                        >
                          <td className="w-12 px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(user.id)}
                              aria-label={`Pilih ${user.nama}`}
                              className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-neutral-900">{user.nama}</td>
                          <td className="px-6 py-4 font-mono text-xs">{user.email}</td>
                          <td className="px-6 py-4 text-neutral-400">{user.nis || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                              user.role === "admin" 
                                ? "bg-purple-100 text-purple-700" 
                                : user.role === "guru" 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">{user.nama_sekolah}</td>
                          <td className="px-6 py-4 text-xs">
                            <div className="flex flex-col">
                              <span className="font-semibold text-amber-700">
                                {new Date(user.reset_password_expires).toLocaleDateString("id-ID", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {formatTimeRemaining(user.reset_password_expires)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap min-w-[220px]">
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <button
                                onClick={() => setSendResetTargetUser(user)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs border border-blue-700/30 cursor-pointer whitespace-nowrap"
                                title="Kirim ulang email reset kata sandi (perpanjang 24 jam)"
                              >
                                <RefreshCw size={13} />
                                Kirim Ulang
                              </button>
                              <button
                                onClick={() => setCancelResetTargetUser(user)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs border border-rose-700/30 cursor-pointer whitespace-nowrap"
                                title="Batalkan tautan token reset sandi"
                              >
                                <X size={13} />
                                Batalkan
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {renderPagination(
              currentResetsPage,
              totalResetsPages,
              sortedResets.length,
              "token reset sandi",
              setResetsPage
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL KONFIRMASI HAPUS UNDANGAN ================= */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-danger">
              <div className="p-2 rounded-xl bg-danger/10">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-lg text-neutral-900">Batalkan Undangan?</h3>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Apakah Anda yakin ingin membatalkan dan menghapus undangan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="rounded-xl border border-neutral-200 text-neutral-600 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  const id = deleteTargetId;
                  setDeleteTargetId(null);
                  await confirmDeleteInvite(id);
                }}
                className="rounded-xl bg-danger hover:bg-danger/90 text-white px-4 py-2 text-sm font-bold transition shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL UNDANG MANUAL ================= */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2.5">
                <UserPlus className="text-primary" size={20} />
                Undang Pengguna Baru
              </h2>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.nama}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="Masukkan nama lengkap..."
                  className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Alamat Email *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="nama.pengguna@sekolah.sch.id"
                  className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Peran (Role) *</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm bg-white focus:outline-none focus:border-primary transition cursor-pointer"
                  >
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">NIS (Opsional)</label>
                  <input
                    type="text"
                    value={inviteForm.nis}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, nis: e.target.value }))}
                    placeholder="NIS siswa..."
                    className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Sekolah Asal *</label>
                <select
                  value={inviteForm.sekolah_id}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, sekolah_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm bg-white focus:outline-none focus:border-primary transition cursor-pointer"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.nama_sekolah}</option>
                  ))}
                </select>
              </div>

              {inviteForm.role === "siswa" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Kelas Siswa (Opsional)
                  </label>
                  <input
                    type="text"
                    value={inviteForm.kelas}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, kelas: e.target.value }))}
                    placeholder="Contoh: XII TKJ 1"
                    className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-neutral-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 border border-neutral-100 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/10 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Mengirim..." : "Kirim Undangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL IMPORT CSV / EXCEL ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2.5">
                <Upload className="text-primary" size={20} />
                Import Pengguna Massal
              </h2>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleStartImportPreview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Sekolah Tujuan (Opsional / Fallback)</label>
                <select
                  value={importSekolahId}
                  onChange={(e) => setImportSekolahId(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm bg-white focus:outline-none focus:border-primary transition cursor-pointer text-neutral-700 font-medium"
                >
                  <option value="">-- Otomatis dibaca dari kolom Asal Sekolah di File --</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.nama_sekolah}</option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Sistem akan otomatis mendeteksi nama sekolah dari kolom <strong>Asal Sekolah</strong> per baris di file Excel/CSV.
                </p>
              </div>

              {/* Upload Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">File CSV / Excel *</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition flex flex-col items-center justify-center ${
                    importFile 
                      ? "border-success bg-success/5" 
                      : "border-neutral-200 hover:border-primary bg-neutral-50"
                  }`}
                >
                  {importFile ? (
                    <div className="flex flex-col items-center">
                      <FileSpreadsheet className="text-success h-10 w-10 mb-2" />
                      <p className="text-sm font-bold text-neutral-900 max-w-[250px] truncate">{importFile.name}</p>
                      <p className="text-xs text-neutral-400 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p>
                      <button 
                        type="button" 
                        onClick={() => setImportFile(null)}
                        className="mt-3 text-xs font-bold text-danger hover:underline cursor-pointer"
                      >
                        Ganti File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="text-neutral-400 h-10 w-10 mb-2" />
                      <p className="text-sm text-neutral-700 font-semibold">Tarik file Anda ke sini atau cari</p>
                      <p className="text-xs text-neutral-400 mt-1">Format didukung: .csv, .xlsx, .xls</p>
                      <input
                        type="file"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        required
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setImportFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        id="import-file-input"
                      />
                      <label
                        htmlFor="import-file-input"
                        className="mt-4 px-4 py-2 border border-neutral-200 bg-white rounded-xl text-xs font-bold hover:bg-neutral-50 shadow-xs cursor-pointer inline-block"
                      >
                        Pilih File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Download Card */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-primary">Butuh format tabel?</h4>
                  <p className="text-[11px] text-primary/75 mt-0.5">Gunakan file template terstandar di samping agar data sukses diimpor ke sistem LMS.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0"
                >
                  <Download size={12} />
                  Format
                </button>
              </div>

              <div className="pt-4 border-t border-neutral-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-neutral-100 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPreviewLoading || !importFile}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/10 transition cursor-pointer disabled:opacity-50"
                >
                  {isPreviewLoading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Memindai Data...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={15} />
                      Pratinjau Data (Dry-Run)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL REVIEW WIZARD (DATA STAGING DRY-RUN) ================= */}
      {isReviewModalOpen && previewData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 bg-neutral-50/50">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      Peninjauan & Staging Data Impor Pengguna
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Tinjau dan koreksi data sebelum disimpan ke database dan dikirimkan undangan email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
                  title="Tutup Modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Metric Chips & Quick Filter Tabs Bar */}
            <div className="px-5 py-3.5 bg-white border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              {/* Metric Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                  <span>Total Terbaca:</span>
                  <strong className="text-neutral-900">{previewData.rows.length}</strong>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Siap Diimpor:</span>
                  <strong className="text-emerald-800">{previewData.validCount}</strong>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertCircle size={13} className="text-amber-600" />
                  <span>Perlu Ditinjau:</span>
                  <strong className="text-amber-900">{previewData.issueCount}</strong>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewFilter("all");
                    setPreviewPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    previewFilter === "all"
                      ? "bg-white text-blue-600 shadow-xs font-bold"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  Semua ({previewData.rows.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewFilter("issues");
                    setPreviewPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    previewFilter === "issues"
                      ? "bg-amber-600 text-white shadow-xs font-bold"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <AlertCircle size={12} />
                  Bermasalah ({previewData.issueCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewFilter("valid");
                    setPreviewPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    previewFilter === "valid"
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <CheckCircle2 size={12} />
                  Siap Impor ({previewData.validCount})
                </button>
              </div>
            </div>

            {/* Body Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-50/50">
              {filteredPreviewRows.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100 p-6">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2" />
                  <h3 className="text-sm font-bold text-neutral-800">Tidak ada baris data pada filter ini</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {previewFilter === "issues" 
                      ? "Semua data sudah siap diimpor tanpa kendala!" 
                      : "Silakan pilih tab filter lainnya."}
                  </p>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs">
                    <table className="w-full text-left border-collapse min-w-[950px]">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-3 w-12 text-center">Status</th>
                          <th className="py-3 px-3 w-48">Nama Lengkap</th>
                          <th className="py-3 px-3 w-52">Email</th>
                          <th className="py-3 px-3 w-28">Peran</th>
                          <th className="py-3 px-3 w-48">Asal Sekolah</th>
                          <th className="py-3 px-3 w-36">NIS & Kelas</th>
                          <th className="py-3 px-3">Catatan / Validasi</th>
                          <th className="py-3 px-3 w-12 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs">
                        {paginatedPreviewRows.map((row) => (
                          <tr key={row.tempId} className={`hover:bg-neutral-50/80 transition ${row.status === 'error' ? 'bg-rose-50/30' : row.status === 'warning' ? 'bg-amber-50/20' : ''}`}>
                            {/* Status Icon */}
                            <td className="py-3 px-3 text-center align-top">
                              {row.status === "error" && (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold" title="Memiliki kendala fatal">
                                  <AlertCircle size={15} />
                                </span>
                              )}
                              {row.status === "warning" && (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-bold" title="Perlu ditinjau">
                                  <AlertCircle size={15} />
                                </span>
                              )}
                              {row.status === "valid" && (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold" title="Valid">
                                  <CheckCircle2 size={15} />
                                </span>
                              )}
                            </td>

                            {/* Nama */}
                            <td className="py-3 px-3 align-top">
                              <input
                                type="text"
                                value={row.nama}
                                onChange={(e) => handleUpdateRowFields(row.tempId, { nama: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:border-blue-500 bg-white"
                                placeholder="Nama Lengkap"
                              />
                              {row.jurusan && (
                                <span className="text-[10px] text-neutral-400 block mt-1 truncate max-w-[180px]">
                                  Jurusan: {row.jurusan}
                                </span>
                              )}
                            </td>

                            {/* Email */}
                            <td className="py-3 px-3 align-top">
                              <input
                                type="email"
                                value={row.email}
                                onChange={(e) => handleUpdateRowFields(row.tempId, { email: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-blue-500 bg-white"
                                placeholder="nama@email.com"
                              />
                            </td>

                            {/* Role */}
                            <td className="py-3 px-3 align-top">
                              <select
                                value={row.role}
                                onChange={(e) => handleUpdateRowFields(row.tempId, { role: e.target.value as any })}
                                className="w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:border-blue-500 text-neutral-700 cursor-pointer"
                              >
                                <option value="siswa">Siswa</option>
                                <option value="guru">Guru</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>

                            {/* Sekolah */}
                            <td className="py-3 px-3 align-top">
                              <select
                                value={row.sekolah_id || ""}
                                onChange={(e) => {
                                  const selId = Number(e.target.value);
                                  const matched = previewData.availableSchools.find(s => s.id === selId);
                                  if (matched) {
                                    handleUpdateRowFields(row.tempId, { sekolah_id: matched.id, sekolah: matched.nama_sekolah });
                                  } else {
                                    handleUpdateRowFields(row.tempId, { sekolah_id: undefined });
                                  }
                                }}
                                className="w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500 text-neutral-700 cursor-pointer"
                              >
                                <option value="">-- Pilih Sekolah --</option>
                                {previewData.availableSchools.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.nama_sekolah}
                                  </option>
                                ))}
                              </select>
                              {row.sekolah && !row.sekolah_id && (
                                <span className="text-[10px] text-neutral-400 block mt-1 truncate">
                                  Teks: {row.sekolah}
                                </span>
                              )}
                            </td>

                            {/* NIS & Kelas */}
                            <td className="py-3 px-3 align-top space-y-1">
                              <input
                                type="text"
                                value={row.nis || ""}
                                onChange={(e) => handleUpdateRowFields(row.tempId, { nis: e.target.value })}
                                className="w-full px-2 py-1 border border-neutral-200 rounded-md text-[11px] text-neutral-700 focus:outline-none focus:border-blue-500 bg-white"
                                placeholder="NIS (opsional)"
                              />
                              <input
                                type="text"
                                value={row.kelas || ""}
                                onChange={(e) => handleUpdateRowFields(row.tempId, { kelas: e.target.value })}
                                className="w-full px-2 py-1 border border-neutral-200 rounded-md text-[11px] text-neutral-700 focus:outline-none focus:border-blue-500 bg-white"
                                placeholder="Kelas (opsional)"
                              />
                            </td>

                            {/* Catatan / Issues */}
                            <td className="py-3 px-3 align-top">
                              {row.issues && row.issues.length > 0 ? (
                                <div className="space-y-1">
                                  {row.issues.map((iss, i) => (
                                    <div
                                      key={i}
                                      className={`text-[11px] leading-tight px-2 py-1 rounded-md flex items-start gap-1.5 ${
                                        row.status === "error"
                                          ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                          : "bg-amber-50 text-amber-800 border border-amber-200/60"
                                      }`}
                                    >
                                      <span className="font-bold">•</span>
                                      <span>{iss}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 size={12} /> Siap Diimpor
                                </span>
                              )}
                            </td>

                            {/* Aksi Hapus Baris */}
                            <td className="py-3 px-3 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.tempId)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Buang baris ini dari antrean impor"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE & TABLET CARD LIST VIEW */}
                  <div className="block md:hidden space-y-3">
                    {paginatedPreviewRows.map((row) => (
                      <div
                        key={row.tempId}
                        className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 transition ${
                          row.status === "error"
                            ? "border-rose-200 bg-rose-50/15"
                            : row.status === "warning"
                            ? "border-amber-200 bg-amber-50/15"
                            : "border-neutral-200"
                        }`}
                      >
                        {/* Header Kartu */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={row.nama}
                              onChange={(e) => handleUpdateRowFields(row.tempId, { nama: e.target.value })}
                              className="w-full text-sm font-bold text-neutral-900 border-b border-transparent focus:border-blue-500 pb-0.5 bg-transparent"
                              placeholder="Nama Lengkap"
                            />
                            <input
                              type="email"
                              value={row.email}
                              onChange={(e) => handleUpdateRowFields(row.tempId, { email: e.target.value })}
                              className="w-full text-xs text-neutral-500 border-b border-transparent focus:border-blue-500 mt-1 bg-transparent"
                              placeholder="Email aktif"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {row.status === "error" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                Eror
                              </span>
                            )}
                            {row.status === "warning" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Periksa
                              </span>
                            )}
                            {row.status === "valid" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                Siap
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.tempId)}
                              className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg"
                              title="Hapus baris"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Kotak Isu Kendala */}
                        {row.issues && row.issues.length > 0 && (
                          <div
                            className={`p-2.5 rounded-lg text-xs space-y-1 ${
                              row.status === "error"
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {row.issues.map((iss, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                                <span className="font-bold">•</span>
                                <span>{iss}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Thumb-friendly Role Segment */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                            Peran Pengguna
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 p-1 rounded-xl">
                            {(["siswa", "guru", "admin"] as const).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => handleUpdateRowFields(row.tempId, { role: r })}
                                className={`py-1.5 text-xs font-bold rounded-lg transition capitalize cursor-pointer ${
                                  row.role === r
                                    ? "bg-white text-blue-600 shadow-xs"
                                    : "text-neutral-500 hover:text-neutral-800"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Dropdown Sekolah */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                            Asal Sekolah
                          </label>
                          <select
                            value={row.sekolah_id || ""}
                            onChange={(e) => {
                              const selId = Number(e.target.value);
                              const matched = previewData.availableSchools.find(s => s.id === selId);
                              if (matched) {
                                handleUpdateRowFields(row.tempId, { sekolah_id: matched.id, sekolah: matched.nama_sekolah });
                              } else {
                                handleUpdateRowFields(row.tempId, { sekolah_id: undefined });
                              }
                            }}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white font-medium text-neutral-700"
                          >
                            <option value="">-- Pilih Sekolah --</option>
                            {previewData.availableSchools.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nama_sekolah}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Grid NIS & Kelas */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                              NIS
                            </label>
                            <input
                              type="text"
                              value={row.nis || ""}
                              onChange={(e) => handleUpdateRowFields(row.tempId, { nis: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                              placeholder="Nomor Induk"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                              Kelas
                            </label>
                            <input
                              type="text"
                              value={row.kelas || ""}
                              onChange={(e) => handleUpdateRowFields(row.tempId, { kelas: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                              placeholder="Tingkat / Kelas"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination Bar */}
            {filteredPreviewRows.length > 0 && (
              <div className="px-5 py-3 bg-white border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 flex-shrink-0">
                <span>
                  Menampilkan{" "}
                  <strong>
                    {(previewPage - 1) * PREVIEW_PAGE_SIZE + 1} -{" "}
                    {Math.min(previewPage * PREVIEW_PAGE_SIZE, filteredPreviewRows.length)}
                  </strong>{" "}
                  dari <strong>{filteredPreviewRows.length}</strong> baris
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50 transition cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-2 font-medium">
                    Halaman {previewPage} / {totalPreviewPages}
                  </span>
                  <button
                    type="button"
                    disabled={previewPage >= totalPreviewPages}
                    onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                    className="p-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50 transition cursor-pointer"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer & Action Bar */}
            <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div>
                {previewData.rows.some((r) => r.status === "error") && (
                  <button
                    type="button"
                    onClick={handleDeleteAllErrors}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Hapus Baris Eror ({previewData.rows.filter((r) => r.status === "error").length})
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={isConfirmingImport}
                  className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-white cursor-pointer transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={
                    isConfirmingImport ||
                    previewData.rows.filter((r) => r.status !== "error").length === 0
                  }
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirmingImport ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Mengimpor Data...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Konfirmasi & Impor {previewData.rows.filter((r) => r.status !== "error").length} Pengguna
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL & EDIT PENGGUNA LENGKAP ================= */}
      {selectedEditUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-neutral-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between flex-shrink-0 bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Edit size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">
                    Detail & Edit Profil Pengguna
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Perbarui profil akun, informasi akademik, dan data kontak
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEditUser(null)}
                className="text-neutral-400 hover:text-neutral-600 transition p-1 rounded-lg hover:bg-neutral-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUserSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* SECTION 1: Informasi Akun */}
              <div>
                <div className="flex items-center gap-2 mb-3 pb-1 border-b border-neutral-100">
                  <Users size={15} className="text-primary" />
                  <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">Informasi Akun</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={editForm.nama}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nama: e.target.value }))}
                      placeholder="Masukkan nama lengkap..."
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 font-medium focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Email Akun <span className="text-[10px] text-neutral-400 font-normal">(Read-only)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={editForm.email}
                        className="w-full px-3.5 py-2.5 pr-8 border border-neutral-200 rounded-xl text-xs bg-neutral-100 text-neutral-500 font-mono cursor-not-allowed"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400">
                        <Lock size={13} />
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Peran Akun (Role) *</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white font-bold text-neutral-700 focus:outline-none focus:border-primary transition cursor-pointer"
                    >
                      <option value="siswa">Siswa (Peserta Pembelajaran N-KGTS)</option>
                      <option value="guru">Guru (Guru Praktisi Kaizen)</option>
                      <option value="admin">Admin (Administrator Platform)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Sekolah Asal *</label>
                    <select
                      value={editForm.sekolah_id}
                      onChange={(e) => setEditForm(prev => ({ ...prev, sekolah_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-700 font-medium focus:outline-none focus:border-primary transition cursor-pointer"
                    >
                      {schools.map((s) => (
                        <option key={s.id} value={s.id.toString()}>
                          {s.nama_sekolah}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Data Akademik (Khusus Siswa) */}
              <div className={editForm.role !== "siswa" ? "opacity-60" : ""}>
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={15} className="text-primary" />
                    <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">Data Akademik</h3>
                  </div>
                  {editForm.role !== "siswa" && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                      Opsional untuk {editForm.role}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">NIS (Nomor Induk Siswa)</label>
                    <input
                      type="text"
                      value={editForm.nis}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nis: e.target.value }))}
                      placeholder="Contoh: 20241001"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 font-mono focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Kelas</label>
                    <input
                      type="text"
                      value={editForm.kelas}
                      onChange={(e) => setEditForm(prev => ({ ...prev, kelas: e.target.value }))}
                      placeholder="Contoh: XII TKJ 1"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Jurusan / Nama SGA</label>
                    <input
                      type="text"
                      value={editForm.jurusan}
                      onChange={(e) => setEditForm(prev => ({ ...prev, jurusan: e.target.value }))}
                      placeholder="Contoh: Teknik Komputer & Jaringan"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Tahun Angkatan / Pendaftaran</label>
                    <input
                      type="number"
                      value={editForm.tahun_pendaftaran}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tahun_pendaftaran: e.target.value }))}
                      placeholder="Contoh: 2026"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Data Pribadi & Kontak Siswa */}
              <div className={editForm.role !== "siswa" ? "opacity-60" : ""}>
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-primary" />
                    <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">Data Pribadi & Kontak</h3>
                  </div>
                  {editForm.role !== "siswa" && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                      Opsional untuk {editForm.role}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">No. WhatsApp / HP</label>
                    <input
                      type="text"
                      value={editForm.no_hp}
                      onChange={(e) => setEditForm(prev => ({ ...prev, no_hp: e.target.value }))}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 font-mono focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={editForm.tempat_lahir}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tempat_lahir: e.target.value }))}
                      placeholder="Contoh: Jakarta"
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={editForm.tanggal_lahir}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedEditUser(null)}
                  className="px-4 py-2.5 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingUser}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition cursor-pointer disabled:opacity-50"
                >
                  {updatingUser ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetTargetUser && (
        <ResetProgressModal
          isOpen={true}
          userId={resetTargetUser.id}
          userName={resetTargetUser.nama}
          onClose={() => setResetTargetUser(null)}
          onSuccess={(msg) => {
            setSuccessMsg(msg);
            setErrorMsg(null);
            fetchActiveUsers();
          }}
        />
      )}

      {/* Modal Konfirmasi Kirim Link Reset Password */}
      {sendResetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-base">Kirim Link Reset Password</h3>
                <p className="text-xs text-neutral-400">Instruksi atur ulang sandi via email resmi</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-neutral-600 leading-relaxed">
                Apakah Anda yakin ingin mengirimkan email instruksi atur ulang kata sandi ke akun berikut?
              </p>
              <div className="p-3.5 bg-neutral-50 border border-neutral-100 rounded-xl space-y-1">
                <p className="font-bold text-neutral-900 text-sm">{sendResetTargetUser.nama}</p>
                <p className="text-neutral-500 font-mono text-xs">{sendResetTargetUser.email}</p>
                <p className="text-neutral-400 text-[11px] font-semibold">{sendResetTargetUser.nama_sekolah}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-medium leading-relaxed">
                * Tautan pada email ini berlaku selama <strong>24 jam</strong>. Pengguna dapat membuka tautan tersebut untuk membuat kata sandi baru secara mandiri.
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={sendingReset}
                onClick={() => setSendResetTargetUser(null)}
                className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sendingReset}
                onClick={handleSendResetPasswordSubmit}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-bold shadow-sm shadow-primary/10 transition cursor-pointer disabled:opacity-50"
              >
                {sendingReset ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim Email...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Ya, Kirim Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Batalkan Token Reset */}
      {cancelResetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <X size={20} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-base">Batalkan Tautan Reset</h3>
                <p className="text-xs text-neutral-400">Nonaktifkan token atur ulang sandi</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-neutral-600 leading-relaxed">
                Apakah Anda yakin ingin membatalkan tautan reset kata sandi untuk akun berikut?
              </p>
              <div className="p-3.5 bg-neutral-50 border border-neutral-100 rounded-xl space-y-1">
                <p className="font-bold text-neutral-900 text-sm">{cancelResetTargetUser.nama}</p>
                <p className="text-neutral-500 font-mono text-xs">{cancelResetTargetUser.email}</p>
                <p className="text-neutral-400 text-[11px] font-semibold">{cancelResetTargetUser.nama_sekolah}</p>
              </div>
              <p className="text-neutral-500 text-[11px] leading-relaxed">
                Setelah dibatalkan, tautan yang sebelumnya dikirim ke email pengguna tidak akan dapat digunakan lagi.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={cancelingReset}
                onClick={() => setCancelResetTargetUser(null)}
                className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={cancelingReset}
                onClick={handleCancelResetPasswordSubmit}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {cancelingReset ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Membatalkan...
                  </>
                ) : (
                  "Ya, Batalkan Tautan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FLOATING ACTION BAR (BILAH AKSI MELAYANG) ================= */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-3xl bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/60 flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-600 text-white font-black text-xs shadow-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
              {activeTab === "pending" ? "Undangan Dipilih" : "Pengguna Dipilih"}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Contextual Action per Tab */}
            {activeTab === "active" && (
              <button
                type="button"
                onClick={() => {
                  if (!selectedIds || selectedIds.length === 0) {
                    setErrorMsg("Silakan pilih setidaknya satu pengguna terlebih dahulu.");
                    return;
                  }
                  setIsBulkResetModalOpen(true);
                }}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <KeyRound size={13} />
                Kirim Link Reset Terpilih
              </button>
            )}

            {activeTab === "pending" && (
              <button
                type="button"
                onClick={handleExecuteBulkResendInvitations}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={bulkLoading ? "animate-spin" : ""} />
                Kirim Ulang Undangan Terpilih
              </button>
            )}

            {activeTab === "resets" && (
              <>
                <button
                  type="button"
                  onClick={handleExecuteBulkResendResetPassword}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={bulkLoading ? "animate-spin" : ""} />
                  Kirim Ulang Terpilih
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedIds || selectedIds.length === 0) {
                      setErrorMsg("Silakan pilih setidaknya satu token terlebih dahulu.");
                      return;
                    }
                    setIsBulkCancelResetModalOpen(true);
                  }}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <X size={13} />
                  Batalkan Tautan Terpilih
                </button>
              </>
            )}

            {/* Batch Delete Button */}
            <button
              type="button"
              onClick={() => {
                if (!selectedIds || selectedIds.length === 0) {
                  setErrorMsg("Silakan pilih setidaknya satu data terlebih dahulu.");
                  return;
                }
                setIsBulkDeleteModalOpen(true);
              }}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              Hapus Terpilih
            </button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS MASSAL ================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-danger">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-neutral-900">
                  Konfirmasi Hapus {selectedIds.length} {activeTab === "pending" ? "Undangan" : "Pengguna"}
                </h3>
                <p className="text-xs text-neutral-400">Penghapusan data secara massal</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{selectedIds.length}</strong> data yang dipilih? Tindakan ini bersifat permanen dan akan menghapus data terpilih dari sistem.
            </p>
            {activeTab === "active" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
                Akun Admin utama (<strong>admin@nkgts.com</strong>) dan akun Anda yang sedang aktif dilindungi secara otomatis dan tidak akan ikut terhapus.
              </div>
            )}
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="rounded-xl border border-neutral-200 text-neutral-600 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={bulkLoading || !selectedIds || selectedIds.length === 0}
                onClick={handleExecuteBulkDelete}
                className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {bulkLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  selectedIds.length > 1 ? `Ya, Hapus ${selectedIds.length} Data` : "Ya, Hapus Data"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI KIRIM RESET MASSAL ================= */}
      {isBulkResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-neutral-900">
                  Kirim Link Reset ke {selectedIds.length} Pengguna?
                </h3>
                <p className="text-xs text-neutral-400">Instruksi atur ulang kata sandi via email resmi</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Sistem akan mengirimkan email instruksi atur ulang kata sandi ke <strong>{selectedIds.length}</strong> akun pengguna terpilih. Tautan pada email ini berlaku selama <strong>24 jam</strong>.
            </p>
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => setIsBulkResetModalOpen(false)}
                className="rounded-xl border border-neutral-200 text-neutral-600 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={bulkLoading || !selectedIds || selectedIds.length === 0}
                onClick={handleExecuteBulkSendReset}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {bulkLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim Email...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Ya, Kirim Semua
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI BATALKAN RESET MASSAL ================= */}
      {isBulkCancelResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <X size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-neutral-900">
                  Batalkan {selectedIds.length} Tautan Reset?
                </h3>
                <p className="text-xs text-neutral-400">Nonaktifkan token atur ulang sandi aktif</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan <strong>{selectedIds.length}</strong> tautan reset kata sandi yang dipilih? Tautan yang sebelumnya dikirim via email tidak akan dapat digunakan lagi.
            </p>
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => setIsBulkCancelResetModalOpen(false)}
                className="rounded-xl border border-neutral-200 text-neutral-600 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={bulkLoading || !selectedIds || selectedIds.length === 0}
                onClick={handleExecuteBulkCancelResets}
                className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-sm font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {bulkLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Membatalkan...
                  </>
                ) : (
                  "Ya, Batalkan Semua"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
