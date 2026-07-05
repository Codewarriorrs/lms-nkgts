"use client";

import { X, AlertCircle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Ya, Keluar",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  type = "danger",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const typeColorMap = {
    danger: {
      bg: "bg-danger/10",
      text: "text-danger",
      button: "bg-danger hover:bg-danger/90",
    },
    warning: {
      bg: "bg-warning/10",
      text: "text-warning",
      button: "bg-warning hover:bg-warning/90",
    },
    info: {
      bg: "bg-primary/10",
      text: "text-primary",
      button: "bg-primary hover:bg-primary/90",
    },
  };

  const currentType = typeColorMap[type] || typeColorMap.info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl border border-neutral-100 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 z-10 mx-4">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-12 h-12 rounded-full ${currentType.bg} flex items-center justify-center ${currentType.text}`}>
            <AlertCircle size={24} />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-neutral-900 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-colors ${currentType.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
