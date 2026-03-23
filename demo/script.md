# TonQuant Demo Video Script

> **Duration**: ~2 minutes
> **Format**: Terminal recording (asciinema) + voice-over or text overlay
> **Goal**: Show AI Agent autonomously completing a full quant research loop on TON

---

## Scene 1: Hook (10s)

**Text overlay:**
> "950 million Telegram users. Zero AI Agents doing quant research on TON."

**Terminal**: Empty, cursor blinking.

---

## Scene 2: What is TonQuant? (10s)

**Text overlay:**
> "TonQuant — Agent-native quant research CLI for the TON blockchain"

**Terminal:**
```bash
$ tonquant --help
```
Show the full command list — Phase 0 (market inspection) + Phase 1 (quant research).

---

## Scene 3: Market Check (20s)

**Text overlay:**
> "Step 1: Check the market"

**Terminal:**
```bash
$ tonquant price TON
$ tonquant trending --limit 5
```

Quick visual of live market data. Colored output, real prices.

---

## Scene 4: Available Tools (15s)

**Text overlay:**
> "Step 2: Choose your weapons"

**Terminal:**
```bash
$ tonquant factor list
$ tonquant preset list
```

Show the 5 factors (RSI, MACD, volatility, SMA-20, volume ratio) and 3 presets.

---

## Scene 5: The "Wow" Moment (40s)

**Text overlay:**
> "Step 3: One command. Full research loop."

**Terminal:**
```bash
$ tonquant autoresearch run --asset TON/USDT --factors rsi,macd,volatility
```

**Key moments to capture:**
1. Pipeline starts — "Autoresearch" header appears
2. Steps complete one by one:
   - ✓ data fetch — 90 bars
   - ✓ factor compute — 3 factors
   - ✓ backtest — return % and sharpe ratio
   - ✓ report — generated
3. Metrics table appears with recommendation (BUY/SELL/HOLD)
4. Factor values displayed
5. Report path shown

**Pause 2s on the final output** so viewer can read the recommendation.

---

## Scene 6: The Report (15s)

**Text overlay:**
> "Auto-generated research report"

**Terminal:**
```bash
$ cat ~/.tonquant/quant/autoresearch-runs/<latest>/report.md | head -30
```

Show the markdown report with summary table, factor analysis, recommendation.

---

## Scene 7: JSON for Agents (10s)

**Text overlay:**
> "Structured JSON for any AI Agent framework"

**Terminal:**
```bash
$ tonquant autoresearch run --asset TON/USDT --json | head -20
```

Show the `{ status: "ok", data: { ... } }` envelope.

---

## Scene 8: Closing (10s)

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
- Terminal width: 100+ columns for table formatting
- Run each command with ~1s pause between keystrokes for readability
- If using asciinema: `asciinema rec demo/recording.cast --cols 120 --rows 35`
- Speed up wait times in post-production (2x for network calls)
- Total raw recording: ~3-4 minutes, edit down to ~2 minutes
