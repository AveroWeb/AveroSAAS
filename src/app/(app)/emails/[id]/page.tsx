import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { getEmail } from "@/lib/queries/emails";
import { markEmailReadAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { EmailBody } from "./email-body";
import { EmailToolbar } from "./toolbar";

export const metadata: Metadata = { title: "Email — Avero Saas" };

export default async function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  const email = await getEmail(user.organizationId, id);
  if (!email) notFound();

  if (!email.isRead) {
    await markEmailReadAction(email.id, true);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Button variant="ghost" size="sm" render={<Link href="/emails" />} nativeButton={false} className="w-fit">
        <ArrowLeft className="size-4" />
        Retour à la boîte de réception
      </Button>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight break-words">{email.subject}</h1>
            <p className="text-sm text-muted-foreground">
              De <span className="font-medium text-foreground">{email.fromName || email.fromAddress}</span>
              {email.fromName && <span> ({email.fromAddress})</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              À {email.toAddresses} — {formatDateTime(email.receivedAt)} — via {email.account.label}
            </p>
          </div>
          <EmailToolbar emailId={email.id} isStarred={email.isStarred} />
        </CardHeader>
        <CardContent>
          <EmailBody html={email.bodyHtml} text={email.bodyText} />
        </CardContent>
      </Card>
    </div>
  );
}
