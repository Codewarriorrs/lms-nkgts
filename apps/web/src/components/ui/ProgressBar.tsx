"use client";

import { useState, useEffect } from "react";

interface ProgressBarProps {
  value: number;
  color?: string;
}

export function ProgressBar({ value, color = "bg-primary" }: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
