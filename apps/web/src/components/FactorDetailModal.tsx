import { useEffect, useRef, useState } from "react";
import type { FactorCategory, FactorMetaPublic } from "../data/types";
import { BacktestViewer } from "./BacktestViewer";

const CATEGORY_COLORS: Record<FactorCategory, string> = {
  momentum: "var(--primary)",
  value: "var(--secondary)",
  volatility: "var(--error)",
  liquidity: "var(--info)",
  sentiment: "var(--success)",
  custom: "var(--neutral-60)",
};

interface FactorDetailModalProps {
  readonly factor: FactorMetaPublic | null;
  readonly onClose: () => void;
  readonly isOpen: boolean;
}

export function FactorDetailModal({ factor, onClose, isOpen }: FactorDetailModalProps) {
  // State resets naturally via key prop on parent — no effect needed
  const [subscribed, setSubscribed] = useState(false);
  const [paramsOpen, setParamsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Focus trap: move focus to container on open
  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !factor) return null;

  const catColor = CATEGORY_COLORS[factor.category];
  const titleId = `modal-title-${factor.id}`;

  return (
    <div className="modal-overlay">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="modal-container"
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id={titleId}>
            {factor.name}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Badges */}
        <div className="modal-badges">
          <span className="badge" style={{ borderColor: catColor, color: catColor }}>
            {factor.category}
          </span>
          <span className="badge badge--dim">{factor.source}</span>
          <span className="badge badge--dim">{factor.visibility}</span>
          <span className="badge badge--dim">v{factor.version}</span>
        </div>

        {/* Description */}
        <p className="modal-description">{factor.description}</p>

        {/* Metadata grid */}
        <div className="modal-meta">
          <div className="meta-item">
            <span className="meta-label">AUTHOR</span>
            <span className="meta-value">{factor.author}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">ASSETS</span>
            <span className="meta-value">{factor.assets.join(", ")}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">TIMEFRAME</span>
            <span className="meta-value">{factor.timeframe}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">ID</span>
            <span className="meta-value">{factor.id}</span>
          </div>
        </div>

        {/* Parameters */}
        {factor.parameters.length > 0 && (
          <div className="modal-params">
            <button
              type="button"
              className="params-toggle"
              onClick={() => setParamsOpen((o) => !o)}
              aria-expanded={paramsOpen}
            >
              Parameters ({factor.parameters.length})
              <span className="params-arrow">{paramsOpen ? "\u25B2" : "\u25BC"}</span>
            </button>
            {paramsOpen && (
              <div className="params-list">
                {factor.parameters.map((p) => (
                  <div key={p.name} className="param-item">
                    <span className="param-name">{p.name}</span>
                    <span className="param-desc">{p.description}</span>
                    {p.defaultValue != null && (
                      <span className="param-default">default: {String(p.defaultValue)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Backtest */}
        <BacktestViewer factor={factor} />

        {/* Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className={`btn ${subscribed ? "btn-ghost" : "btn-primary"}`}
            onClick={() => setSubscribed((s) => !s)}
          >
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
        </div>
      </div>
    </div>
  );
}
