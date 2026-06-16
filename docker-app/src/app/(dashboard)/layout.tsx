import { Sidebar } from "@/components/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = (session.user as any);
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-brand text-white grid place-items-center font-bold">{user.fullName?.[0] ?? "U"}</div>
            <div className="text-sm">
              <p className="font-semibold leading-none">{user.fullName}</p>
              <p className="text-xs text-slate-500">{user.role === "ADMINISTRATOR" ? "Administrator" : "Staff"}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
