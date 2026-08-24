import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true },
  });

  return (
    <SidebarProvider>
      <AppSidebar orgName={organization?.name ?? "Mon Agence"} />
      <SidebarInset>
        <Topbar name={user.name ?? user.email ?? ""} email={user.email ?? ""} role={user.role} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
