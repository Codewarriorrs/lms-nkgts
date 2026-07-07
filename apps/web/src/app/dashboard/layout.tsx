"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "Budi Santoso",
    school: "SMK Negeri 1 Semarang",
    avatar: "BS",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((prev) => !prev);
    } else {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex overflow-hidden font-sans">
      {/* Sidebar Component */}
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar Component */}
        <Topbar onMenuClick={handleMenuClick} user={currentUser} />

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto bg-neutral-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}
