import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { MfLogo } from "./MfLogo";
import { signOut } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/use-auth";

const navMain = [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }];
const navMaster = [{ title: "Barang", url: "/barang", icon: Package }];
const navStok = [
  { title: "Barang Masuk", url: "/barang-masuk", icon: ArrowDownToLine },
  { title: "Barang Keluar", url: "/barang-keluar", icon: ArrowUpFromLine },
];
const navAdmin = [{ title: "Manajemen Pengguna", url: "/manajemen-pengguna", icon: Users }];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();

  const isActive = (url: string) => pathname === url;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const renderItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={item.title}
        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
      >
        <Link to={item.url} className="flex items-center gap-3">
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b py-4">
        <div className="flex items-center gap-3 px-2">
          <MfLogo size={collapsed ? 32 : 44} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary">TOKO MF</p>
              <p className="truncate text-xs text-muted-foreground">Stok Barang</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{navMain.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="font-bold text-primary">Master</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{navMaster.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="font-bold text-primary">Pembukuan Stok</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{navStok.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "administrator" && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="font-bold text-primary">Pengaturan</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>{navAdmin.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-medium">Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
