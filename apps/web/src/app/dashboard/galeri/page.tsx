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
  Sparkles,
  School
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
}

export default function GaleriPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive local likes state
  const [likesState, setLikesState] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [viewsState, setViewsState] = useState<Record<string, number>>({});

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

  const loadPosts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/galeri`, { headers });
      if (res.ok) {
        setPosts(await res.json());
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

  useEffect(() => {
    loadPosts();
  }, [token]);

  // Load and generate likes state
  useEffect(() => {
    if (posts.length === 0) return;
    
    const saved = localStorage.getItem("galeri_likes");
    const parsed = saved ? JSON.parse(saved) : {};
    
    const initialLikes: Record<string, { liked: boolean; count: number }> = {};
    const initialViews: Record<string, number> = {};
    
    posts.forEach(post => {
      const charSum = post.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      if (parsed[post.id]) {
        initialLikes[post.id] = parsed[post.id];
      } else {
        const count = (charSum % 38) + 4; // 4 to 41 likes
        initialLikes[post.id] = { liked: false, count };
      }
      
      // Deterministic views based on likes
      const likeCount = initialLikes[post.id].count;
      initialViews[post.id] = (likeCount * 4) + (charSum % 120) + 18;
    });
    
    setLikesState(initialLikes);
    setViewsState(initialViews);
  }, [posts]);

  const toggleLike = (postId: string) => {
    const currentState = likesState[postId] || { liked: false, count: 8 };
    const updated = {
      liked: !currentState.liked,
      count: currentState.liked ? currentState.count - 1 : currentState.count + 1
    };
    
    const newLikes = { ...likesState, [postId]: updated };
    setLikesState(newLikes);
    localStorage.setItem("galeri_likes", JSON.stringify(newLikes));
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
      {/* Layout Grid: Feed di kiri, Sidebar Info di kanan (hanya desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI (Feed) */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-150 rounded-xl p-4 flex items-center gap-3 text-red-700 text-xs font-semibold">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Post Feed Container */}
          {loading ? (
            <div className="flex h-[35vh] items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-400 space-y-3">
              <ImageIcon size={48} className="mx-auto text-neutral-300" />
              <p className="font-bold text-sm">Belum ada dokumentasi</p>
              <p className="text-xs">Jadilah yang pertama untuk membagikan dokumentasi proyek Kaizen sekolah Anda!</p>
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold px-4 py-2 rounded-xl transition"
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
                const avatarUrl = post.uploader?.foto_profil || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";

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
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";
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

                    {/* Action Bar (Instagram Style - NKGTS Minimalist) */}
                    <div className="p-3.5 space-y-2.5 border-t border-neutral-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <button 
                            onClick={() => toggleLike(post.id)}
                            className="transition transform active:scale-125 cursor-pointer text-neutral-700 hover:text-red-500 flex items-center gap-1.5"
                          >
                            <Heart size={20} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                            <span className="text-xs font-bold text-neutral-750">{likeCount} Suka</span>
                          </button>
                          
                          <span className="text-neutral-300">|</span>
                          
                          <div className="flex items-center gap-1.5 text-neutral-500">
                            <Globe size={18} className="text-primary-light" />
                            <span className="text-xs font-semibold">{viewsState[post.id] || 0} Dilihat</span>
                          </div>
                        </div>
                      </div>

                      {/* Title & Caption */}
                      <div className="space-y-1 text-xs">
                        <p className="leading-relaxed">
                          <span className="font-extrabold text-neutral-800 mr-2">{post.uploader?.nama}</span>
                          <span className="font-bold text-neutral-850 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-100">{post.judul}</span>
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
            </div>
          )}

        </div>

        {/* KOLOM KANAN (Sidebar Sugesti / Sekolah info - Desktop Only) */}
        <div className="hidden lg:block space-y-6">
          {/* Info User Aktif */}
          {currentUser && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-3.5">
              <img 
                src={currentUser?.foto_profil || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} 
                alt={currentUser?.nama} 
                className="w-12 h-12 rounded-full object-cover border border-neutral-200 p-[1px] bg-gradient-to-tr from-amber-400 to-pink-500"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-neutral-900 text-xs truncate leading-snug">{currentUser?.nama}</h4>
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
                <Sparkles className="text-amber-500" size={14} /> Panduan Proyek Kaizen
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

    </div>
  );
}
