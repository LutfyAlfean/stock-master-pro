import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatTanggal } from "@/lib/expiry";

export const Route = createFileRoute("/_authenticated/barang-keluar")({
  head: () => ({ meta: [{ title: "Barang Keluar — Toko MF" }] }),
  component: BarangKeluarPage,
});

function BarangKeluarPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: rows } = useQuery({
    queryKey: ["barang-keluar-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("barang_keluar")
        .select("id, jumlah, tanggal_keluar, keterangan, barang:barang_id(kode, nama, satuan)")
        .order("tanggal_keluar", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: barangList } = useQuery({
    queryKey: ["barang-options-keluar"],
    queryFn: async () => (await supabase.from("barang").select("id, kode, nama, stok").order("nama")).data ?? [],
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("barang_keluar").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Dihapus, stok dikembalikan"); qc.invalidateQueries(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Barang Keluar</h1>
          <p className="text-muted-foreground text-sm">Pencatatan barang keluar akan otomatis mengurangi stok</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1"/>Tambah</Button></DialogTrigger>
          <FormKeluar barangList={barangList ?? []} userId={user?.id ?? null} onDone={() => { setOpen(false); qc.invalidateQueries(); }} />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  {["Tanggal Keluar", "Kode", "Nama Barang", "Jumlah", "Keterangan", "Aksi"].map(h =>
                    <TableHead key={h} className="text-primary-foreground font-bold">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>}
                {(rows ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatTanggal(r.tanggal_keluar)}</TableCell>
                    <TableCell className="font-mono">{r.barang?.kode}</TableCell>
                    <TableCell>{r.barang?.nama}</TableCell>
                    <TableCell>{r.jumlah} {r.barang?.satuan}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.keterangan ?? "-"}</TableCell>
                    <TableCell><Button size="icon" variant="outline" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
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

function FormKeluar({ barangList, userId, onDone }: { barangList: any[]; userId: string | null; onDone: () => void }) {
  const [barangId, setBarangId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [keterangan, setKeterangan] = useState("");
  const selected = barangList.find(b => b.id === barangId);

  const submit = async () => {
    if (!barangId || jumlah < 1) return toast.error("Pilih barang dan jumlah");
    if (selected && jumlah > selected.stok) return toast.error(`Stok hanya ${selected.stok}`);
    const { error } = await supabase.from("barang_keluar").insert({
      barang_id: barangId, jumlah, tanggal_keluar: tgl,
      keterangan: keterangan || null, created_by: userId,
    });
    if (error) return toast.error(error.message);
    toast.success("Barang keluar dicatat, stok diperbarui");
    onDone();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Tambah Barang Keluar</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Barang</Label>
          <Select value={barangId} onValueChange={setBarangId}>
            <SelectTrigger><SelectValue placeholder="Pilih barang" /></SelectTrigger>
            <SelectContent>{barangList.map(b => <SelectItem key={b.id} value={b.id}>{b.kode} — {b.nama} (stok: {b.stok})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Jumlah</Label>
            <Input type="number" min={1} max={selected?.stok} value={jumlah} onChange={e => setJumlah(+e.target.value)} />
            {selected && <p className="text-xs text-muted-foreground mt-1">Stok tersedia: {selected.stok}</p>}
          </div>
          <div><Label>Tanggal Keluar</Label><Input type="date" value={tgl} onChange={e => setTgl(e.target.value)} /></div>
        </div>
        <div><Label>Keterangan</Label><Textarea value={keterangan} onChange={e => setKeterangan(e.target.value)} /></div>
      </div>
      <DialogFooter><Button onClick={submit}>Simpan</Button></DialogFooter>
    </DialogContent>
  );
}
