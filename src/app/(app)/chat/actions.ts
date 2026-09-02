"use server";

import { z } from "zod";
import { requireStaff } from "@/lib/session";
import { runChatAgent } from "@/lib/ai/chat-agent";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(6000),
});

const historySchema = z.array(messageSchema).min(1).max(24);

export async function sendChatMessage(history: unknown): Promise<{ reply: string }> {
  const user = await requireStaff();

  const parsed = historySchema.parse(history);
  if (parsed[parsed.length - 1].role !== "user") {
    throw new Error("Le dernier message doit venir de l'utilisateur.");
  }

  const reply = await runChatAgent(parsed, {
    organizationId: user.organizationId,
    userName: user.name ?? user.email ?? "",
  });

  return { reply };
}
