const BASE_URL = "https://v2-api.scrapegraphai.com";

export type ScrapeGraphSearchResult = {
  url: string;
  title: string;
  content: string;
};

export type ScrapeGraphSearchResponse = {
  id: string;
  results: ScrapeGraphSearchResult[];
  /** Present when `prompt`/`schema` are passed — extraction combined across all fetched results. */
  json?: Record<string, unknown>;
  raw?: string | null;
};

export async function scrapeGraphSearch(body: {
  query: string;
  numResults?: number;
  prompt?: string;
  schema?: Record<string, unknown>;
  locationGeoCode?: string;
}): Promise<ScrapeGraphSearchResponse> {
  const apiKey = process.env.SCRAPEGRAPH_API_KEY;
  if (!apiKey) throw new Error("SCRAPEGRAPH_API_KEY n'est pas configurée.");

  const response = await fetch(`${BASE_URL}/api/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "SGAI-APIKEY": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ScrapeGraphAI a renvoyé une erreur (${response.status}) : ${text || response.statusText}`);
  }

  return response.json();
}
