export type RunErrorCode =
  | 'BENCHMARK_SETTINGS_INVALID'
  | 'FUNCTION_DIR_NOT_DIRECTORY'
  | 'FUNCTION_DIR_NOT_FOUND'
  | 'INPUT_JSON_INVALID'
  | 'INVALID_WASM_FILE'
  | 'SHOPIFY_EXPORT_NOT_FOUND'
  | 'SHOPIFY_OUTPUT_INVALID'
  | 'SHOPIFY_RUNNER_EXIT_FAILED'
  | 'SHOPIFY_RUNNER_START_FAILED'
  | 'SHOPIFY_TARGET_NOT_FOUND'
  | 'SHOPIFY_WASM_NOT_FOUND'
  | 'SHOPIFY_WASM_OVERRIDE_FAILED';

export type RunErrorSource =
  | 'benchmark'
  | 'request'
  | 'shopify-config'
  | 'shopify-runner';

export interface RunErrorDetail {
  code: RunErrorCode;
  message: string;
  source: RunErrorSource;
}

export interface ShopifyRunPhaseTimings {
  cleanupMs: number;
  directoryCheckMs: number;
  functionInfoMs: number;
  functionRunnerMs: number;
  wasmPreparationMs: number;
}

export interface RunTimings {
  executionMs: number;
  parseMs: number;
  totalMs: number;
  shopifyPhases?: ShopifyRunPhaseTimings;
}

export interface BenchmarkRunResult {
  errors: RunErrorDetail[];
  executionTimeMs: number;
  index: number;
  success: boolean;
  timings: RunTimings;
  warmup: boolean;
}

export interface BenchmarkSummary {
  averageExecutionMs: number;
  averageRunnerMs: number | null;
  averageTotalMs: number;
  maxTotalMs: number;
  minTotalMs: number;
}

export interface BenchmarkResult {
  enabled: boolean;
  iterations: number;
  measuredRuns: number;
  runs: BenchmarkRunResult[];
  summary: BenchmarkSummary;
  warmupRuns: number;
}

export interface ShopifyRunDiagnostics {
  effectiveExportName: string;
  requestedExportName: string | null;
  target: string;
  targetResolved: boolean;
  usedUploadedWasm: boolean;
  wasmOverrideActive: boolean;
}

export interface RunDiagnostics {
  benchmarkEnabled: boolean;
  actualRunnerMode: 'mock' | 'shopify';
  requestedRunnerMode: 'mock' | 'shopify';
  shopify?: ShopifyRunDiagnostics;
}

export interface RunResponse {
  success: boolean;
  output: Record<string, unknown>;
  executionTimeMs: number;
  errors: string[];
  errorDetails: RunErrorDetail[];
  diagnostics: RunDiagnostics;
  timings: RunTimings;
  benchmark?: BenchmarkResult;
}
