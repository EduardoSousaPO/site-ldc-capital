"use client";

import { Toaster } from "sonner";

export function AdminToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        className: "font-sans bg-white/95 backdrop-blur border border-[#344645]/10",
        style: {
          boxShadow: "0 20px 25px -5px rgba(38,45,61,0.1), 0 10px 10px -5px rgba(52,70,69,0.1)",
        },
      }}
    />
  );
}
