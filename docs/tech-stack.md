# TonQuant — Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Runtime | Bun | latest | 原生 TS 执行，无需构建步骤，10x 快于 npm |
| Language | TypeScript | strict | 类型安全，Zod 推理 |
| CLI | Commander | ^13 | 成熟的 CLI 框架，子命令+选项支持 |
| Validation | Zod | ^3.24 | Schema 定义 + 运行时验证 + TS 类型推理 |
| TON SDK | @ton/ton, @ton/crypto, @ton/core | latest | 官方 SDK，钱包操作+交易签名 |
| DEX API | STON.fi HTTP API | v1 | TON 最大 DEX，公开 API |
| Wallet API | TonAPI | v2 | 余额查询+交易历史 |
| Terminal UI | chalk, cli-table3 | latest | 彩色输出+表格展示 |
| Lint/Format | Biome | latest | Rust 构建，30x 快于 ESLint |
| Testing | bun:test | built-in | Bun 内置测试框架 |
