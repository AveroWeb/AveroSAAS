import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEmailAccount } from "@/lib/email/imap";
import { notifyNewEmails } from "@/lib/email/notify";

export const maxDuration = 60;

/**
 * Pulls new mail for every active EmailAccount and pushes notifications for
 * anything new. Meant to be hit every few minutes by an external scheduler
 * (e.g. cron-job.org) since Vercel's Hobby plan cron only runs once a day.
 *
 * Auth: a shared secret passed as `?token=` or an `Authorization: Bearer`
 * header, checked against the CRON_SECRET env var.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (tokenParam !== secret && bearerToken !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.emailAccount.findMany({ where: { isActive: true } });

  const results = await Promise.allSettled(
    accounts.map(async (account) => {
      const newEmails = await syncEmailAccount(account.id);
      await notifyNewEmails(account.organizationId, newEmails);
      return { accountId: account.id, newCount: newEmails.length };
    }),
  );

  const summary = results.map((r, i) => ({
    accountId: accounts[i].id,
    label: accounts[i].label,
    ok: r.status === "fulfilled",
    newCount: r.status === "fulfilled" ? r.value.newCount : 0,
    error: r.status === "rejected" ? String(r.reason) : null,
  }));

  return NextResponse.json({ syncedAt: new Date().toISOString(), accounts: summary });
}
