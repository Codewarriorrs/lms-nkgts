"use client";

import { useState, useEffect } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  total?: number | null;
  icon: LucideIcon;
  color: string;
  delay: number;
}

export function StatCard({
  label,
  value,
  total,
  icon: Icon,
  color,
  delay,
}: StatCardProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    // Keeping the original counting logic but making it robust
    const timer = setTimeout(() => {
      let start = 0;
      const step = Math.max(1, Math.ceil(value / 10));
      const interval = setInterval(() => {
        start += step;
        if (start >= value) {
          setDisplayed(value);
          clearInterval(interval);
        } else {
          setDisplayed(start);
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-5 flex items-center gap-4 hover:border-neutral-200 transition-colors duration-200">
      <div className="p-3 rounded-lg bg-neutral-50 flex-shrink-0">
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-neutral-900 font-bold text-2xl leading-none mt-1">
          {displayed}
          {total !== undefined && total !== null && (
            <span className="text-neutral-400 text-sm font-normal ml-1">/ {total}</span>
          )}
        </p>
      </div>
    </div>
  );
}
