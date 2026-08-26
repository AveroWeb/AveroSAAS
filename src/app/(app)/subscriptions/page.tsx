import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { listPlans, listSubscriptions } from "@/lib/queries/subscriptions";
import { StatusBadge, subscriptionStatusMeta } from "@/components/status-badge";
import { DeleteIconButton } from "@/components/delete-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { PlanDialog } from "./plan-dialog";
import { deletePlanAction } from "./actions";

export const metadata: Metadata = { title: "Abonnements — Mon Agence" };

export default async function SubscriptionsPage() {
  const user = await requireStaff();
  const [plans, subscriptions] = await Promise.all([
    listPlans(user.organizationId),
    listSubscriptions(user.organizationId),
  ]);

  const mrr = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + Number(s.monthlyPrice), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnements</h1>
        <p className="text-sm text-muted-foreground">
          {subscriptions.length} abonnement{subscriptions.length > 1 ? "s" : ""} · MRR total : {formatCurrency(mrr)}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Forfaits</CardTitle>
          <PlanDialog
            trigger={
              <Button size="sm">
                <Plus /> Nouveau forfait
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prix mensuel</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Aucun forfait. Créez-en un pour pouvoir l&apos;assigner à un client.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{formatCurrency(Number(plan.monthlyPrice))}</TableCell>
                    <TableCell>
                      {plan.isActive ? (
                        <StatusBadge meta={{ label: "Actif", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" }} />
                      ) : (
                        <StatusBadge meta={{ label: "Inactif", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <PlanDialog
                          plan={{ ...plan, monthlyPrice: Number(plan.monthlyPrice) }}
                          trigger={
                            <Button variant="ghost" size="icon-sm">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteIconButton
                          action={deletePlanAction.bind(null, plan.id)}
                          confirmMessage={`Supprimer le forfait "${plan.name}" ?`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abonnements clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Forfait</TableHead>
                <TableHead>Prix mensuel</TableHead>
                <TableHead>Renouvellement</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucun abonnement. Ajoutez-en un depuis la fiche d&apos;un client.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <Link href={`/clients/${subscription.client.id}`} className="font-medium hover:underline">
                        {subscription.client.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>{subscription.plan?.name ?? "Personnalisé"}</TableCell>
                    <TableCell>{formatCurrency(Number(subscription.monthlyPrice))}</TableCell>
                    <TableCell>{formatDate(subscription.renewalDate)}</TableCell>
                    <TableCell><StatusBadge meta={subscriptionStatusMeta[subscription.status]} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
