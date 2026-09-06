import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { countUnreadEmails } from "@/lib/queries/emails";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { ProductTour } from "@/components/tour/product-tour";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const [organization, unreadEmailCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    }),
    countUnreadEmails(user.organizationId),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar orgName={organization?.name ?? "Avero Saas"} unreadEmailCount={unreadEmailCount} />
      <SidebarInset className="min-w-0">
        <Topbar name={user.name ?? user.email ?? ""} email={user.email ?? ""} role={user.role} />
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
      <ChatWidget />
      <ProductTour userId={user.id} />
    </SidebarProvider>
  );
}
