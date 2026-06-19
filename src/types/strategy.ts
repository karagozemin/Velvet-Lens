import type { RiskProfile, TimeHorizon } from "./velvet";

export interface StrategyPreview {
  riskProfile: RiskProfile;
  timeHorizon: TimeHorizon;
  confidenceLabel: "Low" | "Medium" | "High";
  allocationRange: string;
  entryLogic: string[];
  invalidationConditions: string[];
  watchNext: string[];
  fitRationale: string;
  riskNotes: StrategyRiskNote[];
  disclaimer: string;
}

export interface StrategyRiskNote {
  label: string;
  status: "available" | "limited" | "not-enough-data";
  detail: string;
}
