# TonQuant Demo Video Script

> **Duration**: ~2 minutes
> **Format**: Terminal recording (asciinema) + voice-over or text overlay
> **Goal**: Show Agent-Native Factor Marketplace — browse, compose, and research quant factors on TON

---

## Scene 1: Title + Help (15s)

**Text overlay:**
> "TonQuant — Agent-Native Factor Marketplace for TON"

**Terminal:**
```bash
$ tonquant --help
```
Show the full command list — Phase 0 (market), Phase 1 (quant), Phase 2 (marketplace).

---

## Scene 2: Market Check (15s)

**Text overlay:**
> "Step 1: Check the market"

**Terminal:**
```bash
$ tonquant price TON
$ tonquant trending --limit 5
```

Quick visual of live market data. Colored output, real prices.

---

## Scene 3: Factor Marketplace (30s)

**Text overlay:**
> "Step 2: Browse the Factor Marketplace"

**Terminal:**
```bash
$ tonquant factor seed
$ tonquant factor top --limit 5
$ tonquant factor discover --category momentum --min-sharpe 1.0
```

**Key moments:**
1. `factor seed` populates the registry with 15 built-in factors
2. `factor top` shows the leaderboard ranked by Sharpe ratio
3. `factor discover` filters momentum factors above Sharpe 1.0

---

## Scene 4: Agent Research Loop (30s)

**Text overlay:**
> "Step 3: One command. Full research loop."

**Terminal:**
```bash
$ tonquant autoresearch run --asset TON/USDT --factors rsi,macd,volatility
```

**Key moments:**
1. Pipeline starts — "Autoresearch" header appears
2. Steps complete one by one:
   - data fetch — 90 bars
   - factor compute — 3 factors
   - backtest — return % and Sharpe ratio
   - report — generated
3. Metrics table with recommendation (BUY/SELL/HOLD)
4. Factor values displayed
5. Report path shown

**Pause 2s on the final output** so viewer can read the recommendation.

---

## Scene 5: Factor Composition + JSON (20s)

**Text overlay:**
> "Step 4: Compose factors. Structured JSON for any AI Agent."

**Terminal:**
```bash
$ tonquant factor compose --name 'Momentum+Vol' --components mom_30d_ton:0.6,vol_30d_ton:0.4
$ tonquant factor compose --name 'Momentum+Vol' --components mom_30d_ton:0.6,vol_30d_ton:0.4 --force --json
```

**Key moments:**
1. Human-readable output: composite name, components with weights, derived backtest
2. JSON envelope: `{ status: "ok", data: { ... } }` — structured for agents

---

## Closing (10s)

**Text overlay:**
> "TonQuant — from zero to quant research in one command"
>
> bun install -g tonquant
> tonquant.com
> github.com/Ancienttwo/ton-quant

---

## Recording Notes

- Use a clean terminal with dark background matching DESIGN.md (#0A0E14)
- Font: JetBrains Mono, 14-16px
- Terminal width: 120+ columns for table formatting
- Run `factor seed` before `factor top/discover` to populate the registry
- If using asciinema: `asciinema rec demo/recording.cast --cols 120 --rows 38`
- Speed up wait times in post-production (2x for network calls)
- Total raw recording: ~3-4 minutes, edit down to ~2 minutes
