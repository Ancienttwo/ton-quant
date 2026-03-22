# TonQuant — Project Brief

## What
TonQuant 是一个命令行工具，让 AI Agent（如 OpenClaw）和开发者能够在 TON 区块链上进行 DeFi 市场研究和 DEX 交易。

## Why
- TON 生态有 183 个 AI bot（4430 万 MAU），但零个 top-20 bot 进行链上交易
- OpenClaw 的 ClawHub 13,700+ skills 中没有 TON DeFi 工具
- STON.fi 有公开 API 但没有 AI Agent 友好的 CLI 封装

## Who
- **主要用户**: AI Agent（通过 shell exec 调用 + `--json` 解析）
- **次要用户**: 开发者/交易者（终端直接使用）

## Target
TON AI Agent Hackathon · 赛道 1: Agent 基础设施 ($10,000)

## Success Criteria
- 所有 P0 命令可用且 `--json` 输出符合 schema
- OpenClaw 可通过 SKILL.md 正确调用所有命令
- 至少一个端到端 demo 展示 Agent 调用 TonQuant 完成交易流程
