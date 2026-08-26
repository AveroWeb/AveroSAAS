import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/ai/client";

export type ParsedAgentInput = {
  clientName: string;
  taskTitle: string;
  taskDescription: string | null;
  amount: string | null;
  dueDate: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
};

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_task_info",
  description:
    "Extract client and task information from a short free-text note written by a web agency employee about work sold to a client.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      clientName: {
        type: "string",
        description: "The name of the client/company the work is for.",
      },
      taskTitle: {
        type: "string",
        description: "A short title (max ~60 chars) summarizing the task, e.g. 'Création du site vitrine'.",
      },
      taskDescription: {
        type: ["string", "null"],
        description: "A fuller description of the work, in French, restating the note's details (excluding the due date, which has its own field). Null if nothing beyond the title.",
      },
      amount: {
        type: ["string", "null"],
        description: "The price/amount sold, as a plain string including currency symbol if mentioned (e.g. '800€'). Null if no amount is mentioned.",
      },
      dueDate: {
        type: ["string", "null"],
        description: "The deadline mentioned, formatted as an ISO date YYYY-MM-DD. Null if no deadline is mentioned.",
      },
      priority: {
        type: "string",
        enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
        description: "Inferred priority based on urgency cues in the text; default to NORMAL if unclear.",
      },
    },
    required: ["clientName", "taskTitle", "taskDescription", "amount", "dueDate", "priority"],
    additionalProperties: false,
  },
};

export async function parseAgentInput(text: string, todayIso: string): Promise<ParsedAgentInput> {
  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system: `Tu es un assistant qui extrait des informations structurées à partir de notes rapides écrites par un gérant d'agence web. La date du jour est ${todayIso}. Résous les dates relatives ou partielles (ex: "15/09", "dans 2 semaines") par rapport à cette date. Réponds uniquement en appelant l'outil fourni.`,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "extract_task_info" },
    messages: [{ role: "user", content: text }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("L'agent IA n'a pas pu analyser ce texte.");
  }

  return toolUse.input as ParsedAgentInput;
}
