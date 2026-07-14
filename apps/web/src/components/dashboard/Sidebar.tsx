"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Briefcase,
  FolderKanban,
  User,
  LogOut,
  X,
  Users,
  Settings,
  Globe
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface SidebarProps {
  open: boolean;
  collapsed?: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Materi", icon: BookOpen, href: "/dashboard/materi" },
  { label: "Soal Latihan", icon: ClipboardList, href: "/dashboard/soal" },
  { label: "Tugas Praktek", icon: Briefcase, href: "/dashboard/tugas" },
  { label: "Project Kaizen", icon: FolderKanban, href: "/dashboard/project" },
];

export function Sidebar({ open, collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user in sidebar", e);
      }
    }
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Conditionally build navigation items list based on user role
  let items = [...navItems];
  if (currentUser?.role === "guru") {
    items = [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Materi", icon: BookOpen, href: "/dashboard/materi" },
      { label: "Soal Latihan", icon: ClipboardList, href: "/dashboard/soal" },
      { label: "Tugas Praktikum", icon: Briefcase, href: "/dashboard/tugas" },
      { label: "Project Kaizen", icon: FolderKanban, href: "/dashboard/project" },
      { label: "Progres Siswa", icon: Users, href: "/dashboard/progres" },
    ];
  } else if (currentUser?.role === "admin") {
    items.push(
      { label: "Kelola Pengguna", icon: Users, href: "/dashboard/admin/users" },
      { label: "Pengaturan Kontak", icon: Settings, href: "/dashboard/admin/settings/email-contact" }
    );
  }

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full bg-primary z-50 flex flex-col
          transform transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:h-screen
          w-64 ${collapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        {/* Logo and Brand */}
        <div className={`px-6 py-5 flex items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "justify-between"}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <img src="/logo-nkgts.png" alt="Logo Kaizen" className="h-12 w-auto object-contain rounded p-0.5 flex-shrink-0 transition-all duration-500 hover:rotate-6 hover:scale-110 active:scale-95 cursor-pointer" />
            {!collapsed && (
              <div className="leading-none text-white transition-all duration-200 overflow-hidden truncate">
                <span className="text-[15px] font-bold tracking-tight">N-KGTS</span>
                <span className="block text-accent text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                  LMS Platform
                </span>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={onClose}
              className="lg:hidden text-white/60 hover:text-white transition-colors duration-200"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center rounded-xl text-sm font-semibold
                  transition-all duration-200 group border-l-4
                  ${collapsed ? "justify-center px-1 py-3 border-l-0" : "gap-3.5 px-4 py-3"}
                  ${
                    isActive
                      ? "bg-white/10 text-white border-accent"
                      : "text-white/60 hover:bg-white/5 hover:text-white border-transparent"
                  }
                `}
              >
                <item.icon
                  size={18}
                  className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-accent" : "text-white/60 group-hover:text-white"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer profile & logout */}
        <div className={`px-3 py-4 border-t border-white/10 space-y-1 ${collapsed ? "flex flex-col items-center" : ""}`}>
          <Link
            href="/"
            title={collapsed ? "Halaman Utama" : undefined}
            className={`flex items-center rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200 ${collapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3 w-full"}`}
          >
            <Globe size={18} className="text-white/60 flex-shrink-0" />
            {!collapsed && <span className="truncate">Halaman Utama</span>}
          </Link>
          <Link
            href="/dashboard/profile"
            onClick={onClose}
            title={collapsed ? "Profil Saya" : undefined}
            className={`flex items-center rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200 ${collapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3 w-full"}`}
          >
            <User size={18} className="text-white/60 flex-shrink-0" />
            {!collapsed && <span className="truncate">Profil Saya</span>}
          </Link>
          <button
            onClick={handleLogoutClick}
            title={collapsed ? "Keluar" : undefined}
            className={`flex items-center rounded-xl text-sm font-semibold text-white/60 hover:bg-danger/20 hover:text-red-300 transition-all duration-200 text-left ${collapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3 w-full"}`}
          >
            <LogOut size={18} className="text-white/60 flex-shrink-0" />
            {!collapsed && <span className="truncate">Keluar</span>}
          </button>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari platform LMS N-KGTS ini?"
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        type="danger"
      />
    </>
  );
}
