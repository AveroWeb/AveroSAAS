"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmailAccountAction } from "./actions";

export function AccountDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      try {
        await createEmailAccountAction(formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connecter une boîte email</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Renseigne les paramètres IMAP de ta boîte (ex : Amen.fr — serveur{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">imap.amen.fr</code>, port{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">993</code>, SSL activé).
          </p>
          <div className="space-y-2">
            <Label htmlFor="acc-label">Nom *</Label>
            <Input id="acc-label" name="label" required placeholder="Ex : Contact agence" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-emailAddress">Adresse email *</Label>
            <Input id="acc-emailAddress" name="emailAddress" type="email" required placeholder="contact@agence.fr" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acc-imapHost">Serveur IMAP *</Label>
              <Input id="acc-imapHost" name="imapHost" required placeholder="imap.amen.fr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-imapPort">Port *</Label>
              <Input id="acc-imapPort" name="imapPort" type="number" required defaultValue={993} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="acc-imapSecure"
              name="imapSecure"
              type="checkbox"
              defaultChecked
              className="size-4 accent-primary"
            />
            <Label htmlFor="acc-imapSecure" className="font-normal">
              Connexion sécurisée (SSL/TLS)
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-username">Identifiant *</Label>
            <Input id="acc-username" name="username" required placeholder="Souvent l'adresse email elle-même" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-password">Mot de passe *</Label>
            <Input id="acc-password" name="password" type="password" required autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Connexion en cours…" : "Connecter la boîte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
