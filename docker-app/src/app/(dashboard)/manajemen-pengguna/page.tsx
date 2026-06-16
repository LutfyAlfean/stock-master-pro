"use client";
import { useEffect, useState } from "react";
import { Pencil, Trash2, KeyRound } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ id: "", username: "", fullName: "", password: "", role: "STAFF" });

  async function load() { const r = await fetch("/api/users"); if (r.ok) setUsers(await r.json()); }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/users/${form.id}` : "/api/users";
    const res = await fetch(url, { method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(form) });
    if (res.ok) { setForm({ id:"", username:"", fullName:"", password:"", role:"STAFF" }); load(); }
    else alert((await res.json()).error ?? "Gagal");
  }
  async function del(id: string) { if (!confirm("Hapus user ini?")) return; await fetch(`/api/users/${id}`, { method:"DELETE" }); load(); }
  async function reset(id: string) {
    const pw = prompt("Password baru (min 6 char):"); if (!pw) return;
    const res = await fetch(`/api/users/${id}/reset-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ password: pw }) });
    alert(res.ok ? "Password direset" : "Gagal reset");
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold">Manajemen Pengguna</h1><p className="text-slate-500">Kelola akun administrator & staff.</p></div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">{form.id ? "Edit User" : "Tambah User"}</h2>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
          <input className="input" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required disabled={!!form.id} />
          <input className="input" placeholder="Nama Lengkap" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
          {!form.id && <input className="input" type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />}
          <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="ADMINISTRATOR">Administrator</option>
            <option value="STAFF">Staff</option>
          </select>
          <div className="md:col-span-2">
            <button className="btn-primary">{form.id ? "Update" : "Tambah"}</button>
            {form.id && <button type="button" onClick={() => setForm({ id:"", username:"", fullName:"", password:"", role:"STAFF" })} className="btn-ghost ml-2">Batal</button>}
          </div>
        </form>
      </div>

      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-brand text-white">
              <th className="p-3">Username</th><th className="p-3">Nama Lengkap</th><th className="p-3">Role</th><th className="p-3">Aksi</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b text-center">
                  <td className="p-3 font-mono">{u.username}</td>
                  <td className="p-3 text-left">{u.fullName}</td>
                  <td className="p-3"><span className={`badge ${u.role === "ADMINISTRATOR" ? "bg-brand text-white" : "bg-slate-200"}`}>{u.role}</span></td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setForm({ id: u.id, username: u.username, fullName: u.fullName, password: "", role: u.role })} className="p-2 rounded bg-blue-500 text-white"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => reset(u.id)} className="p-2 rounded bg-amber-500 text-white"><KeyRound className="h-4 w-4" /></button>
                      <button onClick={() => del(u.id)} className="p-2 rounded bg-red-500 text-white"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-400">Belum ada user</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
