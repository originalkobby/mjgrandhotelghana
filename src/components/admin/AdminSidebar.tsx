import {
  LayoutDashboard,
  CalendarCheck,
  CalendarRange,
  MessageSquareText,
  LogOut,
  Hotel,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

const NAV_ITEMS = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, end: true, roles: ["admin", "revenue_manager", "finance"] },
  { title: "Bookings", url: "/admin/bookings", icon: CalendarCheck, end: false, roles: null },
  { title: "Inventory", url: "/admin/inventory", icon: CalendarRange, end: false, roles: ["admin", "revenue_manager"] },
  { title: "Messages", url: "/admin/messages", icon: MessageSquareText, end: false, roles: null },
];

interface Props {
  role: string;
}

export function AdminSidebar({ role }: Props) {
  const { signOut, user } = useAdminAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MJ" className="h-8 w-8 object-contain shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-serif text-sm text-sidebar-foreground truncate">MJ Grand Hotel</p>
              <p className="font-sans text-xs text-muted-foreground capitalize">{role.replace("_", " ")}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS
                .filter((item) => item.roles === null || item.roles.includes(role))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/" target="_blank" rel="noopener noreferrer" className="hover:bg-sidebar-accent/50">
                <Hotel className="mr-2 h-4 w-4" />
                {!collapsed && <span>View Website</span>}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-destructive/10 text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && user && (
          <p className="font-sans text-xs text-muted-foreground px-2 mt-2 truncate">
            {user.email}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
