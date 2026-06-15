import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_USERNAME = "admin_pemilik";
const ADMIN_PASSWORD = "Admin_pemilik";
const ADMIN_FULLNAME = "Admin Pemilik";
const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@tokomf.local`;

/** Bootstrap: create default administrator if none exists. Safe to call anonymously. */
export const bootstrapAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing, error: e1 } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("role", "administrator")
    .limit(1);
  if (e1) throw new Error(e1.message);
  if (existing && existing.length > 0) return { created: false };

  const email = usernameToEmail(ADMIN_USERNAME);
  const { data: created, error: e2 } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { username: ADMIN_USERNAME, full_name: ADMIN_FULLNAME },
  });
  if (e2 || !created.user) throw new Error(e2?.message || "Gagal membuat admin");

  await supabaseAdmin.from("user_roles").insert({
    user_id: created.user.id,
    role: "administrator",
  });
  // Ensure profile (trigger should handle, but enforce):
  await supabaseAdmin.from("profiles").upsert({
    id: created.user.id,
    username: ADMIN_USERNAME,
    full_name: ADMIN_FULLNAME,
  });
  return { created: true, username: ADMIN_USERNAME, password: ADMIN_PASSWORD };
});

const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "huruf/angka/underscore"),
  full_name: z.string().min(1).max(100),
  password: z.string().min(6).max(72),
  role: z.enum(["administrator", "staff"]),
});

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "administrator",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Akses ditolak: hanya administrator");
}

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createUserSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = usernameToEmail(data.username);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username.toLowerCase(), full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message || "Gagal membuat user");
    await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      username: data.username.toLowerCase(),
      full_name: data.full_name,
    });
    await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id,
      role: data.role,
    });
    return { id: created.user.id };
  });

const updateUserSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().min(1).max(100),
  role: z.enum(["administrator", "staff"]),
});

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateUserSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ full_name: data.full_name }).eq("id", data.user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Error("Tidak bisa menghapus akun Anda sendiri");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), password: z.string().min(6).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
