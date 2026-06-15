import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MfLogo } from "@/components/MfLogo";
import { signInWithUsername } from "@/lib/auth-helpers";
import { bootstrapAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Login — Toko Musthofa Farras" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const runBootstrap = useServerFn(bootstrapAdmin);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    runBootstrap({}).then((r) => {
      if (r?.created) {
        setHint(`Admin default dibuat — Username: ${r.username}  Password: ${r.password}`);
      }
    }).catch(() => {});
  }, [navigate, runBootstrap]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await signInWithUsername(username, password);
      toast.success("Berhasil login");
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--gradient-login)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 sm:p-10"
        style={{
          background: "linear-gradient(180deg, rgba(46,87,66,0.85) 0%, rgba(31,77,58,0.95) 100%)",
          boxShadow: "var(--shadow-login)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <MfLogo size={120} />
          <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-wide text-white">
            TOKO MUSTHOFA<br />FARRAS
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-white/70">
            Perlengkapan, Oleh-Oleh Haji & Umroh • Herbal • Dll
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan Username"
              autoComplete="username"
              className="h-12 pl-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-secondary"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan Password"
              autoComplete="current-password"
              className="h-12 pl-10 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-secondary"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-base shadow-lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
          </Button>
        </form>

        {hint && (
          <div className="mt-4 rounded-lg bg-white/10 p-3 text-xs text-white/90 text-center">
            {hint}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-white/60">© 2026 Stok Barang Toko MF</p>
      </div>
    </div>
  );
}
