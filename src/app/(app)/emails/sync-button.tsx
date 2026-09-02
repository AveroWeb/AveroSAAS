"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncAllEmailAccountsAction, syncEmailAccountAction } from "./actions";

export function SyncButton({ accountId }: { accountId?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        if (accountId) {
          await syncEmailAccountAction(accountId);
        } else {
          await syncAllEmailAccountsAction();
        }
        toast.success("Boîte(s) synchronisée(s).");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de la synchronisation.");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
      {isPending ? "Synchronisation…" : "Synchroniser"}
    </Button>
  );
}
