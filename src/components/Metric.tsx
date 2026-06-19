import { clsx } from "clsx";

interface MetricProps {
  label: string;
  value?: string | number;
  muted?: boolean;
}

export function Metric({ label, value, muted }: MetricProps) {
  return (
    <div className="min-h-20 border-b border-violet-400/10 py-4 sm:border-b-0 sm:border-r sm:px-4 first:sm:pl-0 last:border-b-0 last:sm:border-r-0">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-200/45">
        {label}
      </p>
      <p
        className={clsx(
          "mt-2 break-words text-base font-semibold text-violet-50",
          muted && "text-violet-200/35",
        )}
      >
        {value ?? "Not enough data"}
      </p>
    </div>
  );
}
