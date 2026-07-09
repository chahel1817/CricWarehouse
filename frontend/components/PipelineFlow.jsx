/**
 * PipelineFlow — visual representation of the Medallion Architecture pipeline.
 * RAW DATA → BRONZE → SILVER → GOLD → INSIGHTS
 * Uses minimal dots, arrows, lines, and editorial typography.
 */

const steps = [
  { label: "Raw Data", abbr: "RAW",    color: "bg-ink/10",       dot: "bg-ink/30",     accent: "text-ink/50" },
  { label: "Bronze",   abbr: "BRONZE", color: "bg-bronze/15",    dot: "bg-bronze",     accent: "text-bronze" },
  { label: "Silver",   abbr: "SILVER", color: "bg-silver/15",    dot: "bg-silver",     accent: "text-silver" },
  { label: "Gold",     abbr: "GOLD",   color: "bg-gold/15",      dot: "bg-gold",       accent: "text-gold" },
  { label: "Insights", abbr: "INSIGHTS",color: "bg-wicket/10",   dot: "bg-wicket",     accent: "text-wicket" },
];

export default function PipelineFlow() {
  return (
    <div
      id="pipeline"
      className="reveal reveal-d5 flex flex-wrap items-center gap-0"
      aria-label="Medallion Architecture Pipeline: Raw Data → Bronze → Silver → Gold → Insights"
    >
      {steps.map((step, i) => (
        <div key={step.abbr} className="flex items-center">
          {/* Step pill */}
          <div
            className={`pipeline-step flex items-center gap-1.5 rounded-full px-3 py-1.5 ${step.color}`}
            title={step.label}
          >
            <span className={`h-2 w-2 rounded-full pipeline-dot ${step.dot}`}
                  style={{ animationDelay: `${i * 0.4}s` }}
                  aria-hidden="true"
            />
            <span className={`annotation ${step.accent}`}>{step.abbr}</span>
          </div>

          {/* Arrow between steps */}
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="mx-0.5 text-[9px] font-bold text-ink/25"
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
