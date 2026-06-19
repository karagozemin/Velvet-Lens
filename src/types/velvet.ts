export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type TimeHorizon = "intraday" | "swing" | "long-term";

export interface AnalyzeRequest {
  input: string;
  chain?: string;
  riskProfile: RiskProfile;
  timeHorizon: TimeHorizon;
  capitalSize?: number;
}

export interface NormalizedTokenAnalysis {
  token?: string;
  symbol?: string;
  name?: string;
  chain?: string;
  price?: number | string;
  marketCap?: number | string;
  liquidity?: number | string;
  volume?: number | string;
  technicalSummary?: string;
  fundamentalSummary?: string;
  onchainSummary?: string;
  sentimentSummary?: string;
  risks?: string[];
  confidence?: number;
  raw: unknown;
}
