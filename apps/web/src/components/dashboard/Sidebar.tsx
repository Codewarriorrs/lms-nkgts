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
  Settings
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Materi", icon: BookOpen, href: "/dashboard/materi" },
  { label: "Soal Latihan", icon: ClipboardList, href: "/dashboard/soal" },
  { label: "Tugas Praktek", icon: Briefcase, href: "/dashboard/tugas" },
  { label: "Project Kaizen", icon: FolderKanban, href: "/dashboard/project" },
];

export function Sidebar({ open, onClose }: SidebarProps) {
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
  const items = [...navItems];
  if (currentUser?.role === "admin") {
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
          fixed top-0 left-0 h-full w-64 bg-primary z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:h-screen
        `}
      >
        {/* Logo and Brand */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/logo-nkgts.png" alt="Logo Kaizen" className="h-16 w-auto object-contain rounded p-0.5" />
            <div className="leading-none text-white">
              <span className="text-[15px] font-bold tracking-tight">N-KGTS</span>
              <span className="block text-accent text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                LMS Platform
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white transition-colors duration-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold
                  transition-all duration-200 group border-l-4
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer profile & logout */}
        <div className="px-4 py-4 border-t border-white/10 space-y-1">
          <Link
            href="/dashboard/profile"
            onClick={onClose}
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            <User size={18} className="text-white/60" />
            Profil Saya
          </Link>
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:bg-danger/20 hover:text-red-300 transition-all duration-200 text-left"
          >
            <LogOut size={18} className="text-white/60" />
            Keluar
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
