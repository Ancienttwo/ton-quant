# TonQuant — Project Brief

## What
TonQuant 是一个面向 AI Agent 的 TON 量化研究 CLI。它分成两层产品能力：

- **Phase 0**: 轻量 TON DeFi 支持命令，用于价格、池子、余额、swap 模拟和市场摘要
- **Phase 1**: quant-first 命令面，用于数据抓取、因子计算、回测、预设和 autoresearch

## Why

- TON 生态缺少可被 Agent 稳定调用的量化研究基础设施
- 仅有市场查询命令不足以支撑“数据 -> 因子 -> 回测 -> 自动迭代”的研究闭环
- `comp-agent` 已经验证了 quant 子系统的高价值边界：typed schemas、runner、artifact/state contract
- TonQuant 的机会不是再做一个 DEX 信息工具，而是把 TON 市场接到这条量化流水线上

## Who

- **主要用户**: AI Agent，通过 shell exec + `--json` 消费稳定输出
- **次要用户**: 开发者、研究者、交易者，在终端直接运行量化工作流

## Product Direction

- 当前支持命令保留，用于钱包和市场观察
- 主产品方向转为 TON quant research CLI
- 文档和代码结构都以 `src/quant/` 作为后续主线边界

## Target

TON AI Agent Hackathon · 赛道 1: Agent 基础设施 ($10,000)

## Success Criteria

- Agent 可运行至少一个完整 quant 流程:
  - `data fetch -> factor compute -> backtest run`
- Agent 可初始化并运行一个 TON autoresearch track
- 现有 `price` / `balance` 等支持命令继续可用，不要求走 quant runner
- Quant 相关命令、类型和 artifact/state contract 在文档与代码中保持一致
