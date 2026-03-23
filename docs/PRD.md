# TonQuant PRD v3 — TON Quant Research CLI

## 1. Overview

### 1.1 Product

**TonQuant** is an AI-agent-facing CLI for TON quant research.

It deliberately ships in two stages:

- **Phase 0**: lightweight TON DeFi support commands for market inspection and wallet workflows
- **Phase 1**: quant-first workflows for data fetch, factor computation, backtesting, presets, and autoresearch

### 1.2 One-line Description

TonQuant gives AI agents a stable TON quant workflow surface so they can fetch datasets, compute factors, run backtests, and iterate strategies while still having direct wallet and market utilities available.

### 1.3 Product Thesis

The repo should not stop at “price and swap tooling.” The differentiator is an agent-friendly quant boundary for TON:

- typed request/result contracts
- durable artifacts and state
- predictable command groups
- a backend-agnostic runner interface

### 1.4 Users

- **Primary**: AI agents consuming `--json`
- **Secondary**: developers and researchers using the CLI directly

## 2. Product Shape

## 2.1 Phase 0 — Support Commands

These remain available and do not need to run through the quant runner:

- `tonquant price <symbol>`
- `tonquant pools <pair>`
- `tonquant trending`
- `tonquant init`
- `tonquant balance`
- `tonquant swap`
- `tonquant history`
- `tonquant research`

Role:

- wallet inspection
- market inspection
- demo flows
- lightweight market summary

`research` in this phase is a market-summary command, not the quant research domain.

## 2.2 Phase 1 — Quant Command Surface

These become the main product:

- `tonquant data fetch|list|info`
- `tonquant factor list|compute`
- `tonquant backtest run`
- `tonquant preset list|show`
- `tonquant autoresearch init|run|status|list`

Phase 1.5 or later:

- `tonquant signal evaluate`
- `tonquant autoresearch promote|reject`
- richer factor library
- eventual `swap --execute`

## 3. Architecture Direction

## 3.1 Support Command Surface

Support commands continue to follow:

```text
CLI -> service wrapper -> STON.fi / TonAPI / TON SDK -> output formatter
```

This path remains optimized for live lookups and wallet operations.

## 3.2 Quant Surface

Quant workflows are owned by `src/quant/`:

```text
src/quant/
  types/   -> request/result/state schemas
  api/     -> typed TS entrypoints
  runner/  -> CLI resolution, subprocess lifecycle, artifact persistence
```

This surface is designed to be compatible with the `comp-agent` quant boundary where it matters:

- schema families
- runner semantics
- artifact ownership
- autoresearch state model

## 3.3 Optional Backend

The first execution backend is planned, not shipped in this pass. The runner assumes a future backend such as a Python CLI exposed over JSON-over-stdio.

## 4. Quant Artifact And State Contract

## 4.1 Single-run artifacts

```text
~/.tonquant/quant/<domain>/<runId>/
  request.json
  result.json
  run.log
  <domain artifacts>
```

Expected domains:

- `data-fetch`
- `factors`
- `signals`
- `backtests`
- `presets`
- `autoresearch`
- `autoresearch-runs`

## 4.2 Autoresearch durable state

```text
~/.tonquant/quant/autoresearch/<trackId>/
  baseline.json
  state.json
  history.jsonl
  candidates/
    <candidateId>.json
```

Background run artifacts:

```text
~/.tonquant/quant/autoresearch-runs/<runId>/
  request.json
  result.json
  run.log
```

## 5. Public Quant Interfaces

## 5.1 Shared run metadata

Every quant run result includes:

- `runId`
- `status`
- `summary`
- `artifacts`

## 5.2 Command families and type contracts

### Data

- `DataFetchRequest / DataFetchResult`
- `DataListRequest / DataListResult`
- `DataInfoRequest / DataInfoResult`

### Factor

- `FactorListRequest / FactorListResult`
- `FactorComputeRequest / FactorComputeResult`

### Signal

- `SignalListRequest / SignalListResult`
- `SignalEvaluateRequest / SignalEvaluateResult`

### Backtest

- `BacktestRequest / BacktestResult`

### Preset

- `PresetSummary / PresetDetail`
- `PresetListRequest / PresetListResult`
- `PresetShowRequest / PresetShowResult`

### Autoresearch

- `AcceptanceGates`
- `QuantAutoresearchBaselineSpec`
- `QuantAutoresearchState`
- `QuantAutoresearchCandidate`
- `QuantAutoresearchRunSummary`
- `QuantAutoresearchTrackSummary`
- init/run/status/list/promote/reject request contracts

## 5.3 Runner APIs

The stable TypeScript runner boundary includes:

- `runQuantCli`
- `invokeQuantCli`
- artifact helpers for directory creation, listing, normalization, and persistence

## 6. Dataset Contract Direction

`data fetch` is the mandatory precursor for factor, backtest, and autoresearch.

The dataset contract must support TON-specific market data assembly from STON.fi and related TON sources. This PRD does not lock the final file format yet, but it does lock the responsibility boundary:

- support commands may read live APIs directly
- quant commands operate on fetched or derived datasets with durable artifacts

## 7. Example Agent Flows

### 7.1 Support command flow

```bash
tonquant price NOT --json
tonquant pools NOT/TON --json
tonquant balance --all --json
```

### 7.2 Quant flow

```bash
tonquant data fetch NOT TON --start-date 2026-01-01 --end-date 2026-03-01 --json
tonquant factor compute --symbols NOT TON --factors rsi momentum --json
tonquant backtest run --strategy martin-momentum --symbols NOT TON --start-date 2026-01-01 --end-date 2026-03-01 --json
```

### 7.3 Autoresearch flow

```bash
tonquant autoresearch init \
  --title "NOT momentum exploration" \
  --strategy martin-momentum \
  --symbols NOT TON \
  --start-date 2026-01-01 \
  --end-date 2026-03-01 \
  --json

tonquant autoresearch run --track trk_not_momo --iterations 20 --json
tonquant autoresearch status --track trk_not_momo --json
```

## 8. Priority

## 8.1 Current pass

1. repo-local replan and workflow alignment
2. `src/quant/` type/api/runner boundary
3. Phase 1 command-group contract on the CLI surface
4. docs updated to describe the same product

## 8.2 Next implementation phase

1. dataset contract and `data fetch`
2. factor implementations
3. backtest engine
4. preset loading
5. autoresearch state machine

## 8.3 Deferred

- signal evaluation implementation
- promote/reject implementation
- swap execution
- dashboard/UI
- multi-DEX aggregation

## 9. Agent Ecosystem — 推荐搭配的 MCP Skills

TonQuant 是 Agent 调用的 CLI 工具，不内置 AI。驱动它的 Agent (OpenClaw) 侧应搭配以下 MCP skill 以增强决策质量：

### 9.1 opennews-mcp — **推荐**

```bash
npx skills add https://github.com/6551Team/opennews-mcp --skill opennews
```

| 属性 | 值 |
|------|-----|
| 来源 | 72+ 加密新闻源 (Bloomberg, Reuters, CoinDesk, The Block...) |
| 能力 | AI 评分 (0-100)、交易信号 (bullish/bearish)、链上鲸鱼动态、实时 WebSocket |
| 需要 | `OPENNEWS_TOKEN` (从 https://6551.io/mcp 获取) |

**与 TonQuant 的协同场景:**

| 场景 | Agent 工作流 |
|------|-------------|
| 策略表现归因 | `autoresearch status` → 发现回撤 → `opennews search_news_by_coin NOT` → 关联 FUD 新闻 → 判断是市场事件非策略失效 |
| 回测结果解读 | `backtest run` → sharpe 偏低 → 查新闻发现回测区间有黑天鹅事件 → 调整回测窗口 |
| 交易前确认 | `swap` 前 → `opennews get_high_score_news` → 无重大利空 → 执行 |

### 9.2 daily-news — **不需要**

与 opennews-mcp 数据源重叠（同为 6551 API），功能是其子集，跳过。

### 9.3 SKILL.md 中的协同说明

TonQuant 的 OpenClaw SKILL.md 应包含：

```markdown
## Recommended companion skills
- **opennews**: Use `search_news_by_coin` to contextualize strategy performance.
  Before promoting autoresearch candidates, check recent news for the traded token.
  Before executing swaps, verify no high-impact negative news (aiRating > 80, signal = bearish).
```

## 10. Acceptance Criteria

- Repo docs consistently describe a two-stage product
- `src/quant/` exists and exports the Phase 1 contract surface
- CLI help exposes the Phase 1 command groups
- Agent-facing success can be expressed as:
  - `data fetch -> factor compute -> backtest run`
  - `autoresearch init -> run -> status`
- Existing support commands remain available without being forced into quant-run artifact semantics
- SKILL.md 包含 opennews 协同说明
