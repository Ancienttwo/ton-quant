# TonQuant — Research Notes

## STON.fi API (v1)

Base URL: `https://api.ston.fi/v1/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/assets` | GET | List all assets with USD prices |
| `/v1/assets/{address}` | GET | Single asset details |
| `/v1/pools` | GET | List all liquidity pools |
| `/v1/pools/{address}` | GET | Single pool details |
| `/v1/swap/simulate` | POST | Simulate swap (expected output, fees, route) |

### Notes
- No authentication required for public endpoints
- Rate limits: TBD (need to test)
- Response format: JSON with nested objects

## TonAPI (v2)

Base URL: `https://tonapi.io/v2/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/accounts/{addr}` | GET | Account info + TON balance |
| `/v2/accounts/{addr}/jettons` | GET | All jetton balances |
| `/v2/accounts/{addr}/events` | GET | Transaction history |

### Notes
- Free tier available, API key optional but recommended
- Rate limits: 1 req/s without key, higher with key

## @ton/ton SDK

- `TonClient` for RPC calls
- `WalletContractV5R1` for wallet operations
- `@ton/crypto` for mnemonic → keypair derivation
- Transaction signing requires `KeyPair` from mnemonic

## Open Questions
- [ ] Exact STON.fi response shapes (need to hit real API)
- [ ] Token symbol → address mapping (STON.fi uses addresses, not symbols)
- [ ] Testnet STON.fi availability
