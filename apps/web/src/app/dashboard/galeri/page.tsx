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
  Camera
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
      
      // 1. Kompresi gambar client-side
      const compressed = await compressImage(selectedFile);

      // 2. Upload file terkompresi ke Supabase Bucket lms-files
      const fotoUrl = await uploadFileOrBase64(compressed, "galeri");

      // 3. Simpan data postingan ke Database via API
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
        loadPosts(); // Reload feed
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

  // Helper untuk format tanggal indonesia
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Halaman */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Globe className="text-primary" size={24} /> Galeri Dokumentasi NKGTS
          </h1>
          <p className="text-neutral-500 text-xs font-semibold mt-1">
            Unggah dan bagikan dokumentasi proyek Kaizen serta keseruan aktivitas NKGTS sekolahmu!
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-light text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 transition cursor-pointer"
        >
          <Plus size={16} /> Unggah Foto
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-150 rounded-xl p-4 flex items-center gap-3 text-red-700 text-xs font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Feed Container */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center text-neutral-400 space-y-3">
          <ImageIcon size={48} className="mx-auto text-neutral-300" />
          <p className="font-bold text-sm">Belum ada dokumentasi</p>
          <p className="text-xs">Jadilah yang pertama untuk membagikan dokumentasi NKGTS Anda!</p>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Mulai Unggah
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => {
            // Cek hak hapus
            const isOwner = post.user_id === currentUser?.id;
            const isAdmin = currentUser?.role === "admin";
            const isGuruSameSchool = 
              currentUser?.role === "guru" && 
              currentUser?.sekolah_id !== null && 
              currentUser?.sekolah_id === post.sekolah_id;

            const canDelete = isOwner || isAdmin || isGuruSameSchool;

            const avatarUrl = post.uploader?.foto_profil || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";

            return (
              <div key={post.id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col">
                
                {/* Uploader Info */}
                <div className="p-4 flex items-center justify-between gap-3 border-b border-neutral-50">
                  <div className="flex items-center gap-3">
                    <img 
                      src={avatarUrl} 
                      alt={post.uploader?.nama} 
                      className="w-9 h-9 rounded-full object-cover border border-neutral-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-neutral-800 text-xs leading-tight">{post.uploader?.nama}</h4>
                      <p className="text-[10px] text-neutral-400 font-bold capitalize flex items-center gap-1 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                          post.uploader?.role === "admin" ? "bg-purple-100 text-purple-700" :
                          post.uploader?.role === "guru" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {post.uploader?.role}
                        </span>
                        {post.sekolah_nama && (
                          <span className="flex items-center gap-0.5 text-neutral-500 text-[9px] font-semibold truncate max-w-[150px]">
                            • <MapPin size={9} /> {post.sekolah_nama}
                          </span>
                        )}
                      </p>
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

                {/* Post Image */}
                <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden border-b border-neutral-50">
                  <img
                    src={post.foto_url}
                    alt={post.judul}
                    className="w-full h-full object-cover hover:scale-[1.02] transition duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-neutral-900 text-sm leading-snug">{post.judul}</h3>
                    {post.deskripsi && (
                      <p className="text-neutral-600 text-xs leading-relaxed break-words">{post.deskripsi}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold pt-2 border-t border-neutral-50">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(post.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-100">
            <div className="flex items-center justify-between border-b border-neutral-150 pb-4">
              <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-1.5">
                <Camera className="text-primary" size={18} /> Unggah Dokumentasi
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
                <label className="block font-bold text-neutral-700">Foto Dokumentasi *</label>
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
                    <p className="text-[10px] text-neutral-400">Hanya file JPG, JPEG, PNG</p>
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
                  placeholder="Contoh: Diskusi Kelompok 5R di Bengkel 1"
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
