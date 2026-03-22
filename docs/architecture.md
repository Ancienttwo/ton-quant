# TonQuant — Architecture

## Layered Architecture

```
┌──────────────────────────────────────────────────────┐
│                    CLI Layer (commander)               │
│  price | pools | trending | init | balance | swap     │
│  Each command: parse args → call service → format out  │
├──────────────────────────────────────────────────────┤
│                    Service Layer                       │
│  stonfi.ts      → STON.fi HTTP API (fetch + Zod)      │
│  tonapi.ts      → TonAPI HTTP API (fetch + Zod)       │
│  wallet.ts      → @ton/ton SDK (mnemonic + signing)   │
├──────────────────────────────────────────────────────┤
│                    Types Layer (Zod schemas)           │
│  api.ts    → API response schemas                     │
│  config.ts → Configuration schema                     │
│  cli.ts    → CLI output envelope schemas              │
├──────────────────────────────────────────────────────┤
│                    Utils Layer                         │
│  output.ts → JSON/human output mode switcher          │
│  format.ts → chalk tables, color helpers              │
├──────────────────────────────────────────────────────┤
│                    External APIs                       │
│  STON.fi HTTP | TonAPI HTTP | TON blockchain nodes    │
└──────────────────────────────────────────────────────┘
```

## Data Flow

```
User/Agent → CLI (commander) → Service → External API
                                  ↓
                            Zod validate response
                                  ↓
                          CLI → output.ts → stdout
                                  ↓
                         --json? → envelope JSON
                         default → chalk + table
```

## Key Decisions

See `docs/decisions.md` for full ADRs.

- **No build step**: Bun runs TypeScript natively
- **fetch() over SDK**: STON.fi has no official SDK; raw fetch + Zod gives us control
- **Envelope pattern**: All JSON output wrapped in `{ status, data/error }` for AI agent parsing
