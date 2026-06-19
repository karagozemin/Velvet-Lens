"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  FileJson,
  Gauge,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";

import { Field } from "@/components/Field";
import { Metric } from "@/components/Metric";
import type { StrategyPreview } from "@/types/strategy";
import type {
  NormalizedTokenAnalysis,
  RiskProfile,
  TimeHorizon,
} from "@/types/velvet";

type AnalyzeResponse = {
  analysis: NormalizedTokenAnalysis;
  strategy: StrategyPreview;
};

const examples = [
  "Analyze ETH",
  "Analyze BTC",
  "Analyze a memecoin with high volatility",
  "Long-term DeFi token thesis",
];

const chains = ["auto", "ethereum", "base", "arbitrum", "optimism", "polygon", "solana"];

export default function Home() {
  const [input, setInput] = useState("");
  const [chain, setChain] = useState("auto");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("swing");
  const [capitalSize, setCapitalSize] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasData = useMemo(() => {
    if (!result) return false;
    const analysis = result.analysis;
    return Boolean(
      analysis.token ||
        analysis.symbol ||
        analysis.name ||
        analysis.technicalSummary ||
        analysis.fundamentalSummary ||
        analysis.onchainSummary ||
        analysis.sentimentSummary ||
        analysis.risks?.length,
    );
  }, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input,
          chain,
          riskProfile,
          timeHorizon,
          capitalSize: capitalSize ? Number(capitalSize) : undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      setResult(payload);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to analyze this token right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="terminal-surface min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <Header />

        <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(360px,430px),1fr] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="premium-panel min-w-0 rounded-lg p-5"
          >
            <div className="mb-5 flex items-center gap-3 border-b border-violet-400/10 pb-4">
              <div className="flex size-10 items-center justify-center rounded-md border border-violet-300/15 bg-violet-400/10 text-violet-200 shadow-glow">
                <Search className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-violet-50">Analysis input</h2>
                <p className="text-sm text-violet-200/55">Token, address, or thesis text</p>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Token input">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="ETH, 0x..., or a token thesis"
                  className="min-h-32 w-full resize-y rounded-md border border-violet-400/15 bg-[#0a0712]/80 px-3 py-3 text-sm text-violet-50 placeholder:text-violet-200/25 transition focus:border-violet-300/60 focus:bg-[#100b1d]"
                  required
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Field label="Chain">
                  <select
                    value={chain}
                    onChange={(event) => setChain(event.target.value)}
                    className="h-11 w-full rounded-md border border-violet-400/15 bg-[#0a0712] px-3 text-sm text-violet-50 transition focus:border-violet-300/60"
                  >
                    {chains.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Capital size (optional)">
                  <input
                    value={capitalSize}
                    onChange={(event) => setCapitalSize(event.target.value)}
                    type="number"
                    min="0"
                    inputMode="decimal"
                    placeholder="10000"
                    className="h-11 w-full rounded-md border border-violet-400/15 bg-[#0a0712] px-3 text-sm text-violet-50 placeholder:text-violet-200/25 transition focus:border-violet-300/60"
                  />
                </Field>
              </div>

              <SegmentedControl
                label="Risk profile"
                value={riskProfile}
                options={[
                  ["conservative", "Conservative"],
                  ["balanced", "Balanced"],
                  ["aggressive", "Aggressive"],
                ]}
                onChange={(value) => setRiskProfile(value as RiskProfile)}
              />

              <SegmentedControl
                label="Time horizon"
                value={timeHorizon}
                options={[
                  ["intraday", "Intraday"],
                  ["swing", "Swing"],
                  ["long-term", "Long-term"],
                ]}
                onChange={(value) => setTimeHorizon(value as TimeHorizon)}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-violet-200/20 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-500 px-4 text-sm font-semibold text-white shadow-[0_0_28px_rgba(124,58,237,0.22)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-400 disabled:cursor-not-allowed disabled:border-violet-400/10 disabled:from-[#15101f] disabled:via-[#15101f] disabled:to-[#15101f] disabled:text-violet-200/35"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                Analyze
              </button>
            </div>

            <div className="mt-5 border-t border-violet-400/10 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-violet-200/45">
                Quick starts
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setInput(example)}
                    className="rounded-md border border-violet-400/15 bg-violet-400/[0.03] px-3 py-2 text-left text-xs text-violet-100/70 transition hover:border-violet-300/50 hover:bg-violet-400/10 hover:text-violet-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <section className="premium-panel min-h-[620px] min-w-0 rounded-lg">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} />
            ) : result ? (
              hasData ? <StrategyCard result={result} /> : <NoDataState result={result} />
            ) : (
              <EmptyState />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-5 border-b border-violet-400/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-violet-300/20 bg-[#090611] shadow-glow sm:size-20">
          <Image
            src="/brand/velvet-lens.png"
            alt="Velvet Lens logo"
            fill
            sizes="80px"
            className="object-cover"
            priority
          />
        </div>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-normal text-violet-50 sm:text-4xl">
              Velvet Lens
            </h1>
            <span className="rounded-md border border-violet-300/25 bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-100">
              Strategy lab
            </span>
          </div>
          <p className="text-lg text-violet-100/70">Internal DeFAI analyst cockpit</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-violet-100/60">
        <div className="flex items-center gap-2 rounded-md border border-violet-400/15 bg-violet-400/[0.04] px-3 py-2">
          <Lock className="size-4 text-cyan-200" aria-hidden="true" />
          Velvet API linked
        </div>
        <div className="rounded-md border border-violet-400/15 bg-violet-400/[0.04] px-3 py-2 text-violet-200/70">
          Read-only terminal
        </div>
      </div>
    </header>
  );
}

interface SegmentedControlProps {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}

function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-violet-100/85">{label}</legend>
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] overflow-hidden rounded-md border border-violet-400/15 bg-[#090611]/90">
        {options.map(([optionValue, optionLabel]) => {
          const isSelected = optionValue === value;
          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(optionValue)}
              className={`min-h-11 min-w-0 px-2 text-xs transition sm:text-sm ${
                isSelected
                  ? "bg-violet-500/25 text-violet-50 shadow-[inset_0_0_0_1px_rgba(196,181,253,0.18)]"
                  : "text-violet-200/50 hover:bg-violet-400/10 hover:text-violet-50"
              }`}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[620px] flex-col justify-between p-6">
      <div>
        <div className="mb-5 flex items-center gap-4">
          <div className="relative size-16 overflow-hidden rounded-lg border border-violet-300/15 bg-[#090611]">
            <Image
              src="/brand/velvet-lens.png"
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="flex size-12 items-center justify-center rounded-md border border-violet-300/15 bg-violet-400/10 text-violet-200 shadow-glow">
            <Gauge className="size-6" aria-hidden="true" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-violet-50">Strategy console idle</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100/55">
          Feed a token, contract, or thesis into the lab to turn Velvet intelligence
          into a controlled strategy preview.
        </p>
      </div>
      <div className="grid gap-3 border-t border-violet-400/10 pt-5 sm:grid-cols-2">
        {[
          ["No execution", "No swaps, signatures, or portfolio actions."],
          ["Server-side API", "The Velvet key stays outside the browser."],
          ["Deterministic engine", "Allocation logic uses simple scoring, not an LLM."],
          ["Inspectable output", "Normalized JSON remains available after analysis."],
        ].map(([title, body]) => (
          <div key={title} className="border-l border-violet-400/20 pl-4">
            <p className="font-medium text-violet-50">{title}</p>
            <p className="mt-1 text-sm text-violet-200/42">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[620px] items-center justify-center p-6 text-center">
      <div>
        <Loader2 className="mx-auto size-10 animate-spin text-violet-300" aria-hidden="true" />
        <h2 className="mt-5 text-xl font-semibold text-violet-50">Analyzing token</h2>
        <p className="mt-2 max-w-md text-sm text-violet-100/55">
          Calling Velvet from the server and building the strategy preview.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[620px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md border border-rose-300/20 bg-rose-500/10 text-rose-200">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-violet-50">Analysis unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-violet-100/55">{message}</p>
      </div>
    </div>
  );
}

function NoDataState({ result }: { result: AnalyzeResponse }) {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-start gap-3">
        <AlertTriangle className="mt-1 size-5 text-amber-300" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold text-violet-50">No usable fields found</h2>
          <p className="mt-2 text-sm text-violet-100/55">
            Velvet returned a response, but the normalizer could not identify token
            fields or analysis summaries. Inspect the raw response below.
          </p>
        </div>
      </div>
      <RawJson result={result} />
    </div>
  );
}

function StrategyCard({ result }: { result: AnalyzeResponse }) {
  const { analysis, strategy } = result;
  const summaryItems: Array<[string, string | undefined]> = [
    ["Fundamentals", analysis.fundamentalSummary],
    ["Technicals", analysis.technicalSummary],
    ["Onchain", analysis.onchainSummary],
    ["Sentiment", analysis.sentimentSummary],
  ];

  return (
    <article className="strategy-reveal p-6">
      <div
        className="strategy-section flex flex-col gap-4 border-b border-violet-400/10 pb-5 sm:flex-row sm:items-start sm:justify-between"
        style={{ animationDelay: "90ms" }}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
            Strategy card
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-violet-50">
            {analysis.name ?? analysis.symbol ?? analysis.token ?? "Token preview"}
          </h2>
          <p className="mt-2 text-sm text-violet-100/55">{strategy.disclaimer}</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-violet-400/15 bg-violet-400/[0.04] px-3 py-2 text-sm text-violet-100/75">
          <ShieldCheck className="size-4 text-cyan-200" aria-hidden="true" />
          {strategy.confidenceLabel} confidence
        </div>
      </div>

      <section
        className="strategy-section border-b border-violet-400/10 py-5"
        style={{ animationDelay: "180ms" }}
      >
        <SectionTitle icon={<BarChart3 className="size-4" />} title="Token Snapshot" />
        <div className="mt-2 grid sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Symbol" value={analysis.symbol} muted={!analysis.symbol} />
          <Metric label="Chain" value={analysis.chain} muted={!analysis.chain} />
          <Metric label="Price" value={formatDisplay(analysis.price)} muted={!analysis.price} />
          <Metric
            label="Market cap"
            value={formatDisplay(analysis.marketCap)}
            muted={!analysis.marketCap}
          />
          <Metric
            label="Liquidity"
            value={formatDisplay(analysis.liquidity)}
            muted={!analysis.liquidity}
          />
          <Metric label="Volume" value={formatDisplay(analysis.volume)} muted={!analysis.volume} />
          <Metric
            label="Confidence"
            value={analysis.confidence ? `${Math.round(analysis.confidence * 100)}%` : strategy.confidenceLabel}
          />
          <Metric label="Token" value={analysis.token} muted={!analysis.token} />
        </div>
      </section>

      <section
        className="strategy-section border-b border-violet-400/10 py-5"
        style={{ animationDelay: "270ms" }}
      >
        <SectionTitle icon={<Activity className="size-4" />} title="Velvet Analysis Summary" />
        <div className="mt-4 space-y-3">
          {summaryItems.map(([label, value]) => (
            <SummaryLine key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      <section
        className="strategy-section border-b border-violet-400/10 py-5"
        style={{ animationDelay: "360ms" }}
      >
        <SectionTitle icon={<AlertTriangle className="size-4" />} title="Risk Notes" />
        <div className="mt-4 divide-y divide-violet-400/10">
          {strategy.riskNotes.map((risk) => (
            <div key={risk.label} className="grid gap-2 py-3 sm:grid-cols-[180px,1fr]">
              <p className="font-medium text-violet-50">{risk.label}</p>
              <p className="text-sm leading-6 text-violet-100/55">{risk.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="strategy-section border-b border-violet-400/10 py-5"
        style={{ animationDelay: "450ms" }}
      >
        <SectionTitle icon={<Gauge className="size-4" />} title="Strategy Suggestion" />
        <div className="mt-4 grid gap-5 xl:grid-cols-[220px,1fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-200/45">
              Allocation range
            </p>
            <p className="mt-2 text-3xl font-semibold text-violet-100">
              {strategy.allocationRange}
            </p>
            <p className="mt-3 text-sm leading-6 text-violet-100/55">{strategy.fitRationale}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <BulletList title="Entry logic" items={strategy.entryLogic} />
            <BulletList title="Invalidation" items={strategy.invalidationConditions} />
            <BulletList title="Watch next" items={strategy.watchNext} />
          </div>
        </div>
      </section>

      <section
        className="strategy-section border-b border-violet-400/10 py-5"
        style={{ animationDelay: "540ms" }}
      >
        <SectionTitle icon={<ChevronDown className="size-4" />} title="Possible next step" />
        <p className="mt-3 text-sm leading-6 text-violet-100/55">
          This could later connect to Velvet vault or rebalance flows, but this MVP
          stays read-only.
        </p>
      </section>

      <section className="strategy-section pt-5" style={{ animationDelay: "630ms" }}>
        <SectionTitle icon={<FileJson className="size-4" />} title="Raw API Response" />
        <div className="mt-4">
          <RawJson result={result} />
        </div>
      </section>
    </article>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-violet-50">
      <span className="text-violet-300">{icon}</span>
      {title}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[150px,1fr]">
      <p className="text-sm font-medium text-violet-100/85">{label}</p>
      <p className="text-sm leading-6 text-violet-100/55">{value ?? "Not enough data."}</p>
    </div>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-3 font-medium text-violet-50">{title}</p>
      <ul className="space-y-2 text-sm leading-6 text-violet-100/55">
        {items.map((item) => (
          <li key={item} className="border-l border-violet-400/20 pl-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RawJson({ result }: { result: AnalyzeResponse }) {
  return (
    <details className="rounded-md border border-violet-400/15 bg-[#07050d]/85">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-violet-100/85">
        Inspect normalized JSON
      </summary>
      <pre className="max-h-96 overflow-auto border-t border-violet-400/10 p-4 text-xs leading-5 text-violet-100/55">
        {JSON.stringify(result, null, 2)}
      </pre>
    </details>
  );
}

function formatDisplay(value?: string | number) {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return value;
}
