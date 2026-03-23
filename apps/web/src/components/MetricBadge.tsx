interface MetricBadgeProps {
  readonly label: string;
  readonly value: string;
  readonly color: "success" | "error" | "primary" | "secondary" | "dim";
  readonly sublabel?: string;
}

const COLOR_MAP: Record<MetricBadgeProps["color"], string> = {
  success: "var(--success)",
  error: "var(--error)",
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  dim: "var(--neutral-60)",
};

export function MetricBadge({ label, value, color, sublabel }: MetricBadgeProps) {
  return (
    <div className="metric-badge">
      <span className="metric-badge-label">{label}</span>
      <span className="metric-badge-value" style={{ color: COLOR_MAP[color] }}>
        {value}
      </span>
      {sublabel && <span className="metric-badge-sub">{sublabel}</span>}
    </div>
  );
}
