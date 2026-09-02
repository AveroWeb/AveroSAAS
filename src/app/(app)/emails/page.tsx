import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Plus, Inbox } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { listEmailAccounts, listEmails } from "@/lib/queries/emails";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AccountDialog } from "./account-dialog";
import { SyncButton } from "./sync-button";
import { PushToggle } from "./push-toggle";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { deleteEmailAccountAction } from "./actions";

export const metadata: Metadata = { title: "Emails — Avero Saas" };

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const user = await requireStaff();
  const { account: accountFilter } = await searchParams;
  const [accounts, emails] = await Promise.all([
    listEmailAccounts(user.organizationId),
    listEmails(user.organizationId, { accountId: accountFilter }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Emails</h1>
          <p className="text-sm text-muted-foreground">
            Boîte de réception centralisée — {emails.length} email{emails.length > 1 ? "s" : ""}.
            {accounts.length > 0 && " Synchronisation automatique en arrière-plan."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && <PushToggle />}
          {accounts.length > 0 && <SyncButton />}
          <AccountDialog
            trigger={
              <Button size="sm" variant={accounts.length === 0 ? "default" : "outline"}>
                <Plus />
                Connecter une boîte
              </Button>
            }
          />
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Mail className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Aucune boîte email connectée</p>
              <p className="text-sm text-muted-foreground">
                Connecte ta boîte (ex : Amen.fr) pour recevoir tes emails directement ici.
              </p>
            </div>
            <AccountDialog trigger={<Button className="mt-2"><Plus />Connecter une boîte</Button>} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <FilterLink href="/emails" active={!accountFilter} label="Toutes" />
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-1">
                <FilterLink href={`/emails?account=${acc.id}`} active={accountFilter === acc.id} label={acc.label} />
                {acc.lastSyncError && (
                  <Badge className="border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
                    Erreur de sync
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              {emails.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                  <Inbox className="size-8" />
                  <p>Aucun email pour le moment. Clique sur « Synchroniser » pour vérifier ta boîte.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {emails.map((email) => (
                    <Link
                      key={email.id}
                      href={`/emails/${email.id}`}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 hover:bg-muted/50",
                        !email.isRead && "bg-muted/30",
                      )}
                    >
                      <div className="w-40 shrink-0 truncate text-sm">
                        <span className={cn(!email.isRead && "font-semibold")}>
                          {email.fromName || email.fromAddress}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 truncate text-sm">
                        <span className={cn(!email.isRead && "font-semibold")}>{email.subject}</span>
                        {email.bodyText && (
                          <span className="ml-2 text-muted-foreground">
                            — {email.bodyText.replace(/\s+/g, " ").slice(0, 80)}
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(email.receivedAt)}
                      </div>
                      {!email.isRead && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 py-4">
              <p className="text-sm font-medium text-muted-foreground">Boîtes connectées</p>
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{acc.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {acc.emailAddress} — {acc.lastSyncedAt ? `Sync. ${formatDateTime(acc.lastSyncedAt)}` : "Jamais synchronisée"}
                    </p>
                    {acc.lastSyncError && (
                      <p className="text-xs text-destructive">{acc.lastSyncError}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <SyncButton accountId={acc.id} />
                    <DeleteIconButton
                      action={deleteEmailAccountAction.bind(null, acc.id)}
                      confirmMessage={`Déconnecter la boîte ${acc.label} ? Les emails déjà reçus resteront visibles.`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Button size="sm" variant={active ? "default" : "outline"} render={<Link href={href} />} nativeButton={false}>
      {label}
    </Button>
  );
}
