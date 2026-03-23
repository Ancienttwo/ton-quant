import { useState, useMemo } from "react";
import type { FactorCategory, FactorMetaPublic } from "../data/types";
import { sharpeLevel, cagrLevel, drawdownLevel, levelToCss } from "../data/thresholds";

type SortField = "sharpe" | "cagr" | "winRate" | "maxDrawdown";
type SortDir = "asc" | "desc";
type Period = "7d" | "30d" | "90d" | "all";

const CATEGORIES: readonly FactorCategory[] = [
  "momentum",
  "value",
  "volatility",
  "liquidity",
  "sentiment",
  "custom",
];

const CATEGORY_ABBR: Record<FactorCategory, string> = {
  momentum: "mom",
  value: "val",
  volatility: "vol",
  liquidity: "liq",
  sentiment: "sent",
  custom: "cust",
};

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: Infinity,
};

interface LeaderboardProps {
  readonly factors: readonly FactorMetaPublic[];
  readonly onFactorSelect: (factorId: string) => void;
  readonly selectedFactorId: string | null;
}

export function Leaderboard({ factors, onFactorSelect, selectedFactorId }: LeaderboardProps) {
  const [sortField, setSortField] = useState<SortField>("sharpe");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [period, setPeriod] = useState<Period>("all");
  const [activeCategories, setActiveCategories] = useState<ReadonlySet<FactorCategory>>(new Set());

  const toggleCategory = (cat: FactorCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const minDate = new Date(now.getTime() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000);

    return factors.filter((f) => {
      if (activeCategories.size > 0 && !activeCategories.has(f.category)) return false;
      if (period !== "all") {
        const end = new Date(f.backtest.dataRange.end);
        if (end < minDate) return false;
      }
      return true;
    });
  }, [factors, activeCategories, period]);

  const sorted = useMemo(() => {
    const mult = sortDir === "desc" ? -1 : 1;
    return [...filtered].sort(
      (a, b) => mult * (a.backtest[sortField] - b.backtest[sortField]),
    );
  }, [filtered, sortField, sortDir]);

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDir === "desc" ? " \u25BC" : " \u25B2";
  };

  return (
    <div className="leaderboard">
      {/* Header */}
      <div className="leaderboard-header">
        <h2 className="section-title">
          <span className="section-tag">LIVE</span>
          Factor Leaderboard
        </h2>
        <div className="period-selector">
          {(["7d", "30d", "90d", "all"] as const).map((p) => (
            <button
              key={p}
              className={`period-pill${period === p ? " period-pill--active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === "all" ? "ALL" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="leaderboard-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-pill${activeCategories.has(cat) ? " filter-pill--active" : ""}`}
            onClick={() => toggleCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="leaderboard-table-wrap">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-factor">Factor</th>
              <th className="col-sortable" tabIndex={0} role="button" onClick={() => handleSort("sharpe")} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSort("sharpe"); }}>
                Sharpe{sortArrow("sharpe")}
              </th>
              <th className="col-sortable" tabIndex={0} role="button" onClick={() => handleSort("cagr")} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSort("cagr"); }}>
                CAGR{sortArrow("cagr")}
              </th>
              <th className="col-sortable" tabIndex={0} role="button" onClick={() => handleSort("winRate")} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSort("winRate"); }}>
                Win Rate{sortArrow("winRate")}
              </th>
              <th className="col-sortable col-hide-mobile" tabIndex={0} role="button" onClick={() => handleSort("maxDrawdown")} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSort("maxDrawdown"); }}>
                Max DD{sortArrow("maxDrawdown")}
              </th>
              <th className="col-cat col-hide-mobile">Cat</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => (
              <tr
                key={f.id}
                className={`leaderboard-row${selectedFactorId === f.id ? " leaderboard-row--selected" : ""}`}
                tabIndex={0}
                aria-selected={selectedFactorId === f.id}
                onClick={() => onFactorSelect(f.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onFactorSelect(f.id); }}
              >
                <td className="col-rank">{i + 1}</td>
                <td className="col-factor">{f.id}</td>
                <td style={{ color: levelToCss(sharpeLevel(f.backtest.sharpe)) }}>
                  {f.backtest.sharpe.toFixed(4)}
                </td>
                <td style={{ color: levelToCss(cagrLevel(f.backtest.cagr)) }}>
                  {f.backtest.cagr >= 0 ? "+" : ""}
                  {f.backtest.cagr.toFixed(1)}%
                </td>
                <td>{(f.backtest.winRate * 100).toFixed(0)}%</td>
                <td className="col-hide-mobile" style={{ color: levelToCss(drawdownLevel(f.backtest.maxDrawdown)) }}>
                  {f.backtest.maxDrawdown.toFixed(1)}%
                </td>
                <td className="col-cat col-hide-mobile">{CATEGORY_ABBR[f.category]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-footer">
        {sorted.length} factor{sorted.length !== 1 ? "s" : ""} ranked by {sortField}
      </div>
    </div>
  );
}
