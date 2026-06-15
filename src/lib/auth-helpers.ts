import { supabase } from "@/integrations/supabase/client";

/** Convert short username to internal email used by Supabase Auth. */
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@tokomf.local`;

export async function signInWithUsername(username: string, password: string) {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}
