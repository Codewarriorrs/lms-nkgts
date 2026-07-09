"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    name: "Loading...",
    school: "Loading...",
    avatar: "...",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setIsVerifying(false);
  }, [router]);

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((prev) => !prev);
    } else {
      setSidebarOpen(true);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-neutral-50 flex overflow-hidden font-sans">
        {/* Sidebar Skeleton */}
        <aside className="hidden lg:block w-64 bg-white border-r border-neutral-100 flex-shrink-0 animate-pulse">
          <div className="p-6 border-b border-neutral-100 h-20 flex items-center justify-between">
            <div className="h-8 w-24 bg-neutral-200 rounded" />
          </div>
          <div className="p-4 space-y-4">
            <div className="h-10 bg-neutral-100 rounded" />
            <div className="h-10 bg-neutral-100 rounded" />
            <div className="h-10 bg-neutral-100 rounded" />
            <div className="h-10 bg-neutral-100 rounded" />
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Topbar Skeleton */}
          <header className="h-16 border-b border-neutral-100 bg-white px-6 flex items-center justify-between animate-pulse flex-shrink-0">
            <div className="h-6 w-32 bg-neutral-200 rounded" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200" />
              <div className="space-y-1">
                <div className="h-3 w-20 bg-neutral-200 rounded" />
                <div className="h-2.5 w-16 bg-neutral-200 rounded" />
              </div>
            </div>
          </header>

          {/* Page Content Skeleton */}
          <main className="flex-1 p-6 bg-neutral-50/50 space-y-6 overflow-y-auto animate-pulse">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-neutral-200 rounded" />
              <div className="h-4 w-64 bg-neutral-200 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-white border border-neutral-100 rounded-2xl" />
              <div className="h-32 bg-white border border-neutral-100 rounded-2xl" />
              <div className="h-32 bg-white border border-neutral-100 rounded-2xl" />
            </div>
            <div className="h-64 bg-white border border-neutral-100 rounded-2xl" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex overflow-hidden font-sans">
      {/* Sidebar Component */}
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar Component */}
        <Topbar onMenuClick={handleMenuClick} collapsed={sidebarCollapsed} user={currentUser} />

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto bg-neutral-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}
