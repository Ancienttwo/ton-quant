# TonTrader PRD v2 — TON DeFi 量化研究 CLI

## 1. 概述

### 1.1 项目名称
**tontrader** — AI Agent 驱动的 TON DeFi 量化研究与策略迭代 CLI

### 1.2 一句话描述
供 AI Agent (OpenClaw) 调用的量化交易 CLI，在 TON DEX 上进行因子挖掘、策略回测、自动研究迭代，让普通人也能复现量化冠军的策略。

### 1.3 愿景
**让每个 Telegram 用户都能拥有自己的量化研究员。**

传统量化交易需要数学博士 + 百万美元基础设施。TonTrader 将量化研究流程 CLI 化，让 AI Agent 驱动策略发现和迭代 — 用户只需要说"帮我找一个 NOT 的动量策略"，Agent 就能自动完成因子计算 → 策略回测 → 参数优化 → 持续迭代。

### 1.4 灵感来源
- **comp-agent `packages/quant`** — 已验证的量化 CLI 架构（factor → signal → strategy → backtest → autoresearch）
- **Martin Luk / J Law 策略** — 内置冠军策略 preset，用户一键启动自动研究
- **TON DeFi 蓝海** — 链上 DEX 数据公开透明，天然适合量化分析

### 1.5 目标赛道
TON AI Agent Hackathon · 赛道 1: Agent 基础设施 ($10,000)

## 2. 架构概览

```
┌──────────────────────────────────────────────────────────────────┐
│                    TonTrader CLI 架构                             │
│                                                                   │
│  ┌──────────┐                                                     │
│  │ OpenClaw │──shell exec──►┌──────────────────────────────────┐ │
│  │ /Claude  │               │          tontrader CLI            │ │
│  └──────────┘◄──json stdout─│                                  │ │
│                              │  ┌────────────────────────────┐ │ │
│  命令层                      │  │ market · factor · signal   │ │ │
│  tontrader data fetch        │  │ backtest · research        │ │ │
│  tontrader factor compute    │  │ autoresearch · preset      │ │ │
│  tontrader backtest run      │  │ swap · balance             │ │ │
│  tontrader autoresearch init │  └─────────┬──────────────────┘ │ │
│  tontrader autoresearch run  │            │                    │ │
│  ...                         │  ┌─────────▼──────────────────┐ │ │
│                              │  │      Services Layer         │ │ │
│                              │  │ STON.fi API · TonAPI        │ │ │
│                              │  │ @ton/ton · 策略引擎         │ │ │
│                              │  └─────────┬──────────────────┘ │ │
│                              └────────────┼────────────────────┘ │
│                                           │                      │
│                              ┌────────────▼──────────────────┐   │
│                              │      数据与存储                │   │
│                              │ ~/.tontrader/                  │   │
│                              │   config.json   (钱包配置)     │   │
│                              │   data/          (OHLCV 缓存)  │   │
│                              │   tracks/        (autoresearch)│   │
│                              │   artifacts/     (回测产物)     │   │
│                              │   presets/        (策略预设)    │   │
│                              └────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## 3. 量化流水线 (复用 comp-agent 架构)

```
数据获取 → 因子计算 → 信号生成 → 策略回测 → 自动研究迭代
  data       factor      signal     backtest    autoresearch
  fetch      compute     evaluate   run         init/run
```

### 3.1 数据层 — `tontrader data`
从 STON.fi API 获取历史 OHLCV（open/high/low/close/volume）数据并缓存。

| 命令 | 功能 | 优先级 |
|------|------|--------|
| `tontrader data fetch <pair> --days 90` | 拉取历史 K 线数据，缓存到本地 | P0 |
| `tontrader data list` | 列出已缓存的数据集 | P0 |
| `tontrader data info <pair>` | 查看数据集详情（行数、时间范围） | P1 |

**数据来源**: STON.fi `/v1/pools/{address}` + `/v1/wallets/{addr}/operations` 聚合为 OHLCV
**存储格式**: JSON 文件 `~/.tontrader/data/{pair}_{interval}.json`

### 3.2 因子层 — `tontrader factor`
在历史数据上计算量化因子。

| 命令 | 功能 | 优先级 |
|------|------|--------|
| `tontrader factor list` | 列出所有可用因子 | P0 |
| `tontrader factor compute --pair NOT/TON --factors rsi,macd` | 计算指定因子 | P0 |
| `tontrader factor compute --pair NOT/TON --factors all` | 计算所有因子 | P1 |

**内置因子 (P0):**

| 因子 | 类型 | 说明 |
|------|------|------|
| `rsi` | 动量 | Relative Strength Index (14期) |
| `macd` | 趋势 | MACD (12,26,9) |
| `bollinger` | 波动率 | Bollinger Bands (20期, 2倍标准差) |
| `volume_ratio` | 成交量 | 当前成交量 / N 期均量 |
| `momentum` | 动量 | N 期价格变化率 |
| `volatility` | 波动率 | N 期历史波动率 |

**DEX 特有因子 (P1):**

| 因子 | 类型 | 说明 |
|------|------|------|
| `liquidity_depth` | 流动性 | 池子 TVL 变化率 |
| `price_impact` | 流动性 | 模拟 swap 的价格影响 |
| `volume_spike` | 异常 | 成交量突破 N 倍标准差 |

### 3.3 信号层 — `tontrader signal`
组合因子为交易信号。

| 命令 | 功能 | 优先级 |
|------|------|--------|
| `tontrader signal list` | 列出所有信号定义 | P1 |
| `tontrader signal evaluate --pair NOT/TON --signals momentum_breakout` | 评估信号触发情况 | P1 |

### 3.4 策略层 — `tontrader backtest`
运行策略回测。

| 命令 | 功能 | 优先级 |
|------|------|--------|
| `tontrader backtest run --strategy momentum --pair NOT/TON --days 90` | 回测策略 | P0 |
| `tontrader backtest run --preset martin-momentum --pair NOT/TON` | 用 preset 回测 | P0 |

**回测输出指标 (同 comp-agent):**
```json
{
  "status": "ok",
  "data": {
    "sharpe": 1.85,
    "maxDrawdown": 0.12,
    "totalReturn": 0.45,
    "winRate": 0.62,
    "tradeCount": 47,
    "calmar": 3.75,
    "sortino": 2.41,
    "monthlyReturns": { "2026-01": 0.08, "2026-02": 0.12 },
    "artifacts": ["equity_curve.json", "trades.json"]
  }
}
```

### 3.5 自动研究 — `tontrader autoresearch`
**核心差异化**。AI Agent 驱动的自动策略迭代循环。

| 命令 | 功能 | 优先级 |
|------|------|--------|
| `tontrader autoresearch init --preset martin-momentum --pair NOT/TON` | 初始化研究 track | P0 |
| `tontrader autoresearch run --track <id> --iterations 20` | 运行自动迭代 | P0 |
| `tontrader autoresearch status --track <id>` | 查看迭代状态 | P0 |
| `tontrader autoresearch list` | 列出所有 tracks | P0 |
| `tontrader autoresearch promote --track <id> --candidate <id>` | 提升候选策略 | P1 |
| `tontrader autoresearch reject --track <id> --candidate <id>` | 拒绝候选策略 | P1 |

**自动研究循环:**
```
1. init: 设定 baseline 策略 + 参数范围 + 验收门槛
2. run:  自动生成参数突变 → 回测 → 与 baseline 比较
3.       通过验收门槛 → 保留为候选 (kept)
4.       未通过 → 丢弃 (discarded)
5.       连续 N 次无改善 → 停止 (exhausted)
6. promote: 人/Agent 审核候选，提升为新 baseline
7. 重复 2-6
```

**验收门槛 (AcceptanceGates, 同 comp-agent):**
```json
{
  "minTradeCount": 10,
  "minSharpe": 1.0,
  "maxDrawdown": 0.2,
  "minWinRate": 0.5,
  "regressionThresholdPct": 0.1
}
```

### 3.6 策略预设 — `tontrader preset`
内置冠军策略模板。

| 命令 | 功能 | 优先级 |
|------|------|--------|
| `tontrader preset list` | 列出所有策略预设 | P0 |
| `tontrader preset show <name>` | 查看预设详情 | P0 |
| `tontrader preset save <name>` | 保存当前策略为预设 | P1 |

**内置预设:**

| 预设 | 灵感 | 策略类型 | 参数 |
|------|------|---------|------|
| `martin-momentum` | Martin Luk | 动量突破 | 回望期、突破阈值、止损比例 |
| `jlaw-meanrev` | J Law | 均值回归 | RSI 超买/超卖、回归窗口 |
| `dex-flow` | DEX 特有 | 流动性追踪 | TVL 变化阈值、volume spike |

### 3.7 交易执行 — `tontrader swap / balance`
保留原有交易功能 (来自 PRD v1)。

| 命令 | 功能 | 优先级 |
|------|------|--------|
| `tontrader price <symbol>` | 查询代币价格 | P0 |
| `tontrader balance` | 查看钱包余额 | P0 |
| `tontrader swap <from> <to> <amount>` | 模拟交换 | P0 |
| `tontrader swap ... --execute` | 执行交换 | P1 |

## 4. 完整命令树

```
tontrader
├── init                          # 配置钱包和网络
├── price <symbol>                # 查询代币价格
├── balance [--all]               # 钱包余额
├── swap <from> <to> <amount>     # 模拟/执行交换
│
├── data
│   ├── fetch <pair> [--days N]   # 拉取历史数据
│   └── list                      # 列出缓存数据
│
├── factor
│   ├── list                      # 列出可用因子
│   └── compute --pair <p> --factors <f1,f2>  # 计算因子
│
├── backtest
│   └── run --strategy <s> --pair <p> [--preset <name>]  # 策略回测
│
├── autoresearch
│   ├── init --preset <name> --pair <p>    # 初始化研究 track
│   ├── run --track <id> [--iterations N]  # 运行自动迭代
│   ├── status --track <id>                # 查看状态
│   ├── list                               # 列出 tracks
│   ├── promote --track <id> --candidate <id>  # 提升候选
│   └── reject --track <id> --candidate <id>   # 拒绝候选
│
├── preset
│   ├── list                      # 列出策略预设
│   └── show <name>               # 查看预设详情
│
└── --json                        # 全局: JSON 输出
    --testnet                     # 全局: testnet
    --version / --help
```

## 5. 项目结构

```
tontrader/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                      # CLI 入口 (#!/usr/bin/env bun)
│   ├── cli.ts                        # commander 路由
│   │
│   ├── types/                        # Zod schemas (复用 comp-agent 模式)
│   │   ├── index.ts
│   │   ├── base.ts                   # CliResult, ArtifactRef, DateString
│   │   ├── asset.ts                  # 代币/价格
│   │   ├── pool.ts                   # 流动性池
│   │   ├── ohlcv.ts                  # K 线数据
│   │   ├── factor.ts                 # 因子描述符 + 计算结果
│   │   ├── signal.ts                 # 信号描述符 + 评估结果
│   │   ├── backtest.ts              # 回测请求 + 结果 (sharpe, drawdown...)
│   │   ├── autoresearch.ts          # Track, Candidate, AcceptanceGates
│   │   ├── preset.ts                # 策略预设
│   │   └── swap.ts                  # 交换模拟/执行
│   │
│   ├── services/                    # 外部服务封装
│   │   ├── stonfi.ts                # STON.fi REST API
│   │   ├── tonapi.ts                # TonAPI (余额/历史)
│   │   ├── wallet.ts                # TON 钱包管理
│   │   └── config.ts                # ~/.tontrader/ 配置
│   │
│   ├── engine/                      # 量化引擎核心
│   │   ├── factors/                 # 因子计算
│   │   │   ├── registry.ts          # 因子注册表
│   │   │   ├── rsi.ts
│   │   │   ├── macd.ts
│   │   │   ├── bollinger.ts
│   │   │   ├── momentum.ts
│   │   │   ├── volume-ratio.ts
│   │   │   └── volatility.ts
│   │   ├── strategies/              # 策略实现
│   │   │   ├── registry.ts
│   │   │   ├── momentum-breakout.ts
│   │   │   ├── mean-reversion.ts
│   │   │   └── dex-flow.ts
│   │   ├── backtester.ts            # 回测引擎
│   │   └── autoresearch.ts          # 自动研究引擎
│   │
│   ├── commands/                    # CLI 命令实现
│   │   ├── init.ts
│   │   ├── price.ts
│   │   ├── balance.ts
│   │   ├── swap.ts
│   │   ├── data.ts
│   │   ├── factor.ts
│   │   ├── backtest.ts
│   │   ├── autoresearch.ts
│   │   └── preset.ts
│   │
│   └── ui/
│       └── format.ts               # chalk + cli-table3
│
├── presets/                         # 内置策略预设 (JSON)
│   ├── martin-momentum.json
│   ├── jlaw-meanrev.json
│   └── dex-flow.json
│
├── skill/
│   └── SKILL.md                    # OpenClaw Skill
│
└── __tests__/
    ├── factors.test.ts
    ├── backtester.test.ts
    └── autoresearch.test.ts
```

## 6. 典型使用场景

### 场景 1: "帮我找一个 NOT 的交易策略"
```bash
# Agent 自动执行以下序列:

# 1. 拉取数据
tontrader data fetch NOT/TON --days 90 --json

# 2. 查看可用预设
tontrader preset list --json

# 3. 用 martin-momentum 预设初始化自动研究
tontrader autoresearch init \
  --preset martin-momentum \
  --pair NOT/TON \
  --days 90 \
  --json

# 4. 运行 20 轮自动迭代
tontrader autoresearch run --track trk_abc123 --iterations 20 --json

# 5. 查看结果
tontrader autoresearch status --track trk_abc123 --json
# → 返回最优候选: sharpe=1.85, maxDD=12%, winRate=62%

# 6. Agent 分析结果，提升最优候选
tontrader autoresearch promote --track trk_abc123 --candidate cand_xyz --json
```

### 场景 2: "用 Martin Luk 的动量策略回测 DOGS"
```bash
tontrader data fetch DOGS/TON --days 60 --json
tontrader backtest run --preset martin-momentum --pair DOGS/TON --days 60 --json
# → sharpe: 1.2, maxDD: 18%, return: 32%
```

### 场景 3: "查一下 NOT 价格然后买入"
```bash
tontrader price NOT --json
tontrader swap TON NOT 5 --json        # 模拟
tontrader swap TON NOT 5 --execute --json  # 执行
```

## 7. 技术栈

| 层 | 技术 |
|----|------|
| 运行时 | Bun |
| CLI | commander |
| Schema | zod ^3 |
| TON SDK | @ton/ton, @ton/crypto, @ton/core |
| TonAPI | @ton-api/client, @ton-api/ton-adapter |
| DEX API | STON.fi REST (fetch 直调) |
| 终端 UI | chalk, cli-table3 |
| DEX SDK (P1) | @ston-fi/sdk, @ston-fi/api |

## 8. 数据模型

### OHLCV (K 线)
```json
{
  "pair": "NOT/TON",
  "interval": "1h",
  "candles": [
    { "t": 1711065600, "o": "0.0068", "h": "0.0071", "l": "0.0066", "c": "0.0070", "v": "1200000" }
  ]
}
```

### Factor 计算结果
```json
{
  "pair": "NOT/TON",
  "factors": {
    "rsi_14": [45.2, 52.1, 68.3, ...],
    "macd_signal": [0.0001, -0.0002, ...],
    "volume_ratio_20": [1.2, 0.8, 1.5, ...]
  },
  "timestamps": [1711065600, 1711069200, ...]
}
```

### Autoresearch Track (同 comp-agent)
```json
{
  "trackId": "trk_abc123",
  "title": "NOT momentum optimization",
  "status": "running",
  "baseline": {
    "strategy": "momentum-breakout",
    "params": { "lookback": 14, "threshold": 0.02, "stopLoss": 0.05 },
    "paramRanges": { "lookback": { "min": 5, "max": 30, "step": 1 } }
  },
  "candidates": [...],
  "bestMetrics": { "sharpe": 1.85, "maxDrawdown": 0.12, "totalReturn": 0.45 }
}
```

## 9. 实现优先级

### P0 — Hackathon 必须交付
1. CLI 骨架 + `--json` 输出
2. `data fetch` — 从 STON.fi 拉取并缓存价格数据
3. `factor list / compute` — RSI, MACD, momentum (3 个因子)
4. `backtest run` — 简化回测引擎（计算 sharpe, return, drawdown, winRate）
5. `preset list / show` — 内置 martin-momentum 预设
6. `autoresearch init / run / status / list` — 核心自动研究循环
7. `price / balance` — 基础市场查询
8. OpenClaw SKILL.md
9. README + demo

### P1 — 时间允许
10. `autoresearch promote / reject` — 候选管理
11. `swap` 模拟和执行
12. 更多因子 (bollinger, volatility, DEX 特有)
13. 更多策略预设 (jlaw-meanrev, dex-flow)
14. `signal evaluate` — 信号评估
15. artifact 产物管理（equity curve 图表等）

### P2 — 后续版本
16. Walk-forward 验证
17. 多 symbol 组合策略
18. 实时信号监控
19. Telegram 通知集成

## 10. 验收标准

- [ ] `tontrader data fetch NOT/TON --days 30 --json` 返回 OHLCV 数据
- [ ] `tontrader factor compute --pair NOT/TON --factors rsi,macd --json` 返回因子值
- [ ] `tontrader backtest run --preset martin-momentum --pair NOT/TON --json` 返回回测指标
- [ ] `tontrader autoresearch init + run + status` 完成一轮自动迭代
- [ ] OpenClaw 可通过 SKILL.md 驱动完整的 "数据 → 回测 → 自动研究" 流程
- [ ] 所有 `--json` 输出符合 Zod schema

## 11. 范围外

- ❌ AI/LLM 集成（OpenClaw 负责）
- ❌ Web UI / Dashboard
- ❌ 实时交易执行（仅回测和模拟）
- ❌ 多 DEX 聚合
- ❌ 跨链
