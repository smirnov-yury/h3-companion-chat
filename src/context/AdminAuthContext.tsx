import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AdminAuthState = {
  session: Session | null;
  isAdmin: boolean;
  checked: boolean;
};

const AdminAuthContext = createContext<AdminAuthState>({
  session: null,
  isAdmin: false,
  checked: false,
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({
    session: null,
    isAdmin: false,
    checked: false,
  });

  const resolve = async (session: Session | null) => {
    if (!session) {
      setState({ session: null, isAdmin: false, checked: true });
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) {
      console.error("[AdminAuth] role lookup failed", error);
    }
    setState({
      session,
      isAdmin: data?.role === "admin",
      checked: true,
    });
  };

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) resolve(session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) resolve(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AdminAuthContext.Provider value={state}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
