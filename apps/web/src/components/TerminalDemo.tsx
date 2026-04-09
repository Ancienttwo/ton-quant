import { useEffect, useRef, useState } from "react";

interface TermLine {
  text: string;
  type:
    | "prompt"
    | "info"
    | "success"
    | "data"
    | "header"
    | "divider"
    | "metric"
    | "recommendation"
    | "dim";
  delay: number;
}

const DEMO_LINES: TermLine[] = [
  // Scene 1: Factor Leaderboard (~4s)
  { text: "$ tonquant factor top --limit 5", type: "prompt", delay: 0 },
  { text: "", type: "dim", delay: 1200 },
  { text: "  Factor Leaderboard", type: "header", delay: 1500 },
  { text: "  ────────────────────────────────────────────────", type: "divider", delay: 1700 },
  { text: "  #1  ton_momentum_1d   1.8402  +42.3%  68%  mom", type: "recommendation", delay: 2200 },
  { text: "  #2  not_vol_revert    1.4521  +31.7%  62%  vol", type: "metric", delay: 2600 },
  { text: "  #3  dex_liq_flow      1.2103  +24.5%  59%  liq", type: "metric", delay: 3000 },
  { text: "  #4  rsi_oversold_14d  0.9814  +18.2%  55%  mom", type: "dim", delay: 3300 },
  { text: "  #5  whale_sentiment   0.8701  +15.1%  53%  sent", type: "dim", delay: 3600 },
  { text: "  5 factors ranked by Sharpe", type: "dim", delay: 4000 },
  { text: "", type: "dim", delay: 4500 },

  // Scene 2: Discover (~4s)
  {
    text: "$ tonquant factor discover --category momentum --min-sharpe 1.0",
    type: "prompt",
    delay: 5000,
  },
  { text: "", type: "dim", delay: 6200 },
  { text: "  Factor Search", type: "header", delay: 6500 },
  { text: "  ────────────────────────────────────────────────", type: "divider", delay: 6700 },
  { text: "  ton_momentum_1d   mom  1.8402  TON    1d  free", type: "data", delay: 7200 },
  { text: "  rsi_oversold_14d  mom  0.9814  TON    1d  free", type: "data", delay: 7500 },
  { text: "  2 factors found (filtered: category=momentum)", type: "dim", delay: 8000 },
  { text: "", type: "dim", delay: 8500 },

  // Scene 3: One-click Backtest (~5s)
  { text: "$ tonquant factor backtest ton_momentum_1d --period 90d", type: "prompt", delay: 9000 },
  { text: "", type: "dim", delay: 10500 },
  { text: "  Factor Backtest: ton_momentum_1d", type: "header", delay: 10800 },
  { text: "  ────────────────────────────────────────────────", type: "divider", delay: 11000 },
  { text: "  Sharpe Ratio     1.8402", type: "metric", delay: 11500 },
  { text: "  Total Return     +42.3%", type: "metric", delay: 12000 },
  { text: "  Max Drawdown     8.21%", type: "data", delay: 12400 },
  { text: "  Win Rate         68.0%", type: "data", delay: 12800 },
  { text: "  Trade Count      142", type: "data", delay: 13100 },
  { text: "  Period: 2026-01-01 → 2026-03-01 (90d)", type: "dim", delay: 13500 },
  { text: "", type: "dim", delay: 14000 },

  // Scene 4: Compose (~5s)
  {
    text: "$ tonquant factor compose --factors ton_momentum_1d:0.6,not_vol_revert:0.4",
    type: "prompt",
    delay: 14500,
  },
  { text: "", type: "dim", delay: 16200 },
  { text: "  Factor Composition", type: "header", delay: 16500 },
  { text: "  ────────────────────────────────────────────────", type: "divider", delay: 16700 },
  { text: "  Components:", type: "dim", delay: 17200 },
  { text: "    0.60 × ton_momentum_1d   (Sharpe: 1.8402)", type: "data", delay: 17600 },
  { text: "    0.40 × not_vol_revert    (Sharpe: 1.4521)", type: "data", delay: 18000 },
  { text: "", type: "dim", delay: 18500 },
  { text: "  ID:          composed_mom_vol", type: "info", delay: 19000 },
  { text: "  Est. Sharpe: ~1.6850 (weighted)", type: "metric", delay: 19400 },
  { text: "  Status:      Saved to registry", type: "success", delay: 19800 },
];

const TYPE_COLORS: Record<string, string> = {
  prompt: "var(--neutral-100)",
  info: "var(--info)",
  success: "var(--success)",
  data: "var(--primary)",
  header: "var(--primary)",
  divider: "var(--neutral-30)",
  metric: "var(--primary)",
  recommendation: "var(--success)",
  dim: "var(--neutral-60)",
};

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Intersection observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          setIsInView(true);
          setHasPlayed(true);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasPlayed]);

  // Animate lines
  useEffect(() => {
    if (!isInView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
        }, line.delay),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  const renderLine = (line: TermLine, index: number) => {
    if (line.type === "prompt") {
      const parts = line.text.split(" ");
      return (
        <div key={index} className="term-line" style={{ animationDelay: `${index * 30}ms` }}>
          <span style={{ color: "var(--secondary)" }}>{parts[0]}</span>{" "}
          <span style={{ color: "var(--primary)" }}>{parts[1]}</span>{" "}
          <span style={{ color: "var(--neutral-80)" }}>{parts.slice(2).join(" ")}</span>
        </div>
      );
    }
    if (line.type === "recommendation") {
      const parts = line.text.split("BUY");
      return (
        <div key={index} className="term-line term-line-enter">
          <span style={{ color: "var(--neutral-60)" }}>{parts[0]}</span>
          <span className="recommendation-badge">BUY</span>
        </div>
      );
    }
    if (line.type === "metric") {
      const value = line.text.match(/[\d.+%-]+$/)?.[0] ?? "";
      const label = line.text.replace(value, "");
      const isPositive = value.startsWith("+") || (parseFloat(value) > 1 && !value.includes("%"));
      return (
        <div key={index} className="term-line term-line-enter">
          <span style={{ color: "var(--neutral-60)" }}>{label}</span>
          <span style={{ color: isPositive ? "var(--success)" : "var(--primary)" }}>{value}</span>
        </div>
      );
    }
    return (
      <div
        key={index}
        className="term-line term-line-enter"
        style={{ color: TYPE_COLORS[line.type] ?? "var(--neutral-80)" }}
      >
        {line.text || "\u00A0"}
      </div>
    );
  };

  return (
    <div className="terminal" ref={containerRef}>
      <div className="terminal-chrome">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="terminal-title">tonquant</span>
        <div style={{ width: 52 }} />
      </div>
      <div className="terminal-body" ref={scrollRef}>
        {DEMO_LINES.slice(0, visibleLines).map((line, i) => renderLine(line, i))}
        {visibleLines < DEMO_LINES.length && <span className="cursor">_</span>}
      </div>
    </div>
  );
}
