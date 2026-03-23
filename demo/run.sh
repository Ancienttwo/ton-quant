#!/bin/bash
# TonQuant Demo Runner
# Usage: ./demo/run.sh
# Records with asciinema if available, otherwise just runs the demo.
#
# Tip: Run in a terminal with dark background (#0A0E14) and JetBrains Mono font.

set -e

DELAY=1.5  # seconds between commands
TYPE_DELAY=0.03  # seconds between characters

# Simulate typing a command
type_cmd() {
  local cmd="$1"
  printf "\n\033[1;33m\$\033[0m "
  for (( i=0; i<${#cmd}; i++ )); do
    printf "%s" "${cmd:$i:1}"
    sleep $TYPE_DELAY
  done
  printf "\n"
  sleep 0.3
}

# Run a command with typing effect
run() {
  type_cmd "$1"
  eval "$1"
  sleep "$DELAY"
}

# Section header
section() {
  printf "\n\033[1;36m━━━ %s ━━━\033[0m\n" "$1"
  sleep 1
}

clear

# Title
printf "\n"
printf "  \033[1;36m╔══════════════════════════════════════════════╗\033[0m\n"
printf "  \033[1;36m║\033[0m  \033[1;37mTonQuant\033[0m — AI Quant Research for TON       \033[1;36m║\033[0m\n"
printf "  \033[1;36m║\033[0m  \033[2mTON AI Agent Hackathon · Track 1\033[0m            \033[1;36m║\033[0m\n"
printf "  \033[1;36m╚══════════════════════════════════════════════╝\033[0m\n"
sleep 2

# Scene 1: Help
section "Available Commands"
run "tonquant --help"

# Scene 2: Market check
section "Market Check"
run "tonquant price TON"
run "tonquant trending --limit 5"

# Scene 3: Quant tools
section "Quant Tools"
run "tonquant factor list"
run "tonquant preset list"

# Scene 4: The main event
section "Agent-Driven Research Loop"
printf "\n\033[2m  One command → data → factors → backtest → report\033[0m\n"
sleep 1
run "tonquant autoresearch run --asset TON/USDT --factors rsi,macd,volatility"

# Scene 5: Show report
section "Generated Report"
LATEST=$(ls -td ~/.tonquant/quant/autoresearch-runs/orch-* 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
  run "head -25 $LATEST/report.md"
fi

# Scene 6: JSON output
section "JSON for AI Agents"
run "tonquant preset show momentum-ton --json"

# Closing
printf "\n"
printf "  \033[1;36m╔══════════════════════════════════════════════╗\033[0m\n"
printf "  \033[1;36m║\033[0m                                              \033[1;36m║\033[0m\n"
printf "  \033[1;36m║\033[0m  \033[1;37mbun install -g tonquant\033[0m                     \033[1;36m║\033[0m\n"
printf "  \033[1;36m║\033[0m  \033[2mhttps://tonquant.com\033[0m                        \033[1;36m║\033[0m\n"
printf "  \033[1;36m║\033[0m                                              \033[1;36m║\033[0m\n"
printf "  \033[1;36m╚══════════════════════════════════════════════╝\033[0m\n"
printf "\n"
sleep 3
