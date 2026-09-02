"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { subscribeToPushAction, unsubscribeFromPushAction } from "./actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "subscribed" | "unsubscribed";

export function PushToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
    }
    check().catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setIsPending(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Notifications non configurées (clé VAPID manquante).");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Autorisation refusée par le navigateur.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Abonnement push invalide.");
      }

      await subscribeToPushAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });

      setStatus("subscribed");
      toast.success("Notifications activées.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'activer les notifications.");
    } finally {
      setIsPending(false);
    }
  }

  async function disable() {
    setIsPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeFromPushAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
      toast.success("Notifications désactivées.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setIsPending(false);
    }
  }

  if (status === "checking" || status === "unsupported") return null;

  return status === "subscribed" ? (
    <Button variant="outline" size="sm" onClick={disable} disabled={isPending}>
      <Bell className="size-4 fill-current" />
      Notifications activées
    </Button>
  ) : (
    <Button variant="outline" size="sm" onClick={enable} disabled={isPending}>
      <BellOff className="size-4" />
      Activer les notifications
    </Button>
  );
}
