"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthChangePayload {
  event: string;
  session: Session | null;
}

export default function SupabaseListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "SIGNED_OUT") {
        const payload: AuthChangePayload = { event, session };

        await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Garantir que cookies sejam enviados
          body: JSON.stringify(payload),
        });

        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          router.refresh();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
