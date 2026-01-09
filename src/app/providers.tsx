"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";

type AuthState = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  enabled: boolean;
};

const Ctx = createContext<AuthState>({
  loading: false,
  userId: null,
  email: null,
  enabled: false,
});

export function useAuthState() {
  return useContext(Ctx);
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const enabled = supabaseEnabled();

  const [loading, setLoading] = useState(enabled); // if no supabase, no loading delay
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !supabase) {
      setLoading(false);
      setUserId(null);
      setEmail(null);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUserId(u?.id ?? null);
      setEmail(u?.email ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      setEmail(u?.email ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [enabled]);

  const value = useMemo(() => ({ loading, userId, email, enabled }), [loading, userId, email, enabled]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

