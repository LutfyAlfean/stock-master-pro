import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Key } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createUser, updateUser, deleteUser, resetPassword } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/manajemen-pengguna")({
  head: () => ({ meta: [{ title: "Manajemen Pengguna — Toko MF" }] }),
  component: ManajemenPenggunaPage,
});

function ManajemenPenggunaPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { role, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);

  const createFn = useServerFn(createUser);
  const updateFn = useServerFn(updateUser);
  const deleteFn = useServerFn(deleteUser);
  const resetFn = useServerFn(resetPassword);

  useEffect(() => {
    if (!loading && role !== "administrator") navigate({ to: "/dashboard", replace: true });
  }, [loading, role, navigate]);

  const { data: users } = useQuery({
    queryKey: ["users-list"],
    enabled: role === "administrator",
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, username, full_name, created_at").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string>();
      (roles ?? []).forEach((r: any) => roleMap.set(r.user_id, r.role));
      return (profiles ?? []).map((p: any) => ({ ...p, role: roleMap.get(p.id) ?? "staff" }));
    },
  });

  if (role !== "administrator") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground text-sm">Kelola akun administrator dan staff</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1"/>Tambah User</Button></DialogTrigger>
          <UserFormDialog
            initial={editing}
            onSubmit={async (form) => {
              try {
                if (editing) {
                  await updateFn({ data: { user_id: editing.id, full_name: form.full_name, role: form.role } });
                  toast.success("User diperbarui");
                } else {
                  await createFn({ data: form });
                  toast.success("User dibuat");
                }
                setOpen(false); setEditing(null);
                qc.invalidateQueries({ queryKey: ["users-list"] });
              } catch (e: any) { toast.error(e?.message ?? "Gagal"); }
            }}
          />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                {["Username", "Nama Lengkap", "Role", "Aksi"].map(h =>
                  <TableHead key={h} className="text-primary-foreground font-bold">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.username}</TableCell>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>
                    <Badge className={u.role === "administrator" ? "bg-primary" : "bg-info text-info-foreground"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => { setEditing(u); setOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                      <Button size="icon" variant="outline" onClick={() => setResetId(u.id)}><Key className="h-4 w-4"/></Button>
                      <Button size="icon" variant="outline" className="text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(users ?? []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada user</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus user?</AlertDialogTitle>
            <AlertDialogDescription>User akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => {
              try { await deleteFn({ data: { user_id: deleteId! } }); toast.success("User dihapus"); qc.invalidateQueries({ queryKey: ["users-list"] }); }
              catch (e: any) { toast.error(e?.message ?? "Gagal"); }
              setDeleteId(null);
            }}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResetPasswordDialog
        open={!!resetId}
        onClose={() => setResetId(null)}
        onSubmit={async (pwd) => {
          try { await resetFn({ data: { user_id: resetId!, password: pwd } }); toast.success("Password direset"); }
          catch (e: any) { toast.error(e?.message ?? "Gagal"); }
          setResetId(null);
        }}
      />
    </div>
  );
}

function UserFormDialog({ initial, onSubmit }: { initial: any; onSubmit: (f: any) => void }) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"administrator" | "staff">(initial?.role ?? "staff");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Edit User" : "Tambah User"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Username</Label><Input value={username} disabled={!!initial} onChange={e => setUsername(e.target.value)} placeholder="huruf, angka, _" /></div>
        <div><Label>Nama Lengkap</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
        {!initial && <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>}
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="administrator">Administrator</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => {
          if (initial) onSubmit({ full_name: fullName, role });
          else {
            if (!username || !fullName || !password) return toast.error("Lengkapi semua field");
            onSubmit({ username, full_name: fullName, password, role });
          }
        }}>Simpan</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ResetPasswordDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (p: string) => void }) {
  const [pwd, setPwd] = useState("");
  useEffect(() => { if (!open) setPwd(""); }, [open]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
        <Label>Password Baru</Label>
        <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} />
        <DialogFooter>
          <Button onClick={() => { if (pwd.length < 6) return toast.error("Minimal 6 karakter"); onSubmit(pwd); }}>Reset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
