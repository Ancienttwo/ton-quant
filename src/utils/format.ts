import chalk from "chalk";
import Table from "cli-table3";
import type {
  BalanceData,
  HistoryData,
  PoolData,
  PriceData,
  ResearchData,
  SwapSimulationData,
  TrendingData,
} from "../types/cli.js";

/**
 * Color a percentage change string green (positive) or red (negative).
 */
export function greenRed(value: string): string {
  if (value.startsWith("+")) {
    return chalk.green(value);
  }
  if (value.startsWith("-")) {
    return chalk.red(value);
  }
  return chalk.gray(value);
}

/**
 * Format price data for human-readable output.
 */
export function formatPrice(data: PriceData): string {
  const lines = [
    chalk.bold(`${data.symbol} (${data.name})`),
    `  Price:     ${chalk.cyan(`$${data.price_usd}`)}`,
    `  24h:       ${greenRed(data.change_24h)}`,
    `  Volume:    $${data.volume_24h}`,
    data.market_cap ? `  Mkt Cap:   $${data.market_cap}` : null,
    chalk.dim(`  Address:   ${data.address}`),
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * Format pool data for human-readable output.
 */
export function formatPool(data: PoolData): string {
  const table = new Table({
    head: ["Field", "Value"],
    style: { head: ["cyan"] },
  });
  table.push(
    ["Pool", data.pool_address],
    ["Token 0", `${data.token0.symbol} (reserve: ${data.token0.reserve})`],
    ["Token 1", `${data.token1.symbol} (reserve: ${data.token1.reserve})`],
    ["Liquidity", `$${data.liquidity_usd}`],
    ["Volume 24h", `$${data.volume_24h}`],
    ["Fee Rate", data.fee_rate],
    ["APY", data.apy ?? "N/A"],
  );
  return table.toString();
}

/**
 * Format trending tokens for human-readable output.
 */
export function formatTrending(data: TrendingData): string {
  const table = new Table({
    head: ["#", "Symbol", "Price (USD)", "24h Change", "Volume 24h"],
    style: { head: ["cyan"] },
  });
  for (const token of data.tokens) {
    table.push([
      token.rank,
      chalk.bold(token.symbol),
      `$${token.price_usd}`,
      greenRed(token.change_24h),
      `$${token.volume_24h}`,
    ]);
  }
  return table.toString();
}

/**
 * Format balance data for human-readable output.
 */
export function formatBalance(data: BalanceData): string {
  const lines = [
    chalk.bold(`Wallet: ${data.address}`),
    chalk.dim(`Network: ${data.network}`),
    "",
    `  TON:  ${chalk.cyan(data.toncoin.balance)} ($${data.toncoin.usd_value})`,
  ];
  for (const jetton of data.jettons) {
    lines.push(`  ${jetton.symbol}: ${chalk.cyan(jetton.balance)} ($${jetton.usd_value})`);
  }
  lines.push("", chalk.bold(`  Total: $${data.total_usd}`));
  return lines.join("\n");
}

/**
 * Format swap simulation for human-readable output.
 */
export function formatSwapSimulation(data: SwapSimulationData): string {
  const table = new Table({
    style: { head: ["cyan"] },
  });
  table.push(
    { From: `${data.from.amount} ${data.from.symbol} ($${data.from.amount_usd})` },
    { To: `${data.to.expected_amount} ${data.to.symbol} ($${data.to.amount_usd})` },
    { "Price Impact": data.price_impact },
    { Fee: data.fee },
    { "Min Received": data.minimum_received },
    { Slippage: data.slippage_tolerance },
    { Route: data.route.join(" → ") },
  );
  return `${chalk.bold("Swap Simulation")}\n${table.toString()}`;
}

/**
 * Format transaction history for human-readable output.
 */
export function formatHistory(data: HistoryData): string {
  const lines = [
    chalk.bold(`Transaction History: ${data.address}`),
    chalk.dim(`Showing ${data.transactions.length} of ${data.total} transactions`),
    "",
  ];
  const table = new Table({
    head: ["Time", "Type", "Description", "Status"],
    style: { head: ["cyan"] },
  });
  for (const tx of data.transactions) {
    table.push([
      tx.timestamp,
      tx.type,
      tx.description,
      tx.status === "ok" ? chalk.green("ok") : chalk.red(tx.status),
    ]);
  }
  lines.push(table.toString());
  return lines.join("\n");
}

/**
 * Format research report for human-readable output.
 */
export function formatResearch(data: ResearchData): string {
  const lines = [
    chalk.bold(`Research Report: ${data.token.symbol} (${data.token.name})`),
    "",
    formatPrice(data.token),
    "",
    chalk.bold("Pools:"),
  ];
  for (const pool of data.pools) {
    lines.push(
      `  ${pool.token0.symbol}/${pool.token1.symbol} — Liquidity: $${pool.liquidity_usd} — Fee: ${pool.fee_rate}`,
    );
  }
  lines.push(
    "",
    chalk.bold("Summary:"),
    `  Total Liquidity: $${data.summary.total_liquidity_usd}`,
    `  Pool Count: ${data.summary.pool_count}`,
    `  Top Pair: ${data.summary.top_pair}`,
  );
  return lines.join("\n");
}
