"use client";

import { useTransition } from "react";
import { Star, MailX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markEmailReadAction, toggleEmailStarAction } from "../actions";

export function EmailToolbar({ emailId, isStarred }: { emailId: string; isStarred: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleStar() {
    startTransition(async () => {
      try {
        await toggleEmailStarAction(emailId, !isStarred);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur.");
      }
    });
  }

  function handleMarkUnread() {
    startTransition(async () => {
      try {
        await markEmailReadAction(emailId, false);
        toast.success("Marqué comme non lu.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={handleStar} disabled={isPending}>
        <Star className={cn("size-4", isStarred && "fill-amber-400 text-amber-400")} />
        {isStarred ? "Favori" : "Marquer favori"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleMarkUnread} disabled={isPending}>
        <MailX className="size-4" />
        Marquer non lu
      </Button>
    </div>
  );
}
