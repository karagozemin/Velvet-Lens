import type { StrategyPreview, StrategyRiskNote } from "@/types/strategy";
import type {
  AnalyzeRequest,
  NormalizedTokenAnalysis,
  RiskProfile,
  TimeHorizon,
} from "@/types/velvet";

export function buildStrategyPreview(
  analysis: NormalizedTokenAnalysis,
  request: AnalyzeRequest,
): StrategyPreview {
  const confidence = analysis.confidence ?? inferConfidenceFromCompleteness(analysis);
  const confidenceLabel = labelConfidence(confidence);
  const dataPenalty = missingRiskDataPenalty(analysis);
  const allocationRange = allocationFor(
    request.riskProfile,
    confidence,
    dataPenalty,
  );

  return {
    riskProfile: request.riskProfile,
    timeHorizon: request.timeHorizon,
    confidenceLabel,
    allocationRange,
    entryLogic: entryLogicFor(request.timeHorizon, analysis),
    invalidationConditions: invalidationFor(request.timeHorizon, analysis),
    watchNext: watchNextFor(request.timeHorizon, analysis),
    fitRationale: fitRationaleFor(request.riskProfile, request.timeHorizon, confidenceLabel),
    riskNotes: buildRiskNotes(analysis),
    disclaimer:
      "Read-only strategy preview for research. This is not financial advice and does not execute trades.",
  };
}

function allocationFor(
  riskProfile: RiskProfile,
  confidence: number,
  dataPenalty: number,
): string {
  const adjusted = Math.max(0, confidence - dataPenalty);

  if (riskProfile === "conservative") {
    if (adjusted >= 0.75) return "2-4%";
    if (adjusted >= 0.5) return "1-3%";
    return "0-1%";
  }

  if (riskProfile === "balanced") {
    if (adjusted >= 0.75) return "4-7%";
    if (adjusted >= 0.5) return "3-5%";
    return "1-2%";
  }

  if (adjusted >= 0.8) return "7-12%";
  if (adjusted >= 0.6) return "5-8%";
  if (adjusted >= 0.4) return "2-4%";
  return "1-2%";
}

function entryLogicFor(
  timeHorizon: TimeHorizon,
  analysis: NormalizedTokenAnalysis,
): string[] {
  if (timeHorizon === "intraday") {
    return [
      analysis.technicalSummary
        ? "Use the technical read as the primary entry filter; avoid chasing if momentum is already extended."
        : "Wait for clearer short-term momentum data before treating this as an intraday setup.",
      analysis.volume
        ? "Confirm that volume remains supportive before any simulated allocation."
        : "Treat missing volume data as a reason to keep sizing small.",
    ];
  }

  if (timeHorizon === "swing") {
    return [
      "Prefer staged entries after the thesis and market structure align for more than one session.",
      analysis.sentimentSummary
        ? "Use sentiment as confirmation, not as the sole trigger."
        : "Do not rely on sentiment until better social or narrative data is available.",
    ];
  }

  return [
    analysis.fundamentalSummary
      ? "Anchor the preview around fundamentals and durability of demand."
      : "Delay larger sizing until fundamental data is clearer.",
    analysis.onchainSummary
      ? "Look for onchain participation that supports a longer holding period."
      : "Require stronger onchain evidence before increasing conviction.",
  ];
}

function invalidationFor(
  timeHorizon: TimeHorizon,
  analysis: NormalizedTokenAnalysis,
): string[] {
  const shared = [
    "Material negative update in the normalized Velvet analysis.",
    "Liquidity deteriorates or becomes too thin for the intended allocation.",
  ];

  if (timeHorizon === "intraday") {
    return [
      "Momentum fades while volatility remains elevated.",
      "Price action rejects the intended entry zone.",
      ...shared,
    ];
  }

  if (timeHorizon === "swing") {
    return [
      "The narrative weakens before follow-through appears.",
      "Market structure breaks against the preview thesis.",
      ...shared,
    ];
  }

  return [
    analysis.fundamentalSummary
      ? "Core fundamentals no longer support the thesis."
      : "Fundamental data remains unavailable after further research.",
    "Onchain usage or holder quality weakens over multiple observations.",
    ...shared,
  ];
}

function watchNextFor(
  timeHorizon: TimeHorizon,
  analysis: NormalizedTokenAnalysis,
): string[] {
  const items = [
    analysis.liquidity ? "Liquidity depth and stability." : "Liquidity data, currently missing.",
    analysis.volume ? "Volume follow-through." : "Volume data, currently missing.",
  ];

  if (timeHorizon === "intraday") {
    return ["Momentum shifts and volatility spikes.", ...items];
  }

  if (timeHorizon === "swing") {
    return ["Narrative strength over the next few sessions.", ...items];
  }

  return ["Fundamental updates and onchain adoption.", ...items];
}

function fitRationaleFor(
  riskProfile: RiskProfile,
  timeHorizon: TimeHorizon,
  confidenceLabel: StrategyPreview["confidenceLabel"],
): string {
  const profileText = {
    conservative: "keeps sizing restrained and prioritizes data quality",
    balanced: "allows moderate exposure while still reducing size when data is incomplete",
    aggressive: "permits a wider range only when confidence is strong",
  }[riskProfile];

  const horizonText = {
    intraday: "short-term momentum and volatility",
    swing: "multi-session confirmation",
    "long-term": "fundamentals, narrative durability, and onchain support",
  }[timeHorizon];

  return `This preview ${profileText}. It is tuned for ${horizonText}, with current confidence marked ${confidenceLabel.toLowerCase()}.`;
}

function buildRiskNotes(analysis: NormalizedTokenAnalysis): StrategyRiskNote[] {
  return [
    {
      label: "Smart contract risk",
      status: analysis.risks?.some((risk) => /contract|audit|exploit/i.test(risk))
        ? "available"
        : "not-enough-data",
      detail: matchingRisk(analysis, /contract|audit|exploit/i) ?? "Not enough data.",
    },
    {
      label: "Liquidity risk",
      status: analysis.liquidity ? "available" : "not-enough-data",
      detail: analysis.liquidity
        ? `Liquidity observed: ${formatValue(analysis.liquidity)}.`
        : "Not enough data.",
    },
    {
      label: "Volatility risk",
      status: analysis.technicalSummary || analysis.volume ? "limited" : "not-enough-data",
      detail:
        matchingRisk(analysis, /volatility|volatile|drawdown/i) ??
        (analysis.technicalSummary
          ? "Technical context is available, but explicit volatility data is limited."
          : "Not enough data."),
    },
    {
      label: "Narrative risk",
      status: analysis.sentimentSummary || analysis.fundamentalSummary ? "limited" : "not-enough-data",
      detail:
        matchingRisk(analysis, /narrative|sentiment|social/i) ??
        (analysis.sentimentSummary ?? analysis.fundamentalSummary ?? "Not enough data."),
    },
    {
      label: "Execution risk",
      status: analysis.liquidity || analysis.volume ? "limited" : "not-enough-data",
      detail:
        analysis.liquidity || analysis.volume
          ? "Execution is not available in this MVP; liquidity and volume still matter for any future flow."
          : "Not enough data.",
    },
  ];
}

function inferConfidenceFromCompleteness(analysis: NormalizedTokenAnalysis): number {
  const fields = [
    analysis.price,
    analysis.marketCap,
    analysis.liquidity,
    analysis.volume,
    analysis.technicalSummary,
    analysis.fundamentalSummary,
    analysis.onchainSummary,
    analysis.sentimentSummary,
  ];

  const present = fields.filter(Boolean).length;
  return Math.min(0.75, 0.25 + present * 0.07);
}

function missingRiskDataPenalty(analysis: NormalizedTokenAnalysis): number {
  const missing = [analysis.liquidity, analysis.volume, analysis.risks].filter(
    (item) => !item,
  ).length;

  return missing * 0.08;
}

function labelConfidence(confidence: number): StrategyPreview["confidenceLabel"] {
  if (confidence >= 0.72) return "High";
  if (confidence >= 0.45) return "Medium";
  return "Low";
}

function matchingRisk(
  analysis: NormalizedTokenAnalysis,
  pattern: RegExp,
): string | undefined {
  return analysis.risks?.find((risk) => pattern.test(risk));
}

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return value;
}
