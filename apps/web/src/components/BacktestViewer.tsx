import { useEffect, useRef } from "react";
import { createChart, type IChartApi, ColorType, AreaSeries } from "lightweight-charts";
import { MetricBadge } from "./MetricBadge";
import { generateEquityCurve } from "../data/mock-factors";
import type { FactorMetaPublic } from "../data/types";
import { sharpeLevel, cagrLevel, drawdownLevel, levelToToken } from "../data/thresholds";

interface BacktestViewerProps {
  readonly factor: FactorMetaPublic;
}

export function BacktestViewer({ factor }: BacktestViewerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { backtest } = factor;

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: "#0a0e14" },
        textColor: "#8b95a5",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1e2736" },
        horzLines: { color: "#1e2736" },
      },
      crosshair: {
        vertLine: { color: "#3d4a5c", labelBackgroundColor: "#111820" },
        horzLine: { color: "#3d4a5c", labelBackgroundColor: "#111820" },
      },
      rightPriceScale: {
        borderColor: "#1e2736",
      },
      timeScale: {
        borderColor: "#1e2736",
        timeVisible: false,
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#00e5ff",
      topColor: "rgba(0, 229, 255, 0.15)",
      bottomColor: "rgba(0, 229, 255, 0.02)",
      lineWidth: 2,
    });

    const curveData = generateEquityCurve(factor.backtest);
    series.setData(curveData);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [factor.id]);

  return (
    <div className="backtest-viewer">
      {/* Metrics dashboard */}
      <div className="backtest-metrics">
        <MetricBadge
          label="SHARPE RATIO"
          value={backtest.sharpe.toFixed(4)}
          color={levelToToken(sharpeLevel(backtest.sharpe))}
        />
        <MetricBadge
          label="CAGR"
          value={`${backtest.cagr >= 0 ? "+" : ""}${backtest.cagr.toFixed(1)}%`}
          color={levelToToken(cagrLevel(backtest.cagr))}
          sublabel="annualized"
        />
        <MetricBadge
          label="MAX DRAWDOWN"
          value={`${backtest.maxDrawdown.toFixed(1)}%`}
          color={levelToToken(drawdownLevel(backtest.maxDrawdown))}
        />
        <MetricBadge
          label="WIN RATE"
          value={`${(backtest.winRate * 100).toFixed(0)}%`}
          color="primary"
        />
        <MetricBadge
          label="TRADE COUNT"
          value={String(backtest.tradeCount)}
          color="primary"
        />
        <MetricBadge
          label="DATA RANGE"
          value={`${backtest.dataRange.start} \u2192 ${backtest.dataRange.end}`}
          color="dim"
        />
      </div>

      {/* Equity curve chart */}
      <div className="backtest-chart">
        <div className="backtest-chart-chrome">
          <span className="backtest-chart-label">EQUITY CURVE</span>
          <span className="backtest-chart-base">base = 100</span>
        </div>
        <div className="backtest-chart-container" ref={chartContainerRef} />
      </div>
    </div>
  );
}
