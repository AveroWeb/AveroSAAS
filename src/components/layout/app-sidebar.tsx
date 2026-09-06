"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Globe,
  Wrench,
  CreditCard,
  AlertTriangle,
  Settings,
  Building2,
  Sparkles,
  Radar,
  Receipt,
  FileSignature,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; icon: LucideIcon; tourId?: string };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/emails", label: "Emails", icon: Mail, tourId: "nav-emails" },
  { href: "/agent", label: "Agent IA", icon: Sparkles, tourId: "nav-agent" },
  { href: "/prospection", label: "Prospection", icon: Radar },
  { href: "/clients", label: "Clients", icon: Users, tourId: "nav-clients" },
  { href: "/sites", label: "Sites", icon: Globe },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/subscriptions", label: "Abonnements", icon: CreditCard },
  { href: "/quotes", label: "Devis", icon: FileSignature },
  { href: "/invoices", label: "Factures", icon: Receipt },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
];

export function AppSidebar({ orgName, unreadEmailCount = 0 }: { orgName: string; unreadEmailCount?: number }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <span className="truncate font-semibold">{orgName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu data-tour="sidebar-nav">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href} data-tour={item.tourId}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.href === "/emails" && unreadEmailCount > 0 && (
                      <SidebarMenuBadge>{unreadEmailCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={pathname.startsWith("/settings")}
              tooltip="Paramètres"
            >
              <Settings />
              <span>Paramètres</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
