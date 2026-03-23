// Errors

// Config
export { ensureConfigDir, getConfigPath, loadConfig, saveConfig } from "./config/index.js";
export { ServiceError } from "./errors.js";
export {
  buildPriceIndex,
  cachedFindAssetBySymbol,
  cachedGetAssets,
  cachedGetPools,
  clearCache,
} from "./services/cache.js";
export {
  fetchBalanceData,
  fetchHistoryData,
  fetchPoolData,
  fetchPriceData,
  fetchResearchData,
  fetchSwapSimulation,
  fetchTrendingData,
} from "./services/queries.js";

// Services
export {
  findAssetBySymbol,
  findPool,
  getAssets,
  getPools,
  simulateSwap,
} from "./services/stonfi.js";
export { getBalance, getJettonBalances, getTransactions } from "./services/tonapi.js";
export { createWalletFromMnemonic, getWalletAddress, type WalletInfo } from "./services/wallet.js";
// Types — API schemas
export {
  type Asset,
  AssetSchema,
  type JettonBalance,
  JettonBalanceSchema,
  type Pool,
  PoolSchema,
  type SwapSimulateParams,
  type SwapSimulateResponse,
  SwapSimulateResponseSchema,
  type TonBalance,
  TonBalanceSchema,
  type TransactionEvent,
  TransactionEventSchema,
} from "./types/api.js";
// Types — Config
export {
  CONFIG_DIR,
  CONFIG_FILE,
  type Config,
  ConfigSchema,
} from "./types/config.js";
// Types — Domain data
export {
  type BalanceData,
  BalanceDataSchema,
  type HistoryData,
  HistoryDataSchema,
  HistoryTransactionSchema,
  type PoolData,
  PoolDataSchema,
  type PriceData,
  PriceDataSchema,
  type ResearchData,
  ResearchDataSchema,
  type SwapExecutionData,
  SwapExecutionDataSchema,
  type SwapSimulationData,
  SwapSimulationDataSchema,
  type TrendingData,
  TrendingDataSchema,
  TrendingTokenSchema,
} from "./types/data.js";
export { decrypt, encrypt, loadOrCreateKey } from "./utils/crypto.js";
// Utils
export { calcUsdValue, fromRawUnits, toRawUnits } from "./utils/units.js";
// Factor Registry Types
export type {
  FactorMetaPublic,
  FactorMetaPrivate,
  FactorRegistryEntry,
  FactorRegistryIndex,
  FactorSubscription,
  FactorPerformanceReport,
  FactorAlert,
  FactorCategory,
} from "./types/factor-registry.js";
export {
  FactorMetaPublicSchema,
  FactorMetaPrivateSchema,
  FactorRegistryEntrySchema,
  FactorRegistryIndexSchema,
  FactorCategorySchema,
  FactorIdSchema,
  FactorBacktestSummarySchema,
  FactorSubscriptionSchema,
  FactorPerformanceReportSchema,
  FactorAlertSchema,
} from "./types/factor-registry.js";
// Factor Registry Service
export {
  publishFactor,
  discoverFactors,
  subscribeFactor,
  unsubscribeFactor,
  listFactors,
  getFactorDetail,
  getFactorLeaderboard,
  DuplicateFactorError,
  FactorNotFoundError,
  BacktestValidationError,
} from "./services/registry.js";
// Factor Compose Types
export type {
  ComponentWeight,
  CompositeDefinition,
  CompositeEntry,
  CompositeIndex,
} from "./types/factor-compose.js";
export {
  ComponentWeightSchema,
  CompositeDefinitionSchema,
  CompositeEntrySchema,
  CompositeIndexSchema,
} from "./types/factor-compose.js";
// Factor Compose Service
export {
  composeFactors,
  listComposites,
  getComposite,
  deleteComposite,
  normalizeWeights,
  deriveBacktest,
  validateComponents,
  CompositionValidationError,
  DuplicateCompositeError,
  CompositeNotFoundError,
} from "./services/compose.js";
// Factor Alert Service
export {
  setAlert,
  listAlerts,
  removeAlert,
} from "./services/alerts.js";
// Factor Report Service
export {
  submitReport,
  listReports,
  ReportValidationError,
} from "./services/reports.js";
// File schemas (alerts, reports)
export { AlertsFileSchema, ReportsFileSchema } from "./types/factor-registry.js";
