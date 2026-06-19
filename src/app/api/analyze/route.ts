import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchVelvetTokenAnalysis, VelvetApiError } from "@/lib/velvet";
import { normalizeVelvetTokenAnalysis } from "@/lib/normalize";
import { buildStrategyPreview } from "@/lib/strategy";

const AnalyzeSchema = z.object({
  input: z.string().trim().min(2, "Enter a token, contract address, or thesis."),
  chain: z.string().trim().optional().default("auto"),
  riskProfile: z.enum(["conservative", "balanced", "aggressive"]),
  timeHorizon: z.enum(["intraday", "swing", "long-term"]),
  capitalSize: z.coerce.number().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = AnalyzeSchema.parse(json);
    const raw = await fetchVelvetTokenAnalysis(payload);
    const normalized = normalizeVelvetTokenAnalysis(raw);
    const analysis = {
      ...normalized,
      token: normalized.token ?? payload.input,
      chain:
        normalized.chain ??
        (payload.chain && payload.chain !== "auto" ? payload.chain : undefined),
    };
    const strategy = buildStrategyPreview(analysis, payload);

    return NextResponse.json({ analysis, strategy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid analysis request.",
          details: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    if (error instanceof VelvetApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    }

    return NextResponse.json(
      { error: "Unable to analyze this token right now." },
      { status: 500 },
    );
  }
}
