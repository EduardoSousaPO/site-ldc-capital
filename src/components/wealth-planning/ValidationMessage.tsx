"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationMessageProps {
  message: string;
  className?: string;
}

export function ValidationMessage({ message, className }: ValidationMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-red-600 font-sans mt-1",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
