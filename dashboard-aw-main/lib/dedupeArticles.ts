// dedupeArticles.ts

export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  category: string;
  sentiment?: string;
  sentiment_score?: number;
};

const TRACKING_PARAMS = new Set([
  "utm_source","utm_medium","utm_campaign","utm_term","utm_content",
  "gclid","gbraid","wbraid","fbclid","mc_cid","mc_eid","msclkid"
]);

function canonicalizeUrl(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    for (const p of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(p.toLowerCase())) u.searchParams.delete(p);
    }
    let pathname = u.pathname.replace(/\/+/g, "/");
    if (pathname !== "/" && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
    const qs = u.searchParams.toString();
    return `${u.protocol}//${host}${pathname}${qs ? `?${qs}` : ""}`;
  } catch {
    return null;
  }
}

function normalizeTitle(raw: string, sourceName?: string | null): string {
  let t = raw.normalize("NFKC").toLowerCase();
  if (sourceName && sourceName.trim()) {
    const s = sourceName.toLowerCase().trim().replace(/[^\w\s]/g, "");
    t = t.replace(new RegExp(`\\s*(\\||-|—|–)\\s*${s}$`), "");
  }
  t = t.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  return t;
}

function parseDate(d?: string | Date | null): number {
  if (!d) return 0;
  if (d instanceof Date) return d.getTime() || 0;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

function chooseBetter(a: NewsArticle, b: NewsArticle): NewsArticle {
  const aTime = parseDate(a.publishedAt);
  const bTime = parseDate(b.publishedAt);
  if (aTime !== bTime) return aTime > bTime ? a : b;

  // Score based on available fields
  const score = (x: NewsArticle) =>
    (x.summary ? 1 : 0) +
    (x.sentiment ? 1 : 0) +
    (x.category ? 1 : 0);

  const sa = score(a), sb = score(b);
  if (sa !== sb) return sa > sb ? a : b;

  const aUrl = canonicalizeUrl(a.url) || "";
  const bUrl = canonicalizeUrl(b.url) || "";
  if (aUrl && bUrl && aUrl !== bUrl) return aUrl.length <= bUrl.length ? a : b;

  return a;
}

/**
 * Dedupe pipeline:
 * 1) Merge by canonical URL (strict).
 * 2) Merge by normalized title within a time window (default 48h).
 *    This avoids collapsing same-headline stories months apart.
 */
export function dedupeArticles(
  articles: NewsArticle[],
  opts?: { titleWindowHours?: number }
): NewsArticle[] {
  const windowMs = Math.max(1, (opts?.titleWindowHours ?? 48)) * 3600 * 1000;

  // 1) URL-level merge
  const byUrl = new Map<string, NewsArticle>();
  const leftovers: NewsArticle[] = [];
  for (const art of articles) {
    const k = canonicalizeUrl(art.url);
    if (k) {
      const prev = byUrl.get(k);
      byUrl.set(k, prev ? chooseBetter(prev, art) : art);
    } else {
      leftovers.push(art);
    }
  }
  const stage1 = [...byUrl.values(), ...leftovers];

  // 2) Title+window merge
  const buckets = new Map<string, NewsArticle[]>();
  for (const art of stage1) {
    const key = normalizeTitle(art.title, art.source || undefined);
    if (!key) continue;
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(art);
  }

  const out: NewsArticle[] = [];
  for (const group of buckets.values()) {
    group.sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt));
    const kept: NewsArticle[] = [];
    for (const art of group) {
      const t = parseDate(art.publishedAt);
      let merged = false;
      for (let i = 0; i < kept.length; i++) {
        const t2 = parseDate(kept[i].publishedAt);
        if (Math.abs(t - t2) <= windowMs) {
          kept[i] = chooseBetter(kept[i], art);
          merged = true;
          break;
        }
      }
      if (!merged) kept.push(art);
    }
    out.push(...kept);
  }

  return out;
}
