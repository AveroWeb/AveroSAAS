"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchLeadsAction, importLeadsAction, type LeadPreview } from "./actions";

const QUALITY_LABELS: Record<LeadPreview["websiteQuality"], { label: string; variant: "destructive" | "outline" | "secondary" | "default" }> = {
  none: { label: "Pas de site", variant: "destructive" },
  outdated: { label: "Site daté", variant: "destructive" },
  modern: { label: "Site moderne", variant: "secondary" },
  unknown: { label: "Qualité inconnue", variant: "outline" },
};

export function ProspectionPanel() {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<LeadPreview[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | undefined>();
  const [isSearching, startSearching] = useTransition();
  const [isImporting, startImporting] = useTransition();

  function handleSearch() {
    if (!query.trim() || isSearching) return;
    setError(undefined);
    startSearching(async () => {
      try {
        const result = await searchLeadsAction(query);
        setLeads(result);
        setSelected(new Set(result.map((_, i) => i).filter((i) => !result[i].existingClientId)));
        if (result.length === 0) {
          toast.info("Aucune entreprise trouvée pour cette recherche.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleImport() {
    if (!leads || selected.size === 0 || isImporting) return;
    setError(undefined);
    startImporting(async () => {
      try {
        const toImport = leads.filter((_, i) => selected.has(i));
        const result = await importLeadsAction(toImport);
        toast.success(`${result.imported} prospect${result.imported > 1 ? "s" : ""} importé${result.imported > 1 ? "s" : ""}.`);
        setLeads(null);
        setSelected(new Set());
        setQuery("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Ex : électricien Millau"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button onClick={handleSearch} disabled={!query.trim() || isSearching}>
          {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {isSearching ? "Recherche…" : "Rechercher"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {leads && leads.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            {leads.map((lead, index) => {
              const quality = QUALITY_LABELS[lead.websiteQuality];
              return (
                <label
                  key={`${lead.businessName}-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 has-[:disabled]:opacity-50"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={selected.has(index)}
                    disabled={!!lead.existingClientId}
                    onChange={() => toggle(index)}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{lead.businessName}</span>
                      <Badge variant={quality.variant}>{quality.label}</Badge>
                      {lead.existingClientId && <Badge variant="outline">Déjà client</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {[lead.phone, lead.address].filter(Boolean).join(" · ") || "Coordonnées non trouvées"}
                    </div>
                    {lead.notes && <p className="text-sm text-muted-foreground">{lead.notes}</p>}
                  </div>
                </label>
              );
            })}

            <Button onClick={handleImport} disabled={selected.size === 0 || isImporting}>
              {isImporting ? "Import…" : `Importer la sélection (${selected.size})`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
