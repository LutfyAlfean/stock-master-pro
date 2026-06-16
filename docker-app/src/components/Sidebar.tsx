"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Package, LogIn as ArrowIn, LogOut as ArrowOut, Users, LogOut } from "lucide-react";

const groups = [
  { label: null, items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Master", items: [{ href: "/barang", label: "Barang", icon: Package }] },
  { label: "Pembukuan Stok", items: [
    { href: "/barang-masuk", label: "Barang Masuk", icon: ArrowIn },
    { href: "/barang-keluar", label: "Barang Keluar", icon: ArrowOut },
  ]},
  { label: "Pengaturan", items: [{ href: "/manajemen-pengguna", label: "Manajemen Pengguna", icon: Users, adminOnly: true }] },
];

export function Sidebar() {
  const path = usePathname();
  const { data } = useSession();
  const role = (data?.user as any)?.role;

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-brand text-white grid place-items-center text-2xl font-extrabold border-4 border-brand-light">MF</div>
      </div>
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {groups.map((g, i) => (
          <div key={i}>
            {g.label && <p className="px-3 text-xs font-bold text-slate-500 uppercase mb-1">{g.label}</p>}
            <div className="space-y-1">
              {g.items.filter(it => !(it as any).adminOnly || role === "ADMINISTRATOR").map((it) => {
                const active = path === it.href;
                const Icon = it.icon;
                return (
                  <Link key={it.href} href={it.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${active ? "bg-brand text-white" : "text-slate-700 hover:bg-slate-100"}`}>
                    <Icon className="h-4 w-4" /> {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
