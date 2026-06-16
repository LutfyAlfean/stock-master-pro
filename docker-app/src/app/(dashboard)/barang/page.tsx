"use client";
import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

type Barang = { id: string; kode: string; nama: string; kategori: string; satuan: string; stok: number; minimalStok: number };

export default function BarangPage() {
  const [items, setItems] = useState<Barang[]>([]);
  const [form, setForm] = useState({ id: "", nama: "", kode: "", kategori: "", satuan: "", stok: 0, minimalStok: 0 });
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState("");

  async function load() {
    const r = await fetch("/api/barang"); setItems(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/barang/${form.id}` : "/api/barang";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ id: "", nama: "", kode: "", kategori: "", satuan: "", stok: 0, minimalStok: 0 }); load(); }
    else alert((await res.json()).error ?? "Gagal");
  }

  async function del(id: string) {
    if (!confirm("Hapus barang ini?")) return;
    await fetch(`/api/barang/${id}`, { method: "DELETE" }); load();
  }

  const kategoriList = Array.from(new Set(items.map(i => i.kategori)));
  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    return (!s || i.nama.toLowerCase().includes(s) || i.kode.toLowerCase().includes(s)) &&
           (!filterKat || i.kategori === filterKat);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Stok Barang</h1>
        <p className="text-slate-500">Kelola semua stok barang.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Manajemen Produk</h2>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <input className="input" placeholder="Nama Barang" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
          <input className="input" placeholder="Kode Barang" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} required />
          <input className="input" placeholder="Kategori" value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} required />
          <input className="input" placeholder="Satuan (Pcs/Kg/Botol)" value={form.satuan} onChange={e => setForm({ ...form, satuan: e.target.value })} required />
          <input className="input" type="number" placeholder="Minimal Stok" value={form.minimalStok} onChange={e => setForm({ ...form, minimalStok: +e.target.value })} />
          <div className="md:col-span-2">
            <button className="btn-primary">{form.id ? "Update" : "Tambah"}</button>
            {form.id && <button type="button" onClick={() => setForm({ id: "", nama: "", kode: "", kategori: "", satuan: "", stok: 0, minimalStok: 0 })} className="btn-ghost ml-2">Batal</button>}
          </div>
        </form>
      </div>

      <div className="card p-6">
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <input className="input" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" value={filterKat} onChange={e => setFilterKat(e.target.value)}>
            <option value="">Semua Kategori</option>
            {kategoriList.map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand text-white">
                <th className="p-3 font-bold">No</th>
                <th className="p-3 font-bold">Kode</th>
                <th className="p-3 font-bold">Nama Barang</th>
                <th className="p-3 font-bold">Kategori</th>
                <th className="p-3 font-bold">Satuan</th>
                <th className="p-3 font-bold">Stok</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const status = b.stok === 0 ? { label: "Habis", cls: "bg-red-500 text-white" }
                  : b.stok <= b.minimalStok ? { label: "Menipis", cls: "bg-red-500 text-white" }
                  : { label: "Tersedia", cls: "bg-emerald-500 text-white" };
                return (
                  <tr key={b.id} className="border-b text-center">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-mono">{b.kode}</td>
                    <td className="p-3 text-left">{b.nama}</td>
                    <td className="p-3">{b.kategori}</td>
                    <td className="p-3">{b.satuan}</td>
                    <td className="p-3">{b.stok}</td>
                    <td className="p-3"><span className={`badge ${status.cls}`}>{status.label}</span></td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setForm({ ...b })} className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => del(b.id)} className="p-2 rounded bg-red-500 text-white hover:bg-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-400">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
