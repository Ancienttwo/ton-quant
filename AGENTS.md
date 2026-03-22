# AGENTS Operating Guide: TonQuant

> **Developer**: ancienttwo
> **Service Target**: AI Agent (OpenClaw) and Developers
> **Plan**: K · TON DeFi CLI · tier=custom

---

## Operating Mode

**Mode**: Plan-only — all changes require explicit plan approval before implementation.

---

## Task Management Protocol

```yaml
TASK_SOURCES:
  - tasks/research.md
  - tasks/todo.md
  - tasks/contracts/
  - tasks/lessons.md
  - plans/
  - docs/PROGRESS.md

PHASES: research -> plan -> annotate -> todo -> implement -> verify -> feedback

ARCHIVE:
  PLAN: plans/archive/
  TODO: tasks/archive/

RULES:
  - Treat repo-local tasks/ files as the primary cross-agent workflow contract
  - For non-chat tasks, sync tasks/ whenever substantive work changes the repo
  - Research first for unfamiliar areas and persist findings in tasks/research.md
  - Plan with trade-offs in plans/plan-{timestamp}-{slug}.md
  - Treat the latest non-archived plans/plan-*.md file as the active plan
  - Extract approved plan tasks into tasks/todo.md
  - Define task contracts in tasks/contracts/{slug}.contract.md
  - Verify contracts before claiming completion
  - Track progress with verification evidence in tasks/todo.md
  - Record correction-derived prevention rules in tasks/lessons.md
  - Treat .ai/hooks/ as the shared automation entrypoint
  - Treat .claude/settings.json as the Claude-specific adapter, not the cross-agent source of truth
  - Use docs/PROGRESS.md for milestones only, not active execution logs

ACTIVE_PLAN:
  - plans/ is the single source of truth for the current active plan
```

---

## Coding Constraints

### Immutability
- ALWAYS create new objects; NEVER mutate existing ones
- Use spread operators or functional updates

### Validation
- ALL external data (API responses, user input, config files) must be validated with Zod schemas
- Schemas live in `src/types/`

### Security
- NEVER log or output mnemonic phrases, private keys, or seed data
- Config file permissions: `0o600`
- No hardcoded secrets — use environment variables or encrypted config

### Output
- Every CLI command must support `--json` flag
- JSON output uses `{ status: "ok", data }` or `{ status: "error", error, code }` envelope
- Human output uses chalk colors and cli-table3 tables

### Error Handling
- All errors return structured `CliError` — never crash with unhandled exceptions
- Service layer catches HTTP errors and wraps them
- CLI layer formats errors for the active output mode (JSON or human)

---

## Quality & Safety

### Before Claiming Completion
- [ ] `bun typecheck` passes
- [ ] `bun lint` passes
- [ ] `bun test` passes with 80%+ coverage
- [ ] No hardcoded secrets
- [ ] All API responses validated with Zod
- [ ] `--json` output matches PRD schemas (docs/PRD.md section 5.3)
