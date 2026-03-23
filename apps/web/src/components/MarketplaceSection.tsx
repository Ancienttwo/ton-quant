import { useState, useMemo, useCallback } from "react";
import { Leaderboard } from "./Leaderboard";
import { FactorDetailModal } from "./FactorDetailModal";
import { MOCK_FACTORS } from "../data/mock-factors";
import "./marketplace.css";

export function MarketplaceSection() {
  const [selectedFactorId, setSelectedFactorId] = useState<string | null>(null);

  const selectedFactor = useMemo(
    () => MOCK_FACTORS.find((f) => f.id === selectedFactorId) ?? null,
    [selectedFactorId],
  );

  const handleClose = useCallback(() => setSelectedFactorId(null), []);

  return (
    <section className="marketplace" id="marketplace">
      <div className="marketplace-inner">
        <Leaderboard
          factors={MOCK_FACTORS}
          onFactorSelect={setSelectedFactorId}
          selectedFactorId={selectedFactorId}
        />
      </div>

      <FactorDetailModal
        key={selectedFactorId ?? "closed"}
        factor={selectedFactor}
        isOpen={selectedFactorId !== null}
        onClose={handleClose}
      />
    </section>
  );
}
