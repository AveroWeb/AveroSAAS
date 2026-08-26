import { scrapeGraphSearch } from "./client";

export type WebsiteQuality = "none" | "outdated" | "modern" | "unknown";

export type Lead = {
  businessName: string;
  phone: string | null;
  address: string | null;
  hasOwnWebsite: boolean;
  websiteUrl: string | null;
  websiteQuality: WebsiteQuality;
  notes: string | null;
};

type LeadExtraction = Omit<Lead, "notes"> & { notes: string | null };

const LEAD_ITEM_SCHEMA = {
  type: "object",
  properties: {
    businessName: { type: "string" },
    phone: { type: ["string", "null"] },
    address: { type: ["string", "null"] },
    hasOwnWebsite: {
      type: "boolean",
      description: "True if this business has its own dedicated website (not just a directory or social media listing).",
    },
    websiteUrl: { type: ["string", "null"] },
    websiteQuality: {
      type: "string",
      enum: ["none", "outdated", "modern", "unknown"],
      description: "'none' if no own website found, 'outdated' if the site looks dated/unmaintained/non-responsive, 'modern' if it looks professional and current, 'unknown' if quality can't be judged from the fetched content.",
    },
    notes: { type: ["string", "null"], description: "One short sentence in French explaining the assessment." },
  },
  required: ["businessName", "phone", "address", "hasOwnWebsite", "websiteUrl", "websiteQuality", "notes"],
};

const SCHEMA = {
  type: "object",
  properties: {
    businesses: { type: "array", items: LEAD_ITEM_SCHEMA },
  },
  required: ["businesses"],
};

function buildPrompt(query: string) {
  return (
    `Analyse tout le contenu reçu (résultats de recherche pour "${query}") et identifie CHAQUE entreprise locale ` +
    "distincte mentionnée qui correspond à la recherche (ignore les articles génériques ou pages sans rapport). " +
    "Pour chacune, extrait : nom, téléphone, adresse si visibles. Indique si elle a son propre site web dédié " +
    "(hasOwnWebsite) et son URL. Évalue la qualité de ce site (websiteQuality) : 'outdated' si le design semble " +
    "ancien, non responsive ou mal entretenu ; 'modern' si le design est actuel et professionnel ; 'unknown' si tu " +
    "ne peux pas juger à partir du contenu ; 'none' si l'entreprise n'a pas de site propre (seulement une fiche " +
    "annuaire ou réseau social). Déduplique par nom. Résume en une phrase en français dans 'notes' pourquoi. " +
    "Retourne toutes les entreprises trouvées dans le champ 'businesses'."
  );
}

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function scoreLead(lead: Lead) {
  let score = 0;
  if (lead.phone) score += 1;
  if (lead.address) score += 1;
  if (lead.hasOwnWebsite && lead.websiteUrl) score += 1;
  if (lead.websiteQuality !== "unknown") score += 1;
  return score;
}

export async function searchLeads(query: string, numResults = 8): Promise<Lead[]> {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("Décris d'abord ce que tu recherches.");

  const response = await scrapeGraphSearch({
    query: trimmed,
    numResults,
    prompt: buildPrompt(trimmed),
    schema: SCHEMA,
  });

  const extracted = (response.json as { businesses?: LeadExtraction[] } | undefined)?.businesses ?? [];

  const byName = new Map<string, Lead>();
  for (const item of extracted) {
    if (!item.businessName) continue;
    const lead: Lead = {
      businessName: item.businessName,
      phone: item.phone,
      address: item.address,
      hasOwnWebsite: item.hasOwnWebsite,
      websiteUrl: item.websiteUrl,
      websiteQuality: item.websiteQuality ?? "unknown",
      notes: item.notes,
    };
    const key = normalizeName(lead.businessName);
    const existing = byName.get(key);
    if (!existing || scoreLead(lead) > scoreLead(existing)) {
      byName.set(key, lead);
    }
  }

  return Array.from(byName.values());
}
