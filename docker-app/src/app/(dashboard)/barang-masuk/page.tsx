"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export default function BarangMasukPage() {
  const [items, setItems] = useState<any[]>([]);
  const [barang, setBarang] = useState<any[]>([]);
  const [form, setForm] = useState({ barangId: "", jumlah: 1, tanggalMasuk: new Date().toISOString().slice(0,10), tanggalKadaluarsa: "", keterangan: "" });

  async function load() {
    const [a, b] = await Promise.all([fetch("/api/barang-masuk"), fetch("/api/barang")]);
    setItems(await a.json()); setBarang(await b.json());
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/barang-masuk", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(form) });
    if (res.ok) { setForm({ barangId: "", jumlah: 1, tanggalMasuk: new Date().toISOString().slice(0,10), tanggalKadaluarsa: "", keterangan: "" }); load(); }
    else alert("Gagal menyimpan");
  }
  async function del(id: string) { if (!confirm("Hapus?")) return; await fetch(`/api/barang-masuk?id=${id}`, { method: "DELETE" }); load(); }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold">Barang Masuk</h1><p className="text-slate-500">Catat barang yang masuk ke gudang.</p></div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Form Barang Masuk</h2>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
          <select className="input" value={form.barangId} onChange={e => setForm({...form, barangId: e.target.value})} required>
            <option value="">-- Pilih Barang --</option>
            {barang.map(b => <option key={b.id} value={b.id}>{b.kode} - {b.nama}</option>)}
          </select>
          <input className="input" type="number" min={1} placeholder="Jumlah" value={form.jumlah} onChange={e => setForm({...form, jumlah: +e.target.value})} required />
          <input className="input" type="date" value={form.tanggalMasuk} onChange={e => setForm({...form, tanggalMasuk: e.target.value})} required />
          <input className="input" type="date" placeholder="Tanggal Kadaluarsa" value={form.tanggalKadaluarsa} onChange={e => setForm({...form, tanggalKadaluarsa: e.target.value})} />
          <textarea className="input md:col-span-2" placeholder="Keterangan" value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} />
          <div className="md:col-span-2"><button className="btn-primary">Simpan</button></div>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Riwayat Barang Masuk</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-brand text-white">
              <th className="p-3">Tanggal</th><th className="p-3">Kode</th><th className="p-3">Nama Barang</th><th className="p-3">Jumlah</th><th className="p-3">Kadaluarsa</th><th className="p-3">Keterangan</th><th className="p-3">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className="border-b text-center">
                  <td className="p-3">{new Date(r.tanggalMasuk).toLocaleDateString("id-ID")}</td>
                  <td className="p-3 font-mono">{r.barang.kode}</td>
                  <td className="p-3 text-left">{r.barang.nama}</td>
                  <td className="p-3">{r.jumlah}</td>
                  <td className="p-3">{r.tanggalKadaluarsa ? new Date(r.tanggalKadaluarsa).toLocaleDateString("id-ID") : "-"}</td>
                  <td className="p-3 text-left">{r.keterangan ?? "-"}</td>
                  <td className="p-3"><button onClick={() => del(r.id)} className="p-2 rounded bg-red-500 text-white"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Belum ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
