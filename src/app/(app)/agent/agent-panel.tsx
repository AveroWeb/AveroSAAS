"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromptInput, PromptInputActions, PromptInputTextarea } from "@/components/ui/prompt-input";
import { parseAgentTextAction, confirmAgentAction, type AgentPreview } from "./actions";

const PRIORITY_ITEMS = [
  { value: "LOW", label: "Faible" },
  { value: "NORMAL", label: "Normale" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

const NEW_CLIENT_VALUE = "__new__";

export function AgentPanel({ clients }: { clients: { id: string; companyName: string }[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<AgentPreview | null>(null);
  const [clientOption, setClientOption] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [error, setError] = useState<string | undefined>();
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [isConfirming, startConfirming] = useTransition();

  const clientItems = [
    { value: NEW_CLIENT_VALUE, label: "+ Nouveau client" },
    ...clients.map((c) => ({ value: c.id, label: c.companyName })),
  ];

  function handleAnalyze() {
    if (!note.trim() || isAnalyzing) return;
    setError(undefined);
    startAnalyzing(async () => {
      try {
        const result = await parseAgentTextAction(note);
        setPreview(result);
        setClientOption(result.suggestedClientId ?? NEW_CLIENT_VALUE);
        setClientName(result.clientName);
        setTaskTitle(result.taskTitle);
        setTaskDescription(result.taskDescription ?? "");
        setAmount(result.amount ?? "");
        setDueDate(result.dueDate ?? "");
        setPriority(result.priority);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function handleConfirm() {
    setError(undefined);
    startConfirming(async () => {
      try {
        const formData = new FormData();
        if (clientOption && clientOption !== NEW_CLIENT_VALUE) {
          formData.set("clientId", clientOption);
        } else {
          formData.set("newClientName", clientName);
        }
        formData.set("taskTitle", taskTitle);
        formData.set("taskDescription", taskDescription);
        formData.set("amount", amount);
        formData.set("dueDate", dueDate);
        formData.set("priority", priority);

        const result = await confirmAgentAction(formData);
        toast.success("Client et tâche enregistrés.");
        setNote("");
        setPreview(null);
        router.push(`/clients/${result.clientId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <PromptInput
        isLoading={isAnalyzing}
        value={note}
        onValueChange={setNote}
        onSubmit={handleAnalyze}
        className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
      >
        <div className="flex flex-col">
          <PromptInputTextarea
            placeholder="Ex : J'ai fait un site pour Jean Dupont, vendu 800€, doit être prêt le 15/09/2026"
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
          />
          <PromptInputActions className="mt-5 flex w-full items-center justify-end gap-2 px-3 pb-3">
            <Button
              size="icon"
              disabled={!note.trim() || isAnalyzing}
              onClick={handleAnalyze}
              className="size-9 rounded-full"
            >
              {!isAnalyzing ? (
                <ArrowUp size={18} />
              ) : (
                <span className="size-3 rounded-xs bg-white" />
              )}
            </Button>
          </PromptInputActions>
        </div>
      </PromptInput>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Vérifie avant d&apos;enregistrer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-client">Client</Label>
              <Select name="client" items={clientItems} value={clientOption} onValueChange={(v) => setClientOption(v as string)}>
                <SelectTrigger id="agent-client" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {clientOption === NEW_CLIENT_VALUE && (
              <div className="space-y-2">
                <Label htmlFor="agent-client-name">Nom du nouveau client</Label>
                <Input id="agent-client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="agent-title">Titre de la tâche</Label>
              <Input id="agent-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-description">Description</Label>
              <Textarea id="agent-description" rows={3} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="agent-amount">Montant</Label>
                <Input id="agent-amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="800€" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-due-date">Échéance</Label>
                <Input id="agent-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-priority">Priorité</Label>
                <Select name="priority" items={PRIORITY_ITEMS} value={priority} onValueChange={(v) => setPriority(v as string)}>
                  <SelectTrigger id="agent-priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? "Enregistrement…" : "Confirmer et enregistrer"}
            </Button>
          </CardContent>
        </Card>
      )}
      {error && !preview && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
