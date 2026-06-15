import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AuthState = {
  loading: boolean;
  user: User | null;
  role: "administrator" | "staff" | null;
  profile: { username: string; full_name: string } | null;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true, user: null, role: null, profile: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadFor(user: User | null) {
      if (!user) {
        if (mounted) setState({ loading: false, user: null, role: null, profile: null });
        return;
      }
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("username, full_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const role =
        roles?.some((r: any) => r.role === "administrator")
          ? "administrator"
          : roles?.[0]?.role ?? "staff";
      if (mounted) {
        setState({
          loading: false,
          user,
          role: role as any,
          profile: profile ?? { username: user.email ?? "", full_name: user.email ?? "" },
        });
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      loadFor(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => loadFor(data.session?.user ?? null));

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
