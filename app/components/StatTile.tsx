type StatTileProps = {
  label: string;
  value: number;
  accentColor: string;
  delta?: number;
  deltaIsGood?: boolean;
};

export function StatTile({ label, value, accentColor, delta, deltaIsGood = true }: StatTileProps) {
  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-2"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-hairline)",
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {value.toLocaleString()}
      </span>
      {typeof delta === "number" && (
        <span
          className="text-xs"
          style={{ color: delta === 0 ? "var(--text-muted)" : deltaIsGood ? "var(--success-text)" : "var(--text-secondary)" }}
        >
          {delta > 0 ? "+" : ""}
          {delta} this week
        </span>
      )}
    </div>
  );
}
