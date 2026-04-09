# TonQuant — Project Brief

## What

TonQuant 是一个面向 AI Agent 的多市场量化研究运行时，TON 是首个强绑定的 factor marketplace 与交易落地点。产品分三个阶段演进：

- **Phase 0**: 轻量 TON DeFi 支持命令，用于价格、池子、余额、swap 模拟和市场摘要
- **Phase 1**: 多市场 quant-first 命令面，用于数据抓取、因子计算、回测、预设和 autoresearch
- **Phase 2**: 建在 TON 上的 Agent-native Factor Marketplace — 因子注册、发现、组合、排行、回测验证和社交证明

## Vision

TonQuant 成为 **”npm for trading factors”** — 一个任何 AI Agent 框架都能原生消费的开放因子协议。研究层不绑定单一市场，负责跨市场数据、因子、回测和 autoresearch；TON 负责 factor 发布、交易叙事和分发落地。Factor 创建者发布、验证、获得收入；AI Agent 不仅消费因子，还能从市场数据中自动生成新因子并发布回去，形成自我改善的因子库。

**理想态**: 用户说 “find me alpha” → AI Agent 在多市场研究层中抓数据、算因子、做回测，再把可交易的 factor 发布到 TON registry。其他 Agent 用实盘验证。因子创建者获得被动收入。新因子从市场异常中自动生成。

## Why

- 市场侧缺少可被 Agent 稳定调用的多市场量化研究基础设施
- 仅有市场查询命令不足以支撑”数据 -> 因子 -> 回测 -> 自动迭代”的研究闭环
- `comp-agent` 已经验证了 quant 子系统的高价值边界：typed schemas、runner、artifact/state contract
- TonQuant 的机会不是再做一个 DEX 信息工具，而是先把 TON 作为 factor marketplace 与 execution surface，接到更通用的量化研究流水线上
- **现有量化策略市场 (QuantConnect, 3Commas) 都是人类 UI 优先**，没有 agent-consumable 的因子注册表
- **Factor > Strategy 经济学**: 因子的 alpha 衰减比策略慢，可组合性更强，更适合作为 marketplace 的原子单元

## Who

- **主要用户**: AI Agent，通过 shell exec + `--json` 消费稳定输出
- **次要用户**: 开发者、研究者、交易者，在终端直接运行量化工作流
- **Phase 2 新增**: AI Agent 开发者（集成 TON factor registry 到自己的 Agent）、因子创建者（发布和变现）

## Product Direction

- Phase 0 支持命令保留，用于钱包和市场观察
- Phase 1 多市场 quant research CLI 作为基础量化能力层
- **Phase 2 TON Factor Marketplace 作为主产品方向** — 从 CLI 工具扩展为 agent-native factor marketplace
- 分发模式: Agent-First Registry + OpenClaw Skill 打包（A+C 模式）
- OpenClaw 增长同时驱动 Agent 开发者和 Crypto 新手两个用户群

## Target

- TON AI Agent Hackathon · 赛道 1: Agent 基础设施 ($10,000)（截止 2026-03-25）
- Post-hackathon: Factor Marketplace 成为独立产品方向

## Success Criteria

### Phase 1 (Hackathon)
- Agent 可运行至少一个完整 quant 流程:
  - `data fetch -> factor compute -> backtest run`
- Agent 可初始化并运行一个多市场 autoresearch track
- 现有 `price` / `balance` 等支持命令继续可用，不要求走 quant runner
- Quant 相关命令、类型和 artifact/state contract 在文档与代码中保持一致

### Phase 2 (Factor Marketplace)
- Factor registry 支持 publish / discover / subscribe / update / list
- `factor top` 展示因子排行榜（按期间排名）
- `factor compose` 支持加权因子组合（因子代数）
- `factor backtest` 一键回测验证
- `factor alert` 支持阈值通知
- `factor report` 支持 Agent 提交实盘表现数据
- Top factors 打包为 OpenClaw skills
