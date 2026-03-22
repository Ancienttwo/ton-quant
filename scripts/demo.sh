#!/bin/bash
set -e

echo "============================================"
echo "  TonQuant Demo — TON DeFi CLI for AI Agents"
echo "============================================"
echo ""

echo "--- 1. Discover trending tokens ---"
tonquant trending --limit 5 --json | jq .
echo ""

echo "--- 2. Get top token symbol ---"
TOP=$(tonquant trending --limit 1 --json | jq -r '.data.tokens[0].symbol')
echo "Top token: $TOP"
echo ""

echo "--- 3. Research the top token ---"
tonquant research "$TOP" --json | jq .
echo ""

echo "--- 4. Check token price ---"
tonquant price "$TOP" --json | jq .
echo ""

echo "--- 5. Check pool details ---"
tonquant pools "$TOP/TON" --json | jq . 2>/dev/null || echo "(No pool for $TOP/TON)"
echo ""

echo "--- 6. Simulate swap: 1 TON -> $TOP ---"
tonquant swap TON "$TOP" 1 --json | jq . 2>/dev/null || echo "(Swap simulation not available)"
echo ""

echo "--- 7. Check wallet balance (if configured) ---"
tonquant balance --all --json | jq . 2>/dev/null || echo "(Wallet not configured — run tonquant init first)"
echo ""

echo "============================================"
echo "  Demo Complete"
echo "============================================"
