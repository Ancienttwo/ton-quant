# TonQuant

TON DeFi market research and trading CLI — built for AI Agents.

> **TON AI Agent Hackathon** · Track 1: Agent Infrastructure

## What is TonQuant?

A command-line tool that lets AI Agents (like OpenClaw) and developers research tokens, check wallet balances, and simulate DEX trades on the TON blockchain via STON.fi.

**Key features:**
- `--json` output for AI agent consumption
- Human-readable colored terminal output for developers
- STON.fi DEX integration (prices, pools, swap simulation)
- TonAPI integration (wallet balance, transaction history)
- Encrypted mnemonic storage (AES-256-GCM)

## Quick Start

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Clone and install
git clone <repo-url> && cd tonquant
bun install
bun link

# Try it out
tonquant trending --limit 5
tonquant price TON
tonquant pools USDT/TON
tonquant research NOT --json
```

## Commands

| Command | Description |
|---------|-------------|
| `tonquant price <symbol>` | Token price and details |
| `tonquant pools <A>/<B>` | Pool liquidity and fees |
| `tonquant trending` | Top tokens by liquidity |
| `tonquant research <symbol>` | Comprehensive research report |
| `tonquant init --mnemonic '...'` | Configure wallet |
| `tonquant balance [--all]` | Wallet balance with USD |
| `tonquant swap <from> <to> <amount>` | Simulate DEX swap |
| `tonquant history` | Transaction history |

Add `--json` to any command for structured JSON output.

See [skill/SKILL.md](skill/SKILL.md) for full command reference, JSON schemas, and Agent workflows.

## Architecture

```
CLI Layer (commander)
  price | pools | trending | init | balance | swap | research | history
    ↓
Query Layer (queries.ts)
  fetchPriceData | fetchPoolData | fetchTrendingData | fetchBalanceData | ...
    ↓
Service Layer
  stonfi.ts (STON.fi API) | tonapi.ts (TonAPI) | wallet.ts (@ton/ton SDK)
    ↓
Cache Layer (cache.ts)
  5-min TTL cache for assets/pools | price index builder
    ↓
External APIs
  STON.fi v1 | TonAPI v2 | TON blockchain
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Bun |
| Language | TypeScript (strict) |
| CLI | Commander |
| Validation | Zod |
| TON SDK | @ton/ton, @ton/crypto, @ton/core |
| DEX | STON.fi HTTP API v1 |
| Wallet API | TonAPI v2 |
| Terminal UI | chalk, cli-table3 |
| Linting | Biome |
| Testing | bun:test (101 tests, 80%+ coverage) |

## For AI Agents

TonQuant is designed as an OpenClaw skill. The `skill/SKILL.md` file teaches any MCP-compatible Agent how to:

1. Discover tokens (`trending`)
2. Research before trading (`research`, `price`, `pools`)
3. Simulate trades (`swap`)
4. Monitor portfolio (`balance --all`)

All commands support `--json` for structured parsing.

## Development

```bash
bun test              # Run tests
bun test --coverage   # With coverage report
bun run typecheck     # TypeScript check
bun run lint          # Biome linting
bun run dev           # Run CLI in dev mode
```

## License

MIT
