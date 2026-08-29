import {
  LayoutDashboard,
  CalendarCheck,
  CalendarRange,
  MessageSquareText,
  Users,
  LogOut,
  Globe,
  Tag,
  BarChart3,
  BedDouble,
  Headset,
  Settings,
  UtensilsCrossed,
  ImageIcon,
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
import revenueIntelIcon from "@/assets/revenue-intel-icon.jpeg";

const NAV_ITEMS = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, end: true, roles: ["admin", "revenue_manager", "finance", "front_desk", "operations_manager"] },
  { title: "Bookings", url: "/admin/bookings", icon: CalendarCheck, end: false, roles: ["admin", "revenue_manager", "finance", "front_desk", "operations_manager"] },
  { title: "Guests", url: "/admin/guests", icon: Users, end: false, roles: ["admin", "front_desk", "operations_manager"] },
  { title: "Rooms", url: "/admin/rooms", icon: BedDouble, end: false, roles: ["admin"] },
  { title: "Inventory", url: "/admin/inventory", icon: CalendarRange, end: false, roles: ["admin", "revenue_manager", "front_desk", "operations_manager"] },
  { title: "Promotions", url: "/admin/promotions", icon: Tag, end: false, roles: ["admin"] },
  { title: "Menu", url: "/admin/menu", icon: UtensilsCrossed, end: false, roles: ["admin"] },
  { title: "Food Orders", url: "/admin/food-orders", icon: UtensilsCrossed, end: false, roles: ["admin", "operations_manager", "front_desk", "restaurant_staff"] },
  { title: "Gallery", url: "/admin/gallery", icon: ImageIcon, end: false, roles: ["admin"] },
  { title: "Revenue Intel", url: "/admin/revenue", icon: null, customIcon: revenueIntelIcon, end: false, roles: ["admin", "revenue_manager"] },
  { title: "Reports", url: "/admin/reports", icon: BarChart3, end: false, roles: ["admin", "revenue_manager", "finance"] },
  { title: "Support", url: "/admin/support", icon: Headset, end: false, roles: ["admin", "front_desk", "operations_manager"] },
  { title: "Messages", url: "/admin/messages", icon: MessageSquareText, end: false, roles: ["admin", "revenue_manager", "finance", "front_desk", "operations_manager"] },
  { title: "Settings", url: "/admin/settings", icon: Settings, end: false, roles: ["admin", "restaurant_staff"] },
];

interface Props {
  role: string;
}

export function AdminSidebar({ role }: Props) {
  const { signOut, user } = useAdminAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MJ" className="h-8 w-8 object-contain shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-serif text-sm text-sidebar-foreground truncate">MJ Grand Hotel</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/55">
                {role.replace("_", " ")}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/45">
            Navigation
          </SidebarGroupLabel>
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
                      className="text-sidebar-foreground/75 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground rounded-sm"
                      activeClassName="bg-sidebar-foreground/10 text-sidebar-primary font-medium border-l-2 border-sidebar-primary rounded-none"
                    >
                      {item.customIcon ? (
                        <img src={item.customIcon} alt="" className="mr-2 h-5 w-5 object-contain" />
                      ) : (
                        <item.icon className="mr-2 h-4 w-4" />
                      )}
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


      <SidebarFooter className="p-3 border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sidebar-foreground/75 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground rounded-sm"
              >
                <Globe className="mr-2 h-4 w-4" />
                {!collapsed && <span>View Website</span>}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="text-white hover:bg-sidebar-foreground/10 hover:text-white rounded-sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && user && (
          <p className="font-sans text-[10px] tracking-wide text-sidebar-foreground/50 px-2 mt-2 truncate">
            {user.email}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

