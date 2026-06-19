import type { NormalizedTokenAnalysis } from "@/types/velvet";

type RecordLike = Record<string, unknown>;

const FIELD_ALIASES = {
  token: ["token", "tokenAddress", "address", "contractAddress"],
  symbol: ["symbol", "ticker", "tokenSymbol"],
  name: ["name", "tokenName"],
  chain: ["chain", "network", "blockchain"],
  price: ["price", "currentPrice", "priceUsd", "usdPrice"],
  marketCap: ["marketCap", "market_cap", "fdv", "fullyDilutedValuation"],
  liquidity: ["liquidity", "liquidityUsd", "totalLiquidity"],
  volume: ["volume", "volume24h", "dailyVolume", "volumeUsd"],
  technicalSummary: ["technicalSummary", "technicals", "technical_analysis"],
  fundamentalSummary: ["fundamentalSummary", "fundamentals", "fundamental_analysis"],
  onchainSummary: ["onchainSummary", "onchain", "on_chain", "onchain_analysis"],
  sentimentSummary: ["sentimentSummary", "sentiment", "socialSentiment"],
  risks: ["risks", "risk", "riskFactors", "risk_notes"],
  confidence: ["confidence", "confidenceScore", "score", "rating"],
} as const;

export function normalizeVelvetTokenAnalysis(raw: unknown): NormalizedTokenAnalysis {
  const candidates = collectObjects(raw);
  const answer = readSummary(candidates, ["answer", "message", "response"]);
  const answerSections = parseAnswerSections(answer);
  const securitySection = findSection(answerSections, ["security", "risk"]);
  const marketSection = findSection(answerSections, ["market", "liquidity"]);
  const technicalSection = findSection(answerSections, ["technical", "momentum"]);
  const projectSection = findSection(answerSections, ["project", "context", "fundamental"]);

  return {
    token: readString(candidates, FIELD_ALIASES.token),
    symbol: readString(candidates, FIELD_ALIASES.symbol),
    name: readString(candidates, FIELD_ALIASES.name),
    chain: readString(candidates, FIELD_ALIASES.chain),
    price: readStringOrNumber(candidates, FIELD_ALIASES.price),
    marketCap:
      readStringOrNumber(candidates, FIELD_ALIASES.marketCap) ??
      extractMetric(
        answer,
        /market cap(?:italization)?(?:\s+(?:of|near|around))?\s+((?:roughly\s+|approximately\s+|around\s+)?[~≈]?[$]?\d[\w$.,\s]*)/i,
      ),
    liquidity:
      readStringOrNumber(candidates, FIELD_ALIASES.liquidity) ??
      extractMetric(
        answer,
        /liquidity\s+of\s+((?:roughly\s+|approximately\s+|around\s+)?[~≈]?[$]?\d[\w$.,\s]*)/i,
      ),
    volume:
      readStringOrNumber(candidates, FIELD_ALIASES.volume) ??
      extractMetric(
        answer,
        /(?:24\s*h|24h|daily)\s+volume(?:\s+of)?\s+((?:roughly\s+|approximately\s+|around\s+)?[~≈]?[$]?\d[\w$.,\s]*)/i,
      ),
    technicalSummary:
      readSummary(candidates, FIELD_ALIASES.technicalSummary) ??
      technicalSection ??
      extractSentence(answer, /technical|momentum|rsi|macd|support|resistance/i),
    fundamentalSummary:
      readSummary(candidates, FIELD_ALIASES.fundamentalSummary) ??
      projectSection ??
      answer,
    onchainSummary:
      readSummary(candidates, FIELD_ALIASES.onchainSummary) ?? marketSection,
    sentimentSummary:
      readSummary(candidates, FIELD_ALIASES.sentimentSummary) ??
      extractSentence(answer, /sentiment|social|news/i),
    risks: readRisks(candidates, FIELD_ALIASES.risks) ?? sectionToRisks(securitySection),
    confidence: readConfidence(candidates, FIELD_ALIASES.confidence),
    raw,
  };
}

function collectObjects(value: unknown): RecordLike[] {
  const objects: RecordLike[] = [];
  const seen = new Set<unknown>();

  function visit(node: unknown, depth: number) {
    if (depth > 4 || !isRecord(node) || seen.has(node)) {
      return;
    }

    seen.add(node);
    objects.push(node);

    for (const key of ["data", "result", "analysis", "token", "tokenData", "payload"]) {
      visit(node[key], depth + 1);
    }
  }

  visit(value, 0);
  return objects;
}

function isRecord(value: unknown): value is RecordLike {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  objects: RecordLike[],
  aliases: readonly string[],
): string | undefined {
  for (const object of objects) {
    for (const alias of aliases) {
      const value = object[alias];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }
  return undefined;
}

function readStringOrNumber(
  objects: RecordLike[],
  aliases: readonly string[],
): string | number | undefined {
  for (const object of objects) {
    for (const alias of aliases) {
      const value = object[alias];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }
  return undefined;
}

function readSummary(
  objects: RecordLike[],
  aliases: readonly string[],
): string | undefined {
  for (const object of objects) {
    for (const alias of aliases) {
      const value = object[alias];
      const summary = stringifySummary(value);
      if (summary) {
        return summary;
      }
    }
  }
  return undefined;
}

function stringifySummary(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => stringifySummary(item))
      .filter(Boolean)
      .slice(0, 4);

    return items.length ? items.join(" ") : undefined;
  }

  if (isRecord(value)) {
    for (const key of ["summary", "description", "analysis", "text", "note"]) {
      const summary = stringifySummary(value[key]);
      if (summary) {
        return summary;
      }
    }

    const pairs = Object.entries(value)
      .filter(([, item]) => typeof item === "string" || typeof item === "number")
      .slice(0, 4)
      .map(([key, item]) => `${humanizeKey(key)}: ${String(item)}`);

    return pairs.length ? pairs.join("; ") : undefined;
  }

  return undefined;
}

function readRisks(
  objects: RecordLike[],
  aliases: readonly string[],
): string[] | undefined {
  for (const object of objects) {
    for (const alias of aliases) {
      const value = object[alias];
      if (Array.isArray(value)) {
        const risks = value
          .map((item) => stringifySummary(item))
          .filter((item): item is string => Boolean(item))
          .slice(0, 8);
        if (risks.length) {
          return risks;
        }
      }

      const risk = stringifySummary(value);
      if (risk) {
        return [risk];
      }
    }
  }
  return undefined;
}

function readConfidence(
  objects: RecordLike[],
  aliases: readonly string[],
): number | undefined {
  const value = readStringOrNumber(objects, aliases);

  if (typeof value === "number") {
    return clampConfidence(value);
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "high") return 0.82;
    if (normalized === "medium" || normalized === "moderate") return 0.58;
    if (normalized === "low") return 0.32;

    const parsed = Number.parseFloat(normalized.replace("%", ""));
    if (Number.isFinite(parsed)) {
      return clampConfidence(parsed);
    }
  }

  return undefined;
}

function clampConfidence(value: number): number {
  const normalized = value > 1 ? value / 100 : value;
  return Math.min(1, Math.max(0, normalized));
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function parseAnswerSections(answer?: string): Array<{ title: string; body: string }> {
  if (!answer) {
    return [];
  }

  const sections: Array<{ title: string; body: string }> = [];
  const headingPattern = /^#{1,3}\s*(?:\d+\.\s*)?(.+?)\s*$/gm;
  const matches = [...answer.matchAll(headingPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const next = matches[index + 1];
    const title = cleanMarkdown(match[1]);
    const start = (match.index ?? 0) + match[0].length;
    const end = next?.index ?? answer.length;
    const body = cleanMarkdown(answer.slice(start, end));

    if (title && body) {
      sections.push({ title, body });
    }
  }

  return sections;
}

function findSection(
  sections: Array<{ title: string; body: string }>,
  keywords: string[],
): string | undefined {
  const section = sections.find((item) =>
    keywords.some((keyword) => item.title.toLowerCase().includes(keyword)),
  );

  return section?.body;
}

function sectionToRisks(section?: string): string[] | undefined {
  if (!section) {
    return undefined;
  }

  const sentences = section
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  return sentences.length ? sentences : [section];
}

function extractMetric(answer: string | undefined, pattern: RegExp): string | undefined {
  const match = answer?.match(pattern);
  if (!match?.[1]) {
    return undefined;
  }

  return cleanMarkdown(match[1])
    .replace(/\s+(against|versus|relative|reflects|shows|is|indicates|while|and).*$/i, "")
    .trim();
}

function extractSentence(answer: string | undefined, pattern: RegExp): string | undefined {
  const sentence = answer
    ?.split(/(?<=[.!?])\s+/)
    .map((item) => cleanMarkdown(item))
    .find((item) => pattern.test(item));

  return sentence || undefined;
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\u202f/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
