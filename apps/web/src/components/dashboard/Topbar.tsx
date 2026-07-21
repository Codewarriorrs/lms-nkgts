"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronsLeft, ChevronsRight, BookOpen, ClipboardList, FolderCheck, User, Settings, ArrowRight, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface TopbarProps {
  onMenuClick: () => void;
  collapsed?: boolean;
  user: {
    name: string;
    school: string;
    avatar: string;
  };
}

interface SearchItem {
  id: string;
  title: string;
  category: "Materi" | "Tugas Praktik" | "Project Kaizen" | "Profil" | "Admin";
  url: string;
  description: string;
}

const SEARCH_DATABASE: SearchItem[] = [
  { id: "1", title: "Pengenalan Budaya Kaizen", category: "Materi", url: "/dashboard/materi/pengenalan-kaizen", description: "Modul 1 - Fondasi, sejarah, & konsep Kaizen" },
  { id: "2", title: "Budaya Kerja 5R", category: "Materi", url: "/dashboard/materi/5r", description: "Modul 2 - Ringkas, Rapi, Resik, Rawat, Rajin" },
  { id: "3", title: "6 Potensi Bahaya K3", category: "Materi", url: "/dashboard/materi/6-potensi-bahaya", description: "Modul 3 - Identifikasi keselamatan & kesehatan kerja" },
  { id: "4", title: "7 Pemborosan (Seven Wastes)", category: "Materi", url: "/dashboard/materi/7-pemborosan", description: "Modul 4 - Mengeliminasi pemborosan di industri/sekolah" },
  { id: "5", title: "8 Langkah Penyelesaian Masalah", category: "Materi", url: "/dashboard/materi/8-langkah-penyelesaian-masalah", description: "Modul 5 - Metode PDCA & Problem Solving Kaizen" },
  { id: "6", title: "Tugas Praktikum Observasi (Submenu 1 - STOP 6)", category: "Tugas Praktik", url: "/dashboard/tugas", description: "Lembar observasi & pengumpulan tugas praktikum harian" },
  { id: "7", title: "Pengumpulan Proposal Proyek Kaizen", category: "Project Kaizen", url: "/dashboard/project/proposal", description: "Form & berkas pengumpulan proposal proyek kelompok" },
  { id: "8", title: "Pengumpulan Laporan Akhir Proyek Kaizen", category: "Project Kaizen", url: "/dashboard/project/laporan", description: "Form & berkas pengumpulan laporan akhir proyek" },
  { id: "9", title: "Profil Saya & Edit Pengaturan Akun", category: "Profil", url: "/dashboard/profile", description: "Kelola foto profil, password, & data akun" },
  { id: "10", title: "Manajemen User & Sekolah (Admin)", category: "Admin", url: "/dashboard/admin/users", description: "Kelola akun siswa, guru, & token pendaftaran" },
];

export function Topbar({ onMenuClick, collapsed = false, user }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    if (pathname === "/") {
      router.push("/dashboard");
    } else if (pathname.startsWith("/dashboard")) {
      router.push("/dashboard/profile");
    }
  };

  const filteredResults = searchQuery.trim() === "" 
    ? [] 
    : SEARCH_DATABASE.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelectResult = (url: string) => {
    setIsOpen(false);
    setSearchQuery("");
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredResults.length > 0) {
      handleSelectResult(filteredResults[0].url);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Materi": return <BookOpen size={14} className="text-primary" />;
      case "Tugas Praktik": return <ClipboardList size={14} className="text-success" />;
      case "Project Kaizen": return <FolderCheck size={14} className="text-accent-dark" />;
      case "Profil": return <User size={14} className="text-purple-600" />;
      case "Admin": return <Settings size={14} className="text-danger" />;
      default: return <Search size={14} className="text-neutral-400" />;
    }
  };

  return (
    <header className="bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4 flex-1">
        {/* Toggle Menu Button for Mobile & Desktop */}
        <button
          className="p-2 rounded-xl hover:bg-neutral-50 text-neutral-700 hover:text-primary transition-all duration-200"
          onClick={onMenuClick}
        >
          {collapsed ? <ChevronsRight size={22} className="text-primary" /> : <ChevronsLeft size={22} />}
        </button>

        {/* Functional Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-md relative hidden sm:block">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Cari materi, tugas, project, profil..."
              className="w-full pl-10 pr-9 py-2 bg-neutral-50 border border-neutral-100/80 rounded-xl text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Search Results Dropdown */}
          {isOpen && searchQuery.trim() !== "" && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-neutral-100 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-neutral-50 bg-neutral-50/50 flex items-center justify-between text-[11px] font-bold text-neutral-400">
                <span>HASIL PENCARIAN ({filteredResults.length})</span>
                <span>Tekan Enter untuk pilih</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50">
                {filteredResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-400 italic">
                    Tidak ada materi atau menu yang cocok dengan "{searchQuery}"
                  </div>
                ) : (
                  filteredResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectResult(item.url)}
                      className="p-3 hover:bg-neutral-50/80 cursor-pointer transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-neutral-100">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 text-xs truncate">{item.title}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 uppercase shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-neutral-400 group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* User Profile Info */}
        <div 
          onClick={handleProfileClick}
          className="flex items-center gap-3 pl-3 border-l border-neutral-100 cursor-pointer select-none hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-neutral-900 font-extrabold text-sm shadow-sm flex-shrink-0 hover:scale-105 transition-transform duration-200 select-none overflow-hidden">
            {user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/") || user.avatar.startsWith("data:image")) ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff&bold=true`;
                }}
              />
            ) : (
              user.avatar
            )}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-sm font-bold text-neutral-900">{user.name}</p>
            <p className="text-[11px] font-semibold text-neutral-400 mt-0.5">{user.school}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
