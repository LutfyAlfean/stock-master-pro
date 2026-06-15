import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/barang")({
  head: () => ({ meta: [{ title: "Master Barang — Toko MF" }] }),
  component: BarangPage,
});

type Barang = {
  id: string; kode: string; nama: string; kategori: string;
  satuan: string; minimal_stok: number; stok: number;
};

function BarangPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Barang | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["barang", search, page],
    queryFn: async () => {
      let q = supabase.from("barang").select("*", { count: "exact" }).order("nama");
      if (search) q = q.or(`kode.ilike.%${search}%,nama.ilike.%${search}%,kategori.ilike.%${search}%`);
      q = q.range((page - 1) * pageSize, page * pageSize - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: (data as Barang[]) ?? [], count: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / pageSize));

  const handleSave = async (form: Omit<Barang, "id" | "stok">) => {
    if (editing) {
      const { error } = await supabase.from("barang").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Barang diperbarui");
    } else {
      const { error } = await supabase.from("barang").insert(form);
      if (error) return toast.error(error.message);
      toast.success("Barang ditambahkan");
    }
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["barang"] });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("barang").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else toast.success("Barang dihapus");
    setDeleteId(null);
    qc.invalidateQueries({ queryKey: ["barang"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Master Barang</h1>
          <p className="text-muted-foreground text-sm">Kelola daftar barang toko</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1"/>Tambah Barang</Button>
          </DialogTrigger>
          <BarangFormDialog initial={editing} onSubmit={handleSave} />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari kode/nama/kategori..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9"/>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  {["Kode", "Nama Barang", "Kategori", "Satuan", "Min. Stok", "Stok", "Aksi"].map(h =>
                    <TableHead key={h} className="text-primary-foreground font-bold">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8">Memuat...</TableCell></TableRow>}
                {!isLoading && (data?.rows.length ?? 0) === 0 &&
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>}
                {data?.rows.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.kode}</TableCell>
                    <TableCell className="font-medium">{b.nama}</TableCell>
                    <TableCell>{b.kategori}</TableCell>
                    <TableCell>{b.satuan}</TableCell>
                    <TableCell>{b.minimal_stok}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${b.stok <= b.minimal_stok ? "text-destructive" : "text-success"}`}>{b.stok}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => { setEditing(b); setOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                        <Button size="icon" variant="outline" className="text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Halaman {page} dari {totalPages} · Total {data?.count ?? 0}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus barang?</AlertDialogTitle>
            <AlertDialogDescription>Aksi ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BarangFormDialog({ initial, onSubmit }: { initial: Barang | null; onSubmit: (f: any) => void }) {
  const [kode, setKode] = useState(initial?.kode ?? "");
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [kategori, setKategori] = useState(initial?.kategori ?? "");
  const [satuan, setSatuan] = useState(initial?.satuan ?? "");
  const [minStok, setMinStok] = useState(initial?.minimal_stok ?? 0);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Edit Barang" : "Tambah Barang"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Kode Barang</Label><Input value={kode} onChange={e => setKode(e.target.value)} /></div>
        <div><Label>Nama Barang</Label><Input value={nama} onChange={e => setNama(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Kategori</Label><Input value={kategori} onChange={e => setKategori(e.target.value)} /></div>
          <div><Label>Satuan</Label><Input value={satuan} onChange={e => setSatuan(e.target.value)} placeholder="pcs, box" /></div>
        </div>
        <div><Label>Minimal Stok</Label><Input type="number" value={minStok} onChange={e => setMinStok(+e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => {
          if (!kode || !nama || !kategori || !satuan) return toast.error("Lengkapi semua field");
          onSubmit({ kode, nama, kategori, satuan, minimal_stok: minStok });
        }}>Simpan</Button>
      </DialogFooter>
    </DialogContent>
  );
}
