"use client";

import { ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface MateriItem {
  id: number;
  topik: string;
  judul: string;
  progress: number;
  durasi: string;
  tag: string;
  tagColor: string;
}

interface MateriCardProps {
  item: MateriItem;
  index: number;
}

export function MateriCard({ item }: MateriCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-5 hover:border-neutral-200 transition-colors duration-200 cursor-pointer group flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3.5">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${item.tagColor}`}>
            {item.tag}
          </span>
          <ChevronRight
            size={16}
            className="text-neutral-300 group-hover:text-primary transition-colors duration-200"
          />
        </div>
        <p className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider mb-1">{item.topik}</p>
        <h4 className="text-neutral-900 font-bold text-sm leading-snug mb-5 group-hover:text-primary transition-colors duration-200">
          {item.judul}
        </h4>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-neutral-400 font-semibold">
          <span>{item.progress}% selesai</span>
          <span>{item.durasi}</span>
        </div>
        <ProgressBar
          value={item.progress}
          color={item.progress === 100 ? "bg-success" : "bg-primary"}
        />
      </div>
    </div>
  );
}
