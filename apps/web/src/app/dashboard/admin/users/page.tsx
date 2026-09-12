"use client";

import { useState, useEffect } from "react";
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
  Lock
} from "lucide-react";

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

function formatTimeRemaining(dateStr: string) {
  const diffMs = new Date(dateStr).getTime() - new Date().getTime();
  if (diffMs <= 0) return "Kedaluwarsa";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `Sisa ${hours} jam ${minutes} mnt`;
  return `Sisa ${minutes} menit`;
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

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
        setSchools(data || []);
        if (data.length > 0) {
          setInviteForm(prev => ({ ...prev, sekolah_id: data[0].id.toString() }));
          setImportSekolahId(data[0].id.toString());
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

  // 5. Handle Excel/CSV Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setErrorMsg("Pilih file CSV / Excel terlebih dahulu.");
      return;
    }
    setLoading(true);
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
      const res = await fetch(`${API_URL}/admin/users/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memproses import file");

      setSuccessMsg(data.message);
      setImportSummary(data.data);
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchPendingInvitations();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

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
  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/download-template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal mengunduh template Excel");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "Template_Import_Pengguna_NKGTS.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Gagal mengunduh template Excel: " + err.message);
    }
  };

  // 8. Handle Export Excel Nilai Siswa
  const [exportSekolahId, setExportSekolahId] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

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
        {activeTab === "active" ? (
          /* ================= TAMPILAN PENGGUNA AKTIF ================= */
          <div>
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-neutral-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Cari nama, email, NIS..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-primary transition"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-700 focus:outline-none focus:border-primary transition cursor-pointer font-semibold"
              >
                <option value="">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="guru">Guru</option>
                <option value="siswa">Siswa</option>
              </select>

              <select
                value={exportSekolahId}
                onChange={(e) => setExportSekolahId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-700 focus:outline-none focus:border-primary transition cursor-pointer truncate font-semibold"
              >
                <option value="">Semua Sekolah</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id.toString()}>
                    {s.nama_sekolah}
                  </option>
                ))}
              </select>

              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white shadow-xs transition cursor-pointer"
                title="Tarik Rekapitulasi Nilai Siswa Ke Format Excel"
              >
                <FileSpreadsheet size={15} />
                {isExporting ? "Mengekspor..." : "Export Excel Nilai"}
              </button>
            </div>

            {/* Mobile Cards (< md) */}
            <div className="block md:hidden divide-y divide-neutral-100">
              {loading ? (
                <div className="p-8 text-center text-neutral-400 text-xs">Memuat data pengguna...</div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">Tidak ada pengguna aktif ditemukan.</div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-neutral-900 text-xs">{user.nama}</h4>
                        <p className="text-[11px] text-neutral-500 font-mono leading-tight">{user.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        user.role === "admin" ? "bg-purple-100 text-purple-700" : user.role === "guru" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-500 space-y-0.5">
                      <p>Sekolah: <strong className="text-neutral-700 font-semibold">{user.nama_sekolah || "N-KGTS"}</strong></p>
                      <p>NIS: <strong className="font-mono text-neutral-700">{user.nis || "-"}</strong></p>
                      <p>Kelas / Jurusan: <strong className="text-primary font-bold">{(user.kelas || user.jurusan) ? `Kelas ${user.kelas || "-"} • ${user.jurusan || "-"}` : "-"}</strong></p>
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
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">NIS / Kelas / Jurusan</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Sekolah</th>
                    <th className="px-6 py-4">Bergabung</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-sm text-neutral-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                        <div className="flex items-center justify-center gap-2.5">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
                           Memuat data pengguna...
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                        Tidak ada pengguna aktif ditemukan.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50/50 transition duration-150">
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
                              Kelas {user.kelas || "-"} • {user.jurusan || "-"}
                            </span>
                          ) : (
                            <div className="text-[11px] text-neutral-400 mt-0.5">-</div>
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
                        <td className="px-6 py-4">{user.nama_sekolah}</td>
                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {new Date(user.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap min-w-[280px]">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300/80 cursor-pointer shadow-2xs whitespace-nowrap"
                              title="Lihat detail & edit profil pengguna"
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
                                title="Reset progres belajar siswa"
                              >
                                <RotateCcw size={13} />
                                Reset Progres
                              </button>
                            )}
                            <button
                              onClick={() => setSendResetTargetUser(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs border border-blue-700/30 cursor-pointer whitespace-nowrap"
                              title="Kirim email petunjuk atur ulang kata sandi (berlaku 24 jam)"
                            >
                              <KeyRound size={13} />
                              Kirim Link Reset
                            </button>
                            {user.email !== "admin@nkgts.com" && user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.nama)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs border border-rose-700/30 cursor-pointer whitespace-nowrap"
                                title="Hapus akun pengguna"
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 text-xs font-extrabold uppercase tracking-wider border-b border-neutral-50">
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">NIS</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Sekolah</th>
                    <th className="px-6 py-4">Kedaluwarsa</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-sm text-neutral-700">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                        Tidak ada undangan tertunda yang aktif.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const totalPendingPages = Math.ceil(invitations.length / 10) || 1;
                      const currentPendingPage = Math.min(pendingPage, totalPendingPages);
                      const paginatedInvitations = invitations.slice((currentPendingPage - 1) * 10, currentPendingPage * 10);
                      return paginatedInvitations.map((invite) => (
                        <tr key={invite.id} className="hover:bg-neutral-50/50 transition duration-150">
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
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {renderPagination(
              Math.min(pendingPage, Math.ceil(invitations.length / 10) || 1),
              Math.ceil(invitations.length / 10) || 1,
              invitations.length,
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

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 text-xs font-extrabold uppercase tracking-wider border-b border-neutral-50">
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">NIS</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Sekolah</th>
                    <th className="px-6 py-4">Kedaluwarsa</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-sm text-neutral-700">
                  {loadingResets ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                        <div className="flex items-center justify-center gap-2.5">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
                          Memuat data token aktif...
                        </div>
                      </td>
                    </tr>
                  ) : activeResets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                        Tidak ada token reset password yang sedang aktif saat ini.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const totalResetsPages = Math.ceil(activeResets.length / 10) || 1;
                      const currentResetsPage = Math.min(resetsPage, totalResetsPages);
                      const paginatedResets = activeResets.slice((currentResetsPage - 1) * 10, currentResetsPage * 10);
                      return paginatedResets.map((user) => (
                        <tr key={user.id} className="hover:bg-neutral-50/50 transition duration-150">
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
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {renderPagination(
              Math.min(resetsPage, Math.ceil(activeResets.length / 10) || 1),
              Math.ceil(activeResets.length / 10) || 1,
              activeResets.length,
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
            
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
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
                  disabled={loading || !importFile}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/10 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Mengimpor..." : "Mulai Import"}
                </button>
              </div>
            </form>
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
    </div>
  );
}
