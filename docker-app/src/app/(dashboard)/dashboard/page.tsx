import { prisma } from "@/lib/prisma";
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";
import { DashboardChart } from "./Chart";

function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }
function statusOf(date: Date | null) {
  if (!date) return null;
  const days = Math.floor((+new Date(date) - Date.now()) / 86400000);
  if (days < 0) return { label: "Kadaluarsa", cls: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: "Hati-hati", cls: "bg-amber-100 text-amber-700" };
  if (days <= 90) return { label: "Perlu Dipantau", cls: "bg-blue-100 text-blue-700" };
  return { label: "Aman", cls: "bg-emerald-100 text-emerald-700" };
}

export default async function DashboardPage() {
  const since = startOfMonth();
  const [totalProduk, masukMonth, keluarMonth, kadaluarsa, recentMasuk, recentKeluar, chartMasuk, chartKeluar] = await Promise.all([
    prisma.barang.count(),
    prisma.barangMasuk.aggregate({ _sum: { jumlah: true }, where: { tanggalMasuk: { gte: since } } }),
    prisma.barangKeluar.aggregate({ _sum: { jumlah: true }, where: { tanggalKeluar: { gte: since } } }),
    prisma.barangMasuk.findMany({
      where: { tanggalKadaluarsa: { not: null } },
      orderBy: { tanggalKadaluarsa: "asc" },
      take: 10, include: { barang: true },
    }),
    prisma.barangMasuk.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { barang: true } }),
    prisma.barangKeluar.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { barang: true } }),
    prisma.barangMasuk.findMany({ where: { tanggalMasuk: { gte: new Date(Date.now() - 365*86400000) } } }),
    prisma.barangKeluar.findMany({ where: { tanggalKeluar: { gte: new Date(Date.now() - 365*86400000) } } }),
  ]);

  const aktivitas = [
    ...recentMasuk.map(r => ({ id: "m"+r.id, tipe: "Masuk" as const, tgl: r.tanggalMasuk, kode: r.barang.kode, nama: r.barang.nama, jumlah: r.jumlah, ts: +new Date(r.createdAt) })),
    ...recentKeluar.map(r => ({ id: "k"+r.id, tipe: "Keluar" as const, tgl: r.tanggalKeluar, kode: r.barang.kode, nama: r.barang.nama, jumlah: r.jumlah, ts: +new Date(r.createdAt) })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 10);

  // build 12-month chart
  const map = new Map<string, { masuk: number; keluar: number }>();
  const fmt = new Intl.DateTimeFormat("id-ID", { month: "short" });
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
    map.set(`${d.getFullYear()}-${d.getMonth()}`, { masuk: 0, keluar: 0 });
  }
  chartMasuk.forEach(r => { const k = `${new Date(r.tanggalMasuk).getFullYear()}-${new Date(r.tanggalMasuk).getMonth()}`; if (map.has(k)) map.get(k)!.masuk += r.jumlah; });
  chartKeluar.forEach(r => { const k = `${new Date(r.tanggalKeluar).getFullYear()}-${new Date(r.tanggalKeluar).getMonth()}`; if (map.has(k)) map.get(k)!.keluar += r.jumlah; });
  const chart = Array.from(map.entries()).map(([k, v]) => { const [y, m] = k.split("-").map(Number); return { bulan: fmt.format(new Date(y, m, 1)), ...v }; });

  const stats = [
    { label: "Total Produk", value: totalProduk, sub: "saat ini", Icon: Package, bar: "bg-brand", iconCls: "bg-brand/10 text-brand", subCls: "text-brand" },
    { label: "Total Barang Masuk", value: masukMonth._sum.jumlah ?? 0, sub: "bulan ini", Icon: ArrowDownToLine, bar: "bg-emerald-500", iconCls: "bg-emerald-100 text-emerald-600", subCls: "text-emerald-600" },
    { label: "Total Barang Keluar", value: keluarMonth._sum.jumlah ?? 0, sub: "bulan ini", Icon: ArrowUpFromLine, bar: "bg-red-500", iconCls: "bg-red-100 text-red-600", subCls: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Selamat Datang, Admin!</h1>
        <p className="text-slate-500">Pantau stok barang secara real-time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(s => (
          <div key={s.label} className="card p-6 relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${s.bar}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-4xl font-extrabold mt-2">{s.value}</p>
                <p className={`text-xs mt-1 ${s.subCls}`}>{s.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${s.iconCls}`}><s.Icon className="h-6 w-6" /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Grafik Transaksi Barang</h2>
          </div>
          <DashboardChart data={chart} />
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Monitoring Barang Kadaluarsa</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand text-white">
                  <th className="p-3 text-left font-bold">Nama Barang</th>
                  <th className="p-3 text-center font-bold">Jumlah</th>
                  <th className="p-3 text-center font-bold">Status</th>
                  <th className="p-3 text-center font-bold">Tanggal Kadaluarsa</th>
                </tr>
              </thead>
              <tbody>
                {kadaluarsa.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-400">Tidak ada barang mendekati kadaluarsa</td></tr>}
                {kadaluarsa.map(r => { const st = statusOf(r.tanggalKadaluarsa); return (
                  <tr key={r.id} className="border-b">
                    <td className="p-3 text-center">{r.barang.nama}</td>
                    <td className="p-3 text-center">{r.jumlah}</td>
                    <td className="p-3 text-center">{st && <span className={`badge ${st.cls}`}>{st.label}</span>}</td>
                    <td className="p-3 text-center">{r.tanggalKadaluarsa ? new Date(r.tanggalKadaluarsa).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">Aktivitas Terakhir</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand text-white">
                <th className="p-3 text-left font-bold">Tanggal</th>
                <th className="p-3 text-left font-bold">Tipe</th>
                <th className="p-3 text-left font-bold">Kode</th>
                <th className="p-3 text-left font-bold">Nama Barang</th>
                <th className="p-3 text-right font-bold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {aktivitas.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Belum ada aktivitas</td></tr>}
              {aktivitas.map(a => (
                <tr key={a.id} className="border-b">
                  <td className="p-3">{new Date(a.tgl).toLocaleDateString("id-ID")}</td>
                  <td className="p-3"><span className={`badge ${a.tipe === "Masuk" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{a.tipe}</span></td>
                  <td className="p-3 font-mono">{a.kode}</td>
                  <td className="p-3">{a.nama}</td>
                  <td className="p-3 text-right font-semibold">{a.jumlah}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
