"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const res = await signIn("credentials", { redirect: false, username, password });
    setLoading(false);
    if (res?.error) setErr("Username atau password salah");
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-light to-slate-50 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand text-white grid place-items-center text-2xl font-extrabold">MF</div>
          <h1 className="mt-3 text-2xl font-bold">Toko Musthofa Farras</h1>
          <p className="text-sm text-slate-500">Sistem Manajemen Stok</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={username} onChange={e => setU(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setP(e.target.value)} required />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Memproses..." : "Masuk"}</button>
        </form>
        <p className="text-xs text-slate-400 mt-4 text-center">Default: admin_pemilik / Admin_pemilik</p>
      </div>
    </div>
  );
}
