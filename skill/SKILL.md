# TonQuant

TON DeFi market research and trading CLI for AI Agents.

## Installation

```bash
# Prerequisites: Bun (https://bun.sh)
git clone <repo-url> && cd tonquant
bun install
bun link
```

After `bun link`, the `tonquant` command is available globally.

## Global Flags

| Flag | Description |
|------|------------|
| `--json` | **Required for AI agents.** Output structured JSON envelope |
| `--testnet` | Use testnet network |
| `--config <path>` | Custom config file path |
| `--help` | Show help |
| `--version` | Show version |

## Output Format

All `--json` responses use a consistent envelope:

**Success:**
```json
{ "status": "ok", "data": { ... } }
```

**Error:**
```json
{ "status": "error", "error": "description", "code": "ERROR_CODE" }
```

---

## Commands

### `price <symbol>`

Query token price on STON.fi.

```bash
tonquant price NOT --json
```

**Output (`data`):**
```json
{
  "symbol": "NOT",
  "name": "Notcoin",
  "address": "EQ...",
  "decimals": 9,
  "price_usd": "0.0068",
  "change_24h": "N/A",
  "volume_24h": "N/A"
}
```

**Errors:** `TOKEN_NOT_FOUND`

---

### `pools <tokenA>/<tokenB>`

Query trading pair pool details.

```bash
tonquant pools NOT/TON --json
```

**Output (`data`):**
```json
{
  "pool_address": "EQ...",
  "token0": { "symbol": "NOT", "reserve": "100000" },
  "token1": { "symbol": "TON", "reserve": "500" },
  "liquidity_usd": "2850.00",
  "volume_24h": "N/A",
  "fee_rate": "0.3%",
  "apy": "12.5%"
}
```

**Errors:** `TOKEN_NOT_FOUND`, `POOL_NOT_FOUND`, `INVALID_PAIR_FORMAT`

---

### `trending`

Show tokens ranked by total liquidity across pools.

```bash
tonquant trending --limit 5 --json
```

**Options:** `-n, --limit <number>` (default: 10)

**Output (`data`):**
```json
{
  "tokens": [
    { "rank": 1, "symbol": "TON", "price_usd": "3.70", "change_24h": "N/A", "volume_24h": "N/A" }
  ]
}
```

---

### `init`

Configure wallet and network.

```bash
tonquant init --mnemonic 'word1 word2 ... word24' --json
tonquant init --mnemonic 'word1 word2 ... word24' --testnet --json
```

**Options:** `--mnemonic <words>` (required, 24 words), `--testnet`

**Output (`data`):**
```json
{
  "message": "Wallet configured successfully",
  "address": "UQ...",
  "network": "mainnet"
}
```

**Errors:** `MNEMONIC_REQUIRED`, `INVALID_MNEMONIC`, `WALLET_DERIVATION_ERROR`

**Security:** Mnemonic is encrypted with AES-256-GCM and stored at `~/.tonquant/config.json` (permissions 0600).

---

### `balance`

Show wallet balance with USD values.

```bash
tonquant balance --json
tonquant balance --all --json
```

**Options:** `--all` (include all jetton balances)

**Output (`data`):**
```json
{
  "address": "UQ...",
  "network": "mainnet",
  "toncoin": { "balance": "12.5", "usd_value": "46.25" },
  "jettons": [
    { "symbol": "NOT", "balance": "5000", "usd_value": "34.00" }
  ],
  "total_usd": "80.25"
}
```

**Errors:** `WALLET_NOT_CONFIGURED`

---

### `swap <from> <to> <amount>`

Simulate a token swap on STON.fi.

```bash
tonquant swap NOT TON 1000 --json
tonquant swap TON NOT 5 --slippage 2 --json
```

**Options:** `--slippage <pct>` (default: 1), `--execute` (not yet implemented)

**Output (`data`):**
```json
{
  "type": "simulation",
  "from": { "symbol": "NOT", "amount": "1000", "amount_usd": "10.00" },
  "to": { "symbol": "TON", "expected_amount": "2.7", "amount_usd": "9.99" },
  "price_impact": "0.15%",
  "fee": "0.008",
  "minimum_received": "2.673",
  "slippage_tolerance": "1%",
  "route": ["NOT → TON"]
}
```

**Errors:** `TOKEN_NOT_FOUND`, `STONFI_SWAP_ERROR`, `NOT_IMPLEMENTED` (--execute)

---

### `research <symbol>`

Comprehensive research: price + all pools + liquidity summary.

```bash
tonquant research NOT --json
```

**Output (`data`):**
```json
{
  "token": { "symbol": "NOT", "name": "Notcoin", "price_usd": "0.01", ... },
  "pools": [
    { "pool_address": "EQ...", "token0": {...}, "token1": {...}, "liquidity_usd": "2850.00", ... }
  ],
  "summary": {
    "total_liquidity_usd": "3500.00",
    "pool_count": 2,
    "top_pair": "NOT/TON"
  }
}
```

**Errors:** `TOKEN_NOT_FOUND`

---

### `history`

View recent transaction history.

```bash
tonquant history --json
tonquant history --limit 5 --json
```

**Options:** `--limit <n>` (default: 20)

**Output (`data`):**
```json
{
  "address": "UQ...",
  "transactions": [
    { "event_id": "...", "timestamp": "2024-03-22T...", "type": "JettonTransfer", "description": "Sent 100 NOT", "status": "ok" }
  ],
  "total": 1
}
```

**Errors:** `WALLET_NOT_CONFIGURED`

---

## Agent Workflows

### 1. Research a token before buying

```bash
# Discover trending tokens
tonquant trending --limit 5 --json
# Deep-dive into the top one
tonquant research NOT --json
# Check the price
tonquant price NOT --json
# Simulate buying with 1 TON
tonquant swap TON NOT 1 --json
# Review price_impact and minimum_received before deciding
```

### 2. Check portfolio status

```bash
# Get full wallet balance
tonquant balance --all --json
# For each token with significant value, check current price
tonquant price NOT --json
tonquant price STON --json
```

### 3. Monitor market

```bash
# Check top tokens by liquidity
tonquant trending --limit 10 --json
# Check specific pools
tonquant pools NOT/TON --json
tonquant pools USDT/TON --json
```

### 4. Simulate a trade

```bash
# Check price first
tonquant price NOT --json
# Simulate swap
tonquant swap TON NOT 5 --json
# Adjust slippage if needed
tonquant swap TON NOT 5 --slippage 2 --json
```

---

## Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `TOKEN_NOT_FOUND` | Symbol not in STON.fi | Check symbol spelling (case-insensitive) |
| `POOL_NOT_FOUND` | No pool for this pair | Try different pair or check with `trending` |
| `INVALID_PAIR_FORMAT` | Wrong pair syntax | Use `TOKEN_A/TOKEN_B` format |
| `WALLET_NOT_CONFIGURED` | No wallet set up | Run `tonquant init --mnemonic '...'` |
| `MNEMONIC_REQUIRED` | Missing mnemonic flag | Provide `--mnemonic 'word1 ... word24'` |
| `INVALID_MNEMONIC` | Not 24 words | Ensure exactly 24 space-separated words |
| `WALLET_DERIVATION_ERROR` | Invalid mnemonic words | Check mnemonic is valid TON seed phrase |
| `STONFI_API_ERROR` | STON.fi API failure | Retry after 30 seconds |
| `STONFI_SWAP_ERROR` | Swap simulation failed | Check token addresses and amount |
| `TONAPI_ERROR` | TonAPI failure | Retry after 30 seconds |
| `CONFIG_LOAD_ERROR` | Corrupted config file | Delete `~/.tonquant/config.json` and re-init |
| `NOT_IMPLEMENTED` | Feature not available | Use alternative (e.g., simulate instead of execute) |
| `UNKNOWN_ERROR` | Unexpected error | Report with full error message |

## Factor Marketplace Commands

### `factor seed`

Populate registry with 15 built-in starter factors covering all categories.

```bash
tonquant factor seed --json
```

### `factor discover`

Search for factors with filters.

```bash
tonquant factor discover --category momentum --min-sharpe 1.0 --json
```

**Output (`data`):** Array of `FactorMetaPublic` objects with id, name, category, backtest metrics.

### `factor top`

Show factor leaderboard ranked by Sharpe ratio.

```bash
tonquant factor top --limit 5 --json
```

### `factor subscribe <factorId>`

Subscribe to a factor for updates.

```bash
tonquant factor subscribe mom_30d_ton --json
```

### `factor compose`

Create a weighted composite from multiple factors.

```bash
tonquant factor compose --name "Momentum Blend" --components "mom_30d_ton:0.6,vol_30d_ton:0.4" --json
```

### `factor backtest <factorId>`

Run one-click backtest for a registry factor.

```bash
tonquant factor backtest mom_30d_ton --start-date 2025-06-01 --json
```

### `factor alert-set <factorId>`

Set a threshold alert on a factor.

```bash
tonquant factor alert-set mom_30d_ton --condition above --threshold 1.5 --json
```

### `factor report-submit <factorId>`

Submit a performance report (social proof).

```bash
tonquant factor report-submit mom_30d_ton --return 15.5 --period 30d --agent-id my_agent --json
```

### `factor skill-export`

Export top factors as OpenClaw skill definitions (Markdown).

```bash
tonquant factor skill-export --limit 5 --output skill/factors.md
```

## Agent Workflow Examples

### Discovery → Subscribe → Backtest

```
1. tonquant factor seed --json                          # Populate registry
2. tonquant factor discover --min-sharpe 1.5 --json     # Find high-quality factors
3. tonquant factor subscribe <factorId> --json          # Subscribe to updates
4. tonquant factor backtest <factorId> --json           # Validate performance
```

### Compose → Alert → Report

```
1. tonquant factor compose --name "Blend" --components "mom_30d_ton:0.6,vol_30d_ton:0.4" --json
2. tonquant factor alert-set <compositeId> --condition above --threshold 1.5 --json
3. tonquant factor report-submit <factorId> --return 12.5 --period 30d --json
```

## Recommended Companion Skills

- **opennews**: Use `search_news_by_coin` to contextualize strategy performance.
  Before promoting autoresearch candidates, check recent news for the traded token.
  Before executing swaps, verify no high-impact negative news (aiRating > 80, signal = bearish).

```bash
npx skills add https://github.com/6551Team/opennews-mcp --skill opennews
```

## Limitations

- `change_24h`: Returns "N/A" — STON.fi does not provide historical price snapshots
- `volume_24h`: Returns "N/A" — STON.fi does not expose per-pool 24h volume
- `swap --execute`: Not implemented — simulation only
- Testnet: STON.fi API is mainnet-only
- Data source: STON.fi only (no multi-DEX aggregation)
