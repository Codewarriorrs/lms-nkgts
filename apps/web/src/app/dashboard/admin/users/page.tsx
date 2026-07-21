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
  FileSpreadsheet
} from "lucide-react";

interface UserType {
  id: string;
  nama: string;
  email: string;
  role: string;
  nis: string | null;
  nama_sekolah: string;
  created_at: string;
}

interface InvitationType {
  id: number;
  nama: string;
  email: string;
  role: string;
  nis: string | null;
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
  const [activeTab, setActiveTab] = useState<"active" | "pending">("active");

  // State Data
  const [users, setUsers] = useState<UserType[]>([]);
  const [invitations, setInvitations] = useState<InvitationType[]>([]);
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
  const [editRoleValue, setEditRoleValue] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    nama: "",
    role: "siswa",
    sekolah_id: "",
    nis: ""
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
    fetchSchools();
  }, [isAdmin, page, search, roleFilter]);

  // 1. Fetch Active Users
  const fetchActiveUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/admin/users?page=${page}&limit=8&search=${encodeURIComponent(search)}&role=${roleFilter}`;
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
          nis: inviteForm.nis || undefined
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
        nis: ""
      });
      fetchPendingInvitations();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4b. Handle role update submit
  const handleUpdateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditUser || !editRoleValue) return;
    setUpdatingRole(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/${selectedEditUser.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: editRoleValue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah role pengguna");
      setSuccessMsg(`Role ${selectedEditUser.nama} berhasil diubah menjadi ${editRoleValue}`);
      setSelectedEditUser(null);
      fetchActiveUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingRole(false);
    }
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

  // 5. Handle Excel/CSV Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !importSekolahId) {
      setErrorMsg("Pilih file dan sekolah tujuan terlebih dahulu.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setImportSummary(null);

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("sekolah_id", importSekolahId);

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

  // Download CSV Template Helper
  const downloadTemplate = () => {
    const templateContent = "Email,Nama,Role,Nis\nsiswa.contoh@nkgts.sch.id,Budi Utomo,siswa,123456\nguru.contoh@nkgts.sch.id,Siti Aminah,guru,\n";
    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_user_nkgts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-neutral-100 bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 transition duration-200 cursor-pointer"
          >
            <Upload size={16} />
            Import CSV/Excel
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/20 transition duration-200 cursor-pointer"
          >
            <UserPlus size={16} />
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
          onClick={() => setActiveTab("pending")}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeTab === "pending"
              ? "bg-primary text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          <Mail size={16} />
          Undangan Tertunda ({invitations.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {activeTab === "active" ? (
          /* ================= TAMPILAN PENGGUNA AKTIF ================= */
          <div>
            {/* Filter & Search Bar */}
            <div className="p-5 border-b border-neutral-50 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Cari nama, email, atau NIS..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-primary transition duration-200"
                />
              </div>

              <div className="w-full md:w-auto flex gap-3 self-end md:self-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-neutral-100 rounded-xl text-sm bg-white text-neutral-700 focus:outline-none focus:border-primary transition duration-200 cursor-pointer"
                >
                  <option value="">Semua Role</option>
                  <option value="admin">Admin</option>
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 text-neutral-400 text-xs font-extrabold uppercase tracking-wider border-b border-neutral-50">
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">NIS</th>
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
                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {new Date(user.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                           <button
                             onClick={() => {
                               setSelectedEditUser(user);
                               setEditRoleValue(user.role);
                             }}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition cursor-pointer"
                           >
                             Ubah Role
                           </button>
                           {user.role === "siswa" && (
                             <button
                               onClick={() => {
                                 setResetTargetUser({ id: user.id, nama: user.nama });
                               }}
                               className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warning/20 hover:bg-warning/10 text-warning text-xs font-bold transition cursor-pointer"
                               title="Reset progres belajar siswa"
                             >
                               Reset
                             </button>
                           )}
                           {user.email !== "admin@nkgts.com" && user.id !== currentUser?.id && (
                             <button
                               onClick={() => handleDeleteUser(user.id, user.nama)}
                               className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-650 text-xs font-bold transition cursor-pointer"
                             >
                               Hapus
                             </button>
                           )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-5 border-t border-neutral-50 flex items-center justify-between text-sm text-neutral-400">
                <span>Halaman {page} dari {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => prev - 1)}
                    className="p-2 rounded-lg border border-neutral-100 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => prev + 1)}
                    className="p-2 rounded-lg border border-neutral-100 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
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
                    invitations.map((invite) => (
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
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleResendInvite(invite.id, invite.email)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                            title="Kirim ulang email undangan"
                          >
                            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                            Kirim Ulang
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(invite.id)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/10 hover:bg-danger/10 text-danger text-xs font-bold transition cursor-pointer disabled:opacity-50"
                            title="Batalkan dan hapus undangan"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Sekolah Tujuan *</label>
                <select
                  value={importSekolahId}
                  onChange={(e) => setImportSekolahId(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-100 rounded-xl text-sm bg-white focus:outline-none focus:border-primary transition cursor-pointer"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.nama_sekolah}</option>
                  ))}
                </select>
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

      {/* ================= MODAL UBAH ROLE PENGGUNA ================= */}
      {selectedEditUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-neutral-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                Ubah Peran (Role)
              </h2>
              <button 
                onClick={() => setSelectedEditUser(null)}
                className="text-neutral-400 hover:text-neutral-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateRoleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <p className="text-neutral-400 font-semibold mb-2">Mengubah peran untuk pengguna berikut:</p>
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl space-y-1">
                  <p className="font-bold text-neutral-900 text-sm">{selectedEditUser.nama}</p>
                  <p className="text-neutral-400 font-semibold">{selectedEditUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Peran Baru (Role) *</label>
                <select
                  value={editRoleValue}
                  onChange={(e) => setEditRoleValue(e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-100 rounded-xl text-xs bg-white font-bold text-neutral-700 focus:outline-none focus:border-primary transition cursor-pointer"
                >
                  <option value="siswa">Siswa (Siswa Peserta N-KGTS)</option>
                  <option value="guru">Guru (Guru Praktisi Kaizen)</option>
                  <option value="admin">Admin (Administrator TAM)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-neutral-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEditUser(null)}
                  className="px-4 py-2 border border-neutral-100 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition cursor-pointer disabled:opacity-50"
                >
                  {updatingRole ? "Menyimpan..." : "Simpan Perubahan"}
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
    </div>
  );
}
