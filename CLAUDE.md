# TonQuant Development Guide

> **Developer**: ancienttwo
> **Service Target**: AI Agent (OpenClaw) and Developers
> **Plan**: K · TON DeFi CLI · tier=custom
> **Stack**: Bun + TypeScript + Commander + TON SDK + STON.fi API
> **Runtime Profile**: Plan-only | Balanced shared hooks

---

## Iron Rules

### 1. Good Taste
- Prefer data structures over branch explosion.
- More than 3 branches or nesting levels is a refactor signal.

### 2. Pragmatism
- Solve real constraints first.
- Keep defaults inferred; ask only override-level questions.

### 3. Zero Compatibility Debt
- No compatibility shims as default behavior.
- Use deprecation + replacement routing instead of hidden forks.

### 4. Project-Specific Prohibitions

- **No `any`** in production code — use Zod inference or explicit types
- **No `console.log`** in production code — use `src/utils/output.ts`
- **Never log or output mnemonic/private key material**
- **Always validate API responses with Zod** before consuming
- **Always use `{ status, data/error }` envelope** for CLI output
- **Never mutate objects** — create new instances (immutability)
- **No hardcoded API URLs** — use constants in service files

### 5. Detailed Standards (On Demand)

Load these only when needed:
- `docs/reference-configs/coding-standards.md`
- `docs/reference-configs/development-protocol.md`

---

## Project Structure

```
tonquant/
├── src/
│   ├── index.ts              # Entry point — CLI setup with Commander
│   ├── cli/                  # Command definitions (one file per command)
│   │   ├── price.ts          # P0: token price query
│   │   ├── pools.ts          # P0: liquidity pool details
│   │   ├── trending.ts       # P0: trending tokens
│   │   ├── init.ts           # P0: wallet configuration
│   │   ├── balance.ts        # P0: wallet balance
│   │   ├── swap.ts           # P0: swap simulation / P1: execution
│   │   ├── research.ts       # P1: comprehensive research
│   │   └── history.ts        # P1: transaction history
│   ├── services/             # API clients (STON.fi, TonAPI, wallet)
│   ├── types/                # Zod schemas + TypeScript types
│   ├── config/               # Configuration management
│   └── utils/                # Output formatting, color helpers
├── tests/                    # Mirrors src/ structure
├── tasks/                    # AI workflow contract
├── plans/                    # Timestamped implementation plans
└── docs/                     # Architecture, decisions, PRD
```

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Runtime    | Bun (latest)                        |
| Language   | TypeScript (strict)                 |
| CLI        | Commander ^13                       |
| Validation | Zod ^3.24                           |
| TON SDK    | @ton/ton, @ton/crypto, @ton/core    |
| DEX API    | STON.fi HTTP API v1                 |
| Terminal UI| chalk, cli-table3                   |
| Lint/Format| Biome                               |
| Testing    | bun:test                            |

## Workflow

### Plan Annotation Protocol

Use `tasks/research.md` for deep codebase understanding, `plans/` for timestamped plans, and `tasks/todo.md` for active execution.

```yaml
PLAN_LOOP:
  MODE: Plan-only
  PHASES: research -> plan -> annotate -> todo -> implement -> verify -> feedback
  RESEARCH_FILE: tasks/research.md
  PLAN_DIR: plans/
  PLAN_ARCHIVE: plans/archive/
  ACTIVE_PLAN_RULE: latest timestamped file in plans/
  PRIMARY_FILE: tasks/todo.md
  TODO_ARCHIVE: tasks/archive/
  CONTRACT_DIR: tasks/contracts/
  LESSONS_FILE: tasks/lessons.md
  ANNOTATION_GUARD: do not implement until plan Status is "Approved"
  CONTRACT_GUARD: do not mark done until contract exit criteria pass
  COMMIT_POLICY: explicit commits after green checks; no automatic checkpoint hook
```

### Task Management Protocol

- Treat `tasks/` as the primary cross-agent contract; hooks are enhancements, not the only enforcement layer.
- Research deeply first for unfamiliar areas and persist findings in `tasks/research.md`.
- Plan in `plans/plan-YYYYMMDD-HHMM-{slug}.md` with explicit trade-offs and task breakdown.
- Extract approved plan tasks into `tasks/todo.md`.
- Create `tasks/contracts/{slug}.contract.md` with machine-verifiable exit criteria.
- Mark done only with verification evidence.
- Convert user corrections into prevention rules in `tasks/lessons.md`.
- Use `docs/PROGRESS.md` for milestone updates only, not the active execution log.
