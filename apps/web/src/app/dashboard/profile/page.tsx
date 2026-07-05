"use client";

import { useState, useEffect } from "react";
import { User, School, Mail, Shield } from "lucide-react";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState({
    name: "Budi Santoso",
    school: "SMK Negeri 1 Semarang",
    avatar: "BS",
    email: "budi@nkgts.sch.id",
    role: "siswa",
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

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          Profil Saya
        </h1>
        <p className="text-neutral-400 text-xs font-semibold mt-1">
          Kelola informasi profil dan kredensial akun LMS Anda.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-6 max-w-2xl space-y-6">
        {/* Avatar Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-neutral-900 font-extrabold text-xl shadow-inner select-none">
            {currentUser.avatar}
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{currentUser.name}</h3>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-neutral-100">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider flex items-center gap-1.5 text-neutral-400">
              <User size={12} /> Nama Lengkap
            </span>
            <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
              {currentUser.name}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider flex items-center gap-1.5 text-neutral-400">
              <School size={12} /> Asal Sekolah
            </span>
            <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
              {currentUser.school}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider flex items-center gap-1.5 text-neutral-400">
              <Mail size={12} /> Alamat Email
            </span>
            <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50">
              {currentUser.email}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider flex items-center gap-1.5 text-neutral-400">
              <Shield size={12} /> Peran Akun
            </span>
            <p className="text-sm font-semibold text-neutral-800 bg-neutral-50 px-4 py-2.5 rounded-lg border border-neutral-100/50 capitalize">
              {currentUser.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
