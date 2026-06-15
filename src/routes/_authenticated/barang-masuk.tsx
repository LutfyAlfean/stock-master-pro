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
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatTanggal } from "@/lib/expiry";

export const Route = createFileRoute("/_authenticated/barang-masuk")({
  head: () => ({ meta: [{ title: "Barang Masuk — Toko MF" }] }),
  component: BarangMasukPage,
});

function BarangMasukPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: rows } = useQuery({
    queryKey: ["barang-masuk-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("barang_masuk")
        .select("id, jumlah, tanggal_masuk, tanggal_kadaluarsa, keterangan, barang:barang_id(kode, nama, satuan)")
        .order("tanggal_masuk", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: barangList } = useQuery({
    queryKey: ["barang-options"],
    queryFn: async () => (await supabase.from("barang").select("id, kode, nama").order("nama")).data ?? [],
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("barang_masuk").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Dihapus"); qc.invalidateQueries(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Barang Masuk</h1>
          <p className="text-muted-foreground text-sm">Pencatatan barang masuk akan otomatis menambah stok</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1"/>Tambah</Button>
          </DialogTrigger>
          <FormMasuk
            barangList={barangList ?? []}
            userId={user?.id ?? null}
            onDone={() => { setOpen(false); qc.invalidateQueries(); }}
          />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  {["Tanggal Masuk", "Kode", "Nama Barang", "Jumlah", "Tanggal Kadaluarsa", "Keterangan", "Aksi"].map(h =>
                    <TableHead key={h} className="text-primary-foreground font-bold">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>}
                {(rows ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatTanggal(r.tanggal_masuk)}</TableCell>
                    <TableCell className="font-mono">{r.barang?.kode}</TableCell>
                    <TableCell>{r.barang?.nama}</TableCell>
                    <TableCell>{r.jumlah} {r.barang?.satuan}</TableCell>
                    <TableCell>{formatTanggal(r.tanggal_kadaluarsa)}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.keterangan ?? "-"}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="outline" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
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

function FormMasuk({ barangList, userId, onDone }: { barangList: any[]; userId: string | null; onDone: () => void }) {
  const [barangId, setBarangId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [tglMasuk, setTglMasuk] = useState(new Date().toISOString().split("T")[0]);
  const [tglKadaluarsa, setTglKadaluarsa] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const submit = async () => {
    if (!barangId || jumlah < 1) return toast.error("Pilih barang dan jumlah");
    const { error } = await supabase.from("barang_masuk").insert({
      barang_id: barangId, jumlah, tanggal_masuk: tglMasuk,
      tanggal_kadaluarsa: tglKadaluarsa || null,
      keterangan: keterangan || null, created_by: userId,
    });
    if (error) return toast.error(error.message);
    toast.success("Barang masuk dicatat, stok diperbarui");
    onDone();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Tambah Barang Masuk</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Barang</Label>
          <Select value={barangId} onValueChange={setBarangId}>
            <SelectTrigger><SelectValue placeholder="Pilih barang" /></SelectTrigger>
            <SelectContent>{barangList.map(b => <SelectItem key={b.id} value={b.id}>{b.kode} — {b.nama}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Jumlah</Label><Input type="number" min={1} value={jumlah} onChange={e => setJumlah(+e.target.value)} /></div>
          <div><Label>Tanggal Masuk</Label><Input type="date" value={tglMasuk} onChange={e => setTglMasuk(e.target.value)} /></div>
        </div>
        <div><Label>Tanggal Kadaluarsa (opsional)</Label><Input type="date" value={tglKadaluarsa} onChange={e => setTglKadaluarsa(e.target.value)} /></div>
        <div><Label>Keterangan</Label><Textarea value={keterangan} onChange={e => setKeterangan(e.target.value)} /></div>
      </div>
      <DialogFooter><Button onClick={submit}>Simpan</Button></DialogFooter>
    </DialogContent>
  );
}
