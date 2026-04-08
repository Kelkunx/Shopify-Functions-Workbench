import type { FunctionType } from "@/lib/function-templates";
import type { RunnerMode } from "@/lib/saved-fixtures";

export interface RunResponse {
  benchmark?: {
    enabled: boolean;
    iterations: number;
    measuredRuns: number;
    runs: Array<{
      errors: Array<{
        code: string;
        message: string;
        source: string;
      }>;
      executionTimeMs: number;
      index: number;
      success: boolean;
      timings: RunResponse["timings"];
      warmup: boolean;
    }>;
    summary: {
      averageExecutionMs: number;
      averageRunnerMs: number | null;
      averageTotalMs: number;
      maxTotalMs: number;
      minTotalMs: number;
    };
    warmupRuns: number;
  };
  diagnostics: {
    actualRunnerMode: RunnerMode;
    benchmarkEnabled: boolean;
    requestedRunnerMode: RunnerMode;
    shopify?: {
      effectiveExportName: string;
      requestedExportName: string | null;
      target: string;
      targetResolved: boolean;
      usedUploadedWasm: boolean;
      wasmOverrideActive: boolean;
    };
  };
  errorDetails: Array<{
    code: string;
    message: string;
    source: string;
  }>;
  success: boolean;
  output: Record<string, unknown>;
  executionTimeMs: number;
  errors: string[];
  timings: {
    executionMs: number;
    parseMs: number;
    totalMs: number;
    shopifyPhases?: {
      cleanupMs: number;
      directoryCheckMs: number;
      functionInfoMs: number;
      functionRunnerMs: number;
      wasmPreparationMs: number;
    };
  };
}

export interface RunnerFormState {
  benchmarkIterations: number;
  benchmarkWarmup: number;
  exportName: string;
  fixtureName: string;
  functionDir: string;
  functionType: FunctionType;
  inputJson: string;
  runnerMode: RunnerMode;
  selectedTemplateId: string;
  target: string;
  wasmFile: File | null;
}
