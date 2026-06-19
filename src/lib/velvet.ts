import type { AnalyzeRequest } from "@/types/velvet";

const DEFAULT_VELVET_URL = "https://vu.velvetdao.xyz/agent-api/v1/token";
const REQUEST_TIMEOUT_MS = 45000;

export class VelvetApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "VelvetApiError";
  }
}

export async function fetchVelvetTokenAnalysis(
  request: AnalyzeRequest,
): Promise<unknown> {
  const apiKey = process.env.VELVET_API_KEY;
  const url = process.env.VELVET_TOKEN_ANALYSIS_URL ?? DEFAULT_VELVET_URL;

  if (!apiKey) {
    throw new VelvetApiError(
      "Velvet API key is not configured. Add VELVET_API_KEY to your environment.",
      500,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
        // Velvet currently accepts Bearer auth and X-API-Key. Keep both here
        // so the adapter is tolerant if one gateway path is used over another.
      },
      body: JSON.stringify({
        token: request.input,
        // Token endpoint auto-detects chain. If Velvet later adds an explicit
        // chain field for this route, add it here.
      }),
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new VelvetApiError(
        `Velvet API returned ${response.status}.`,
        response.status,
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof VelvetApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new VelvetApiError("Velvet API request timed out.", 504);
    }

    throw new VelvetApiError("Unable to reach Velvet API.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
