"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  label?: string;
  variant?: "primary" | "outline" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  iconType?: "chevron" | "arrow";
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  className?: string;
}

export function BackButton({
  href,
  label = "Kembali",
  variant = "primary",
  size = "md",
  iconType = "chevron",
  onClick,
  className,
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const IconComponent = iconType === "arrow" ? ArrowLeft : ChevronLeft;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    } else if (!href) {
      e.preventDefault();
      router.back();
    }
  };

  // Size styles
  const sizeClasses = {
    sm: "h-9 px-3.5 text-xs pl-10",
    md: "h-10 px-4 text-xs font-bold pl-11",
    lg: "h-11 px-5 text-sm font-bold pl-12",
  };

  const iconWidthClasses = {
    sm: "w-7 group-hover:w-[calc(100%-0.5rem)]",
    md: "w-8 group-hover:w-[calc(100%-0.5rem)]",
    lg: "w-9 group-hover:w-[calc(100%-0.5rem)]",
  };

  // Color variants matching blue & white palette
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/20 border border-primary/20",
    outline: "bg-white text-primary border border-primary/30 hover:bg-primary/5 hover:border-primary",
    secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200",
    ghost: "bg-transparent text-primary hover:bg-primary/10",
  };

  const iconBgClasses = {
    primary: "bg-white/20 text-white",
    outline: "bg-primary/15 text-primary",
    secondary: "bg-neutral-200/80 text-neutral-800",
    ghost: "bg-primary/15 text-primary",
  };

  const content = (
    <>
      <span className="transition-opacity duration-500 group-hover:opacity-0 whitespace-nowrap">
        {label}
      </span>
      <i
        className={cn(
          "absolute left-1 top-1 bottom-1 rounded-lg z-10 grid place-items-center transition-all duration-500 group-active:scale-95",
          iconWidthClasses[size],
          iconBgClasses[variant]
        )}
      >
        <IconComponent size={size === "sm" ? 14 : 16} strokeWidth={2.5} aria-hidden="true" />
      </i>
    </>
  );

  const baseClassName = cn(
    "group relative inline-flex items-center justify-center overflow-hidden rounded-xl transition-all duration-300 font-semibold cursor-pointer select-none",
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={baseClassName} onClick={handleClick} {...props}>
      {content}
    </button>
  );
}
