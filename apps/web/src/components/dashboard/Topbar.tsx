"use client";

import { Menu, Search, Bell } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
  user: {
    name: string;
    school: string;
    avatar: string;
  };
}

export function Topbar({ onMenuClick, user }: TopbarProps) {
  return (
    <header className="bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        {/* Toggle Menu Button for Mobile */}
        <button
          className="lg:hidden p-2 rounded-xl hover:bg-neutral-50 text-neutral-700 hover:text-primary transition-all duration-200"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari materi, tugas, project..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-100/80 rounded-xl text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <button className="relative p-2.5 rounded-xl hover:bg-neutral-50 text-neutral-500 hover:text-primary transition-all duration-200 group">
          <Bell size={20} className="group-hover:scale-105 transition-transform duration-200" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white ring-1 ring-accent/35" />
        </button>

        {/* User Profile Info */}
        <div className="flex items-center gap-3 pl-3 border-l border-neutral-100">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-neutral-900 font-extrabold text-sm shadow-sm flex-shrink-0 hover:scale-105 transition-transform duration-200 select-none">
            {user.avatar}
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
