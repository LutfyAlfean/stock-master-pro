import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getExpiryStatus, statusLabel, formatTanggal } from "@/lib/expiry";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Toko MF" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, role } = useAuth();
  const [period, setPeriod] = useState<"1m" | "6m" | "1y">("1y");

  const months = period === "1m" ? 1 : period === "6m" ? 6 : 12;
  const start = new Date(); start.setMonth(start.getMonth() - months + 1);
  start.setDate(1); start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString().split("T")[0];

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", monthStartIso],
    queryFn: async () => {
      const [bp, bm, bk] = await Promise.all([
        supabase.from("barang").select("id", { count: "exact", head: true }),
        supabase.from("barang_masuk").select("jumlah").gte("tanggal_masuk", monthStartIso),
        supabase.from("barang_keluar").select("jumlah").gte("tanggal_keluar", monthStartIso),
      ]);
      const sum = (rows: any[] | null) => (rows ?? []).reduce((s, r) => s + (r.jumlah ?? 0), 0);
      return {
        totalProduk: bp.count ?? 0,
        totalMasukBulanIni: sum(bm.data),
        totalKeluarBulanIni: sum(bk.data),
      };
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ["dashboard-chart", startIso],
    queryFn: async () => {
      const [bm, bk] = await Promise.all([
        supabase.from("barang_masuk").select("jumlah, tanggal_masuk").gte("tanggal_masuk", startIso.split("T")[0]),
        supabase.from("barang_keluar").select("jumlah, tanggal_keluar").gte("tanggal_keluar", startIso.split("T")[0]),
      ]);
      const map = new Map<string, { masuk: number; keluar: number }>();
      for (let i = 0; i < months; i++) {
        const d = new Date(start); d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        map.set(key, { masuk: 0, keluar: 0 });
      }
      (bm.data ?? []).forEach((r: any) => {
        const k = r.tanggal_masuk.slice(0, 7);
        if (map.has(k)) map.get(k)!.masuk += r.jumlah;
      });
      (bk.data ?? []).forEach((r: any) => {
        const k = r.tanggal_keluar.slice(0, 7);
        if (map.has(k)) map.get(k)!.keluar += r.jumlah;
      });
      const fmt = new Intl.DateTimeFormat("id-ID", { month: "short" });
      return Array.from(map.entries()).map(([k, v]) => {
        const [y, m] = k.split("-").map(Number);
        return {
          bulan: fmt.format(new Date(y, m - 1, 1)) + (months > 6 ? ` '${String(y).slice(2)}` : ""),
          masuk: v.masuk, keluar: v.keluar,
        };
      });
    },
  });

  const { data: kadaluarsa } = useQuery({
    queryKey: ["dashboard-kadaluarsa"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const limit = new Date(today); limit.setDate(limit.getDate() + 60);
      const { data } = await supabase
        .from("barang_masuk")
        .select("id, jumlah, tanggal_kadaluarsa, barang:barang_id(nama)")
        .not("tanggal_kadaluarsa", "is", null)
        .lte("tanggal_kadaluarsa", limit.toISOString().split("T")[0])
        .order("tanggal_kadaluarsa", { ascending: true })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: aktivitas } = useQuery({
    queryKey: ["dashboard-aktivitas"],
    queryFn: async () => {
      const [bm, bk] = await Promise.all([
        supabase.from("barang_masuk")
          .select("id, jumlah, tanggal_masuk, created_at, barang:barang_id(kode, nama)")
          .order("created_at", { ascending: false }).limit(10),
        supabase.from("barang_keluar")
          .select("id, jumlah, tanggal_keluar, created_at, barang:barang_id(kode, nama)")
          .order("created_at", { ascending: false }).limit(10),
      ]);
      const items = [
        ...(bm.data ?? []).map((r: any) => ({
          id: "m" + r.id, tipe: "Masuk", tanggal: r.tanggal_masuk,
          created_at: r.created_at, kode: r.barang?.kode, nama: r.barang?.nama, jumlah: r.jumlah,
        })),
        ...(bk.data ?? []).map((r: any) => ({
          id: "k" + r.id, tipe: "Keluar", tanggal: r.tanggal_keluar,
          created_at: r.created_at, kode: r.barang?.kode, nama: r.barang?.nama, jumlah: r.jumlah,
        })),
      ].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);
      return items;
    },
  });

  const stat = [
    { label: "Total Produk", value: stats?.totalProduk ?? 0, sub: "saat ini",
      icon: Package, color: "bg-primary/10 text-primary", bar: "bg-primary" },
    { label: "Total Barang Masuk", value: stats?.totalMasukBulanIni ?? 0, sub: "bulan ini",
      icon: ArrowDownToLine, color: "bg-success/10 text-success", bar: "bg-success" },
    { label: "Total Barang Keluar", value: stats?.totalKeluarBulanIni ?? 0, sub: "bulan ini",
      icon: ArrowUpFromLine, color: "bg-destructive/10 text-destructive", bar: "bg-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Selamat Datang, {profile?.full_name?.split(" ")[0] ?? "User"}!
        </h1>
        <p className="text-muted-foreground mt-1">Pantau stok barang secara real-time.</p>
        {role === "staff" && (
          <Badge variant="outline" className="mt-2">Staff</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stat.map((s) => (
          <Card key={s.label} className="relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${s.bar}`} />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-4xl font-extrabold mt-2">{s.value}</p>
                  <p className={`text-xs mt-1 ${s.label.includes("Keluar") ? "text-destructive" : "text-primary"}`}>{s.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Grafik Transaksi Barang</CardTitle>
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Bulan</SelectItem>
                <SelectItem value="6m">6 Bulan</SelectItem>
                <SelectItem value="1y">1 Tahun</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="bulan" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="masuk" name="Barang Masuk" fill="var(--color-chart-1)" radius={[4,4,0,0]} />
                  <Bar dataKey="keluar" name="Barang Keluar" fill="var(--color-chart-2)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Monitoring Barang Kadaluarsa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-bold">Nama Barang</TableHead>
                    <TableHead className="text-primary-foreground font-bold text-center">Jumlah</TableHead>
                    <TableHead className="text-primary-foreground font-bold text-center">Status</TableHead>
                    <TableHead className="text-primary-foreground font-bold text-center">Tanggal Kadaluarsa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(kadaluarsa ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Tidak ada barang mendekati kadaluarsa</TableCell></TableRow>
                  )}
                  {(kadaluarsa ?? []).map((r: any) => {
                    const st = getExpiryStatus(r.tanggal_kadaluarsa);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-center">{r.barang?.nama}</TableCell>
                        <TableCell className="text-center">{r.jumlah}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={st} /></TableCell>
                        <TableCell className="text-center">{formatTanggal(r.tanggal_kadaluarsa)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-xl">Aktivitas Terakhir</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground font-bold">Tanggal</TableHead>
                  <TableHead className="text-primary-foreground font-bold">Tipe</TableHead>
                  <TableHead className="text-primary-foreground font-bold">Kode Barang</TableHead>
                  <TableHead className="text-primary-foreground font-bold">Nama Barang</TableHead>
                  <TableHead className="text-primary-foreground font-bold text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(aktivitas ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada aktivitas</TableCell></TableRow>
                )}
                {(aktivitas ?? []).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{formatTanggal(a.tanggal)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={a.tipe === "Masuk" ? "default" : "destructive"}
                        className={a.tipe === "Masuk" ? "bg-success hover:bg-success text-success-foreground" : ""}
                      >
                        {a.tipe}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{a.kode}</TableCell>
                    <TableCell>{a.nama}</TableCell>
                    <TableCell className="text-right font-semibold">{a.jumlah}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof getExpiryStatus> }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const cls: Record<string, string> = {
    "aman": "bg-success/20 text-success border-success/30",
    "perlu-dipantau": "bg-info/20 text-info-foreground border-info/30",
    "hati-hati": "bg-warning/30 text-warning-foreground border-warning/40",
    "kadaluarsa": "bg-destructive/20 text-destructive border-destructive/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls[status]}`}>
      {statusLabel[status]}
    </span>
  );
}
