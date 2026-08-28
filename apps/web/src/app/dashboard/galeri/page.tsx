"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Globe, 
  Upload, 
  Trash2, 
  MessageSquare, 
  Heart, 
  Plus, 
  X, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  Camera,
  Bookmark,
  Send,
  Download,
  BookOpen,
  School,
  ChevronDown
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { uploadFileOrBase64 } from "@/utils/upload";
import { compressImage } from "@/utils/image";

interface Post {
  id: string;
  user_id: string;
  judul: string;
  deskripsi: string | null;
  foto_url: string;
  sekolah_id: number | null;
  sekolah_nama: string | null;
  created_at: string;
  uploader: {
    id: string;
    nama: string;
    email: string;
    role: string;
    foto_profil: string | null;
  };
  likes: { user_id: string }[];
}

export default function GaleriPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // Admin tab state ('public' | 'pending')
  const [activeTab, setActiveTab] = useState<"public" | "pending">("public");

  // User quota state
  const [quotaInfo, setQuotaInfo] = useState<{ uploadedCount: number; maxQuota: number; isQuotaExceeded: boolean } | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive local likes state
  const [likesState, setLikesState] = useState<Record<string, { liked: boolean; count: number }>>({});

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }), [token]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const loadQuota = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/galeri/quota`, { headers });
      if (res.ok) {
        setQuotaInfo(await res.json());
      }
    } catch (err) {
      console.error("Gagal memuat status kuota galeri:", err);
    }
  };

  const loadPosts = async (currentPage: number = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/galeri?page=${currentPage}&limit=6`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
        setTotalPosts(data.total || 0);
        setPage(data.page || 1);
      } else {
        setError("Gagal memuat galeri.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memuat data galeri.");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPosts = async () => {
    if (!token || currentUser?.role !== "admin") return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/galeri/pending`, { headers });
      if (res.ok) {
        setPendingPosts(await res.json());
      }
    } catch (err) {
      console.error("Gagal memuat postingan pending:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "public") {
      loadPosts(page);
    } else {
      loadPendingPosts();
    }
    loadQuota();
  }, [token, page, activeTab]);

  const handleApproveReject = async (postId: string, status: "APPROVED" | "REJECTED") => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/galeri/${postId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
        alert(`Postingan telah ${status === "APPROVED" ? "disetujui (ACC)" : "ditolak"}.`);
      } else {
        alert("Gagal memperbarui status postingan.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memoderasi postingan.");
    }
  };

  // Load likes state from DB when posts or currentUser changes
  useEffect(() => {
    if (posts.length === 0 || !currentUser) return;
    
    const initialLikes: Record<string, { liked: boolean; count: number }> = {};
    posts.forEach(post => {
      const liked = post.likes ? post.likes.some(l => l.user_id === currentUser.id) : false;
      const count = post.likes ? post.likes.length : 0;
      initialLikes[post.id] = { liked, count };
    });
    
    setLikesState(initialLikes);
  }, [posts, currentUser]);
 
  const toggleLike = async (postId: string) => {
    if (!token) return;
    
    const currentState = likesState[postId] || { liked: false, count: 0 };
    const updated = {
      liked: !currentState.liked,
      count: currentState.liked ? currentState.count - 1 : currentState.count + 1
    };
    
    // Optimistic UI update
    setLikesState(prev => ({ ...prev, [postId]: updated }));
    
    try {
      const res = await fetch(`${API_URL}/galeri/${postId}/like`, {
        method: "POST",
        headers
      });
      if (!res.ok) {
        // Rollback
        setLikesState(prev => ({ ...prev, [postId]: currentState }));
      }
    } catch (err) {
      console.error(err);
      // Rollback
      setLikesState(prev => ({ ...prev, [postId]: currentState }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Harap pilih file gambar.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setJudul("");
    setDeskripsi("");
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !judul.trim() || !token) {
      alert("Judul dan Foto wajib diisi!");
      return;
    }

    try {
      setSubmitting(true);
      const compressed = await compressImage(selectedFile);
      const fotoUrl = await uploadFileOrBase64(compressed, "galeri");

      const res = await fetch(`${API_URL}/galeri`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          judul,
          deskripsi: deskripsi.trim() || null,
          foto_url: fotoUrl
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadPosts();
      } else {
        alert("Gagal memposting ke galeri.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus postingan dokumentasi ini?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/galeri/${postId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal menghapus postingan.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus postingan.");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Galeri & Tombol Aksi Mobile */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 leading-tight">Galeri Budaya Kaizen</h1>
          <p className="text-neutral-400 text-xs font-semibold mt-1">
            Dokumentasi dan inspirasi implementasi Kaizen antar sekolah duta.
          </p>
        </div>

        {/* Tombol Bagikan Sekarang Mobile (Tampil di layar < lg) */}
        <button
          onClick={handleOpenModal}
          className="lg:hidden shrink-0 inline-flex items-center gap-1.5 bg-[#1B3C73] hover:bg-[#152e5a] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md shadow-[#1B3C73]/20 transition cursor-pointer"
        >
          <Upload size={14} />
          <span>Bagikan Sekarang</span>
        </button>
      </div>

      {/* Layout Grid: Feed di kiri, Sidebar Info di kanan (hanya desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI (Feed) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Kartu Panduan Proyek Kaizen Khusus Layar Mobile (< lg) */}
          <div className="block lg:hidden bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-neutral-900 cursor-pointer"
            >
              <span className="flex items-center gap-2 text-neutral-900 font-extrabold">
                <BookOpen className="text-[#1B3C73] shrink-0" size={16} />
                Panduan Proyek Kaizen
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#1B3C73]">
                {isGuideOpen ? "Tutup" : "Lihat Panduan"}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isGuideOpen ? "rotate-180" : ""}`} />
              </span>
            </button>

            {isGuideOpen && (
              <div className="mt-3 pt-3 border-t border-neutral-100 text-[11px] text-neutral-600 space-y-2.5 animate-in fade-in duration-150">
                <p className="font-medium text-neutral-600 leading-relaxed">
                  Gunakan galeri ini untuk saling menginspirasi antar sekolah duta Budaya Kaizen! Anda dapat membagikan:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-neutral-500 font-medium leading-relaxed">
                  <li>Sebelum & Sesudah (Before-After) implementasi 5R/5S di kelas atau bengkel.</li>
                  <li>Momen diskusi kelompok atau Genba Walk bersama guru & siswa.</li>
                  <li>Sosialisasi dan ide kreatif perbaikan berkelanjutan di lingkungan sekolah/rumah.</li>
                </ul>
                <button
                  onClick={handleOpenModal}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 bg-[#1B3C73] hover:bg-[#152e5a] text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Upload size={13} /> Bagikan Sekarang
                </button>
              </div>
            )}
          </div>
          
          {/* Admin Moderation Tabs */}
          {currentUser?.role === "admin" && (
            <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200 text-xs font-bold">
              <button
                onClick={() => setActiveTab("public")}
                className={`flex-1 py-2 px-3 rounded-lg transition ${
                  activeTab === "public" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Postingan Publik
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeTab === "pending" ? "bg-white text-primary shadow-xs" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Antrean Moderasi (ACC)
                {pendingPosts.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {pendingPosts.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Student Quota Banner */}
          {currentUser?.role === "siswa" && quotaInfo?.isQuotaExceeded && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3 text-amber-800 text-xs font-semibold">
              <AlertCircle size={18} className="shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">Kuota Unggahan Terpakai (1/1 Foto)</p>
                <p className="text-[11px] text-amber-700 font-normal">
                  Siswa hanya diperbolehkan mengunggah 1 kali foto ke Galeri N-KGTS. Hapus foto lama Anda jika ingin mengganti.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-150 rounded-xl p-4 flex items-center gap-3 text-red-700 text-xs font-semibold">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Render Active Tab: Pending Posts vs Public Posts */}
          {activeTab === "pending" && currentUser?.role === "admin" ? (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-neutral-800">Menunggu Persetujuan Admin (ACC):</h3>
              {loading ? (
                <div className="flex h-[30vh] items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : pendingPosts.length === 0 ? (
                <div className="py-8 text-center text-neutral-400">
                  <p className="font-bold text-xs">Tidak ada antrean foto baru.</p>
                  <p className="text-[11px]">Semua postingan galeri sudah ditinjau.</p>
                </div>
              ) : (
                pendingPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-xs">{post.uploader?.nama}</span>
                        <span className="text-[10px] text-neutral-400">({post.uploader?.sekolah?.nama_sekolah || "N-KGTS"})</span>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded">PENDING</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <img src={post.foto_url} alt={post.judul} className="w-24 h-24 object-cover rounded-xl border border-neutral-200 shrink-0" />
                      <div className="space-y-1 text-xs flex-1">
                        <p className="font-extrabold text-neutral-900">{post.judul}</p>
                        {post.deskripsi && <p className="text-neutral-600 text-[11px]">{post.deskripsi}</p>}
                        <p className="text-[10px] text-neutral-400 pt-1">{formatDate(post.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => handleApproveReject(post.id, "REJECTED")}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
                      >
                        Tolak (Reject)
                      </button>
                      <button
                        onClick={() => handleApproveReject(post.id, "APPROVED")}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        Setujui (ACC Publik)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Public Feed Container */
            loading ? (
              <div className="flex h-[35vh] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-400 space-y-3">
                <ImageIcon size={48} className="mx-auto text-neutral-300" />
                <p className="font-bold text-sm">Belum ada dokumentasi publik</p>
                <p className="text-xs">Jadilah yang pertama untuk membagikan dokumentasi proyek Kaizen sekolah Anda!</p>
                <button
                  onClick={handleOpenModal}
                  disabled={currentUser?.role === "siswa" && quotaInfo?.isQuotaExceeded}
                  className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  Mulai Unggah
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-w-[550px] mx-auto">
                {posts.map((post) => {
                  const isOwner = post.user_id === currentUser?.id;
                  const isAdmin = currentUser?.role === "admin";
                  const isGuruSameSchool = 
                    currentUser?.role === "guru" && 
                    currentUser?.sekolah_id !== null && 
                    currentUser?.sekolah_id === post.sekolah_id;

                  const canDelete = isOwner || isAdmin || isGuruSameSchool;
                  const avatarUrl = post.uploader?.foto_profil || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.uploader?.nama || "User")}`;

                  const isLiked = likesState[post.id]?.liked || false;
                  const likeCount = likesState[post.id]?.count || 0;

                  return (
                    <div key={post.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                      
                      {/* Header Post */}
                      <div className="p-3.5 flex items-center justify-between border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                          <img 
                            src={avatarUrl} 
                            alt={post.uploader?.nama} 
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200 p-[1.5px] bg-gradient-to-tr from-[#FABF24] to-[#0f3d59]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.uploader?.nama || "User")}`;
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-neutral-800 text-xs leading-none">{post.uploader?.nama}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-black leading-none ${
                                post.uploader?.role === "admin" ? "bg-purple-100 text-purple-700" :
                                post.uploader?.role === "guru" ? "bg-blue-100 text-blue-700" :
                                "bg-green-100 text-green-700"
                              }`}>
                                {post.uploader?.role}
                              </span>
                            </div>
                            {post.sekolah_nama && (
                              <span className="flex items-center gap-0.5 text-neutral-450 text-[10px] font-bold mt-1">
                                <MapPin size={9} className="text-primary" /> {post.sekolah_nama}
                              </span>
                            )}
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-neutral-400 transition"
                            title="Hapus dokumentasi"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      {/* Foto Post */}
                      <div className="relative aspect-[4/3] bg-neutral-50 overflow-hidden select-none" onDoubleClick={() => toggleLike(post.id)}>
                        <img
                          src={post.foto_url}
                          alt={post.judul}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Action Bar */}
                      <div className="p-3.5 space-y-2 border-t border-neutral-50">
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => toggleLike(post.id)}
                            className="transition transform active:scale-125 cursor-pointer text-neutral-700 hover:text-red-500 flex items-center gap-1.5"
                          >
                            <Heart size={20} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                            <span className="text-xs font-bold text-neutral-750">{likeCount} Suka</span>
                          </button>
                        </div>

                        {/* Title & Caption */}
                        <div className="space-y-1 text-xs">
                          <p className="leading-relaxed">
                            <span className="font-extrabold text-neutral-800 mr-2">{post.uploader?.nama}</span>
                            <span className="font-bold text-neutral-850">{post.judul}</span>
                          </p>
                          {post.deskripsi && (
                            <p className="text-neutral-600 leading-relaxed pl-0">{post.deskripsi}</p>
                          )}
                        </div>

                        {/* Date */}
                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                          {formatDate(post.created_at)}
                        </p>
                      </div>

                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-3 text-xs font-bold">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40"
                    >
                      &laquo; Sebelumnya
                    </button>
                    <span className="text-neutral-500 font-semibold">
                      Halaman <span className="text-neutral-900">{page}</span> dari {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40"
                    >
                      Selanjutnya &raquo;
                    </button>
                  </div>
                )}
              </div>
            )
          )}

        </div>

        {/* KOLOM KANAN (Sidebar Sugesti / Sekolah info - Desktop Only) */}
        <div className="hidden lg:block space-y-6">
          {/* Info User Aktif */}
          {currentUser && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-3.5">
              <img 
                src={currentUser?.foto_profil || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.nama || currentUser?.name || "User")}`} 
                alt={currentUser?.nama || currentUser?.name} 
                className="w-12 h-12 rounded-full object-cover border border-neutral-200 p-[1px] bg-gradient-to-tr from-amber-400 to-pink-500"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-neutral-900 text-xs truncate leading-snug">{currentUser?.nama || currentUser?.name || "Nama Pengguna"}</h4>
                <p className="text-[10px] text-neutral-450 font-bold truncate">{currentUser?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded text-[7px] uppercase font-black tracking-wider leading-none">
                    {currentUser?.role}
                  </span>
                  {currentUser?.sekolah?.nama_sekolah && (
                    <span className="text-[9px] text-neutral-500 font-bold flex items-center gap-0.5">
                      <School size={9} /> {currentUser.sekolah.nama_sekolah}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rekomendasi/Info Proyek Kaizen */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-neutral-900 text-xs tracking-tight flex items-center gap-1.5">
                <BookOpen className="text-primary" size={14} /> Panduan Proyek Kaizen
              </h3>
            </div>
            <div className="text-[11px] text-neutral-500 leading-relaxed space-y-3 font-semibold">
              <p>
                Gunakan galeri ini untuk saling menginspirasi antar sekolah! Anda dapat membagikan:
              </p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>Sebelum & Sesudah (Before-After) implementasi 5R/5S.</li>
                <li>Momen diskusi kelompok atau Genba Walk.</li>
                <li>Sosialisasi dan ide kreatif perbaikan berkelanjutan.</li>
              </ul>



              <button
                onClick={handleOpenModal}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-light text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-primary/10 transition cursor-pointer"
              >
                <Upload size={13} /> Bagikan Sekarang
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Upload (Instagram Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-1.5">
                <Camera className="text-primary" size={18} /> Unggah Aktivitas
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-neutral-50 rounded-lg text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Image Input */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700">Foto Aktivitas *</label>
                {imagePreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-200 hover:border-primary rounded-xl p-8 text-center cursor-pointer transition bg-neutral-50/50 hover:bg-primary/5 space-y-2"
                  >
                    <Upload className="mx-auto text-neutral-400" size={24} />
                    <p className="font-bold text-neutral-600">Klik untuk memilih gambar</p>
                    <p className="text-[10px] text-neutral-400">File JPG, JPEG, PNG</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Judul */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700">Judul Aktivitas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Implementasi Seiri di Area Lab"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:border-primary text-neutral-800"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-700">Keterangan / Caption (Opsional)</label>
                <textarea
                  placeholder="Tulis penjelasan singkat tentang aktivitas ini..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:border-primary text-neutral-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !judul.trim() || !selectedFile}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg font-bold shadow-md shadow-primary/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="animate-spin" size={13} />}
                  {submitting ? "Memposting..." : "Posting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) khusus Layar Mobile */}
      <div className="lg:hidden fixed bottom-6 right-5 z-40">
        <button
          onClick={handleOpenModal}
          aria-label="Bagikan Sekarang"
          title="Bagikan Sekarang"
          className="w-12 h-12 rounded-full bg-[#1B3C73] hover:bg-[#152e5a] text-white shadow-xl shadow-[#1B3C73]/30 flex items-center justify-center transition active:scale-95 cursor-pointer border-2 border-white"
        >
          <Camera size={20} />
        </button>
      </div>

    </div>
  );
}
