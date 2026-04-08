import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import type { Stats } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MockFunctionRunnerService } from './mock-function-runner.service';
import { RunRequestParserService } from './run-request-parser.service';
import { ShopifyFunctionRunnerService } from './shopify-function-runner.service';
import { type ParsedRunRequest } from './types/parsed-run-request.type';
import { type RunFunctionParams } from './types/run-function-params.type';
import {
  type BenchmarkResult,
  type BenchmarkRunResult,
  type BenchmarkSummary,
  type RunDiagnostics,
  type RunErrorCode,
  type RunErrorDetail,
  type RunErrorSource,
  type RunResponse,
  type RunTimings,
  type ShopifyRunDiagnostics,
  type ShopifyRunPhaseTimings,
} from './types/run-response.type';
import { type UploadedWasmFile } from './types/uploaded-wasm-file.type';

interface TemporaryWasmArtifact {
  directoryPath: string;
  wasmPath: string;
}

interface SingleRunExecutionResult {
  diagnostics: RunDiagnostics;
  errorDetails: RunErrorDetail[];
  output: Record<string, unknown>;
  success: boolean;
  timings: RunTimings;
}

interface ShopifyExecutionResult {
  diagnostics: ShopifyRunDiagnostics;
  output: Record<string, unknown>;
  shopifyPhases: ShopifyRunPhaseTimings;
}

class RunFailure extends Error {
  constructor(
    readonly code: RunErrorCode,
    readonly source: RunErrorSource,
    message: string,
  ) {
    super(message);
    this.name = 'RunFailure';
  }
}

@Injectable()
export class RunService {
  private readonly directoryCheckCache = new Map<string, Promise<void>>();

  constructor(
    private readonly mockFunctionRunner: MockFunctionRunnerService,
    private readonly runRequestParser: RunRequestParserService,
    private readonly shopifyFunctionRunner: ShopifyFunctionRunnerService,
  ) {}

  async runFunction({
    benchmarkIterations,
    benchmarkWarmup,
    wasmFile,
    inputJson,
    functionType,
    functionDir,
    target,
    exportName,
  }: RunFunctionParams): Promise<RunResponse> {
    const requestStartTime = process.hrtime.bigint();
    const parseStartTime = process.hrtime.bigint();
    const requestedRunnerMode = this.getRequestedRunnerMode({
      functionDir,
      target,
    });
    const { errorDetails, parsedRequest } = this.runRequestParser.parse({
      benchmarkIterations,
      benchmarkWarmup,
      exportName,
      functionDir,
      functionType,
      inputJson,
      target,
      wasmFile,
    });
    const parseMs = this.measureElapsedMs(parseStartTime);

    if (errorDetails.length > 0 || !parsedRequest) {
      return this.buildResponse({
        diagnostics: {
          actualRunnerMode: requestedRunnerMode,
          benchmarkEnabled: false,
          requestedRunnerMode,
        },
        errorDetails,
        output: {},
        requestStartTime,
        timings: {
          executionMs: 0,
          parseMs,
          totalMs: this.measureElapsedMs(requestStartTime),
        },
      });
    }

    if (parsedRequest.benchmarkEnabled) {
      return this.runBenchmark(parsedRequest, parseMs, requestStartTime);
    }

    const singleRunResult = await this.executeSingleRun(
      parsedRequest,
      parseMs,
      requestedRunnerMode,
    );

    return this.buildResponse({
      diagnostics: singleRunResult.diagnostics,
      errorDetails: singleRunResult.errorDetails,
      output: singleRunResult.output,
      requestStartTime,
      timings: singleRunResult.timings,
    });
  }

  private async runBenchmark(
    parsedRequest: ParsedRunRequest,
    parseMs: number,
    requestStartTime: bigint,
  ): Promise<RunResponse> {
    const benchmarkRuns: BenchmarkRunResult[] = [];
    const totalRuns =
      parsedRequest.benchmarkIterations + parsedRequest.benchmarkWarmup;
    let finalRunResult: SingleRunExecutionResult | null = null;

    for (let index = 0; index < totalRuns; index += 1) {
      const runResult = await this.executeSingleRun(
        parsedRequest,
        parseMs,
        parsedRequest.hasRealRunnerConfig ? 'shopify' : 'mock',
      );

      benchmarkRuns.push({
        errors: runResult.errorDetails,
        executionTimeMs: Number(runResult.timings.totalMs.toFixed(3)),
        index,
        success: runResult.success,
        timings: this.normalizeTimings(runResult.timings),
        warmup: index < parsedRequest.benchmarkWarmup,
      });
      finalRunResult = runResult;

      if (!runResult.success) {
        break;
      }
    }

    const measuredRuns = benchmarkRuns.filter((run) => !run.warmup);
    const benchmarkSummary = this.buildBenchmarkSummary(measuredRuns);
    const lastRun =
      finalRunResult ??
      ({
        diagnostics: {
          actualRunnerMode: parsedRequest.hasRealRunnerConfig
            ? 'shopify'
            : 'mock',
          benchmarkEnabled: true,
          requestedRunnerMode: parsedRequest.hasRealRunnerConfig
            ? 'shopify'
            : 'mock',
        },
        errorDetails: [],
        output: {},
        success: false,
        timings: {
          executionMs: 0,
          parseMs,
          totalMs: 0,
        },
      } satisfies SingleRunExecutionResult);

    const benchmark: BenchmarkResult = {
      enabled: true,
      iterations: parsedRequest.benchmarkIterations,
      measuredRuns: measuredRuns.length,
      runs: benchmarkRuns,
      summary: benchmarkSummary,
      warmupRuns: parsedRequest.benchmarkWarmup,
    };

    return this.buildResponse({
      benchmark,
      diagnostics: {
        ...lastRun.diagnostics,
        benchmarkEnabled: true,
      },
      errorDetails: lastRun.errorDetails,
      output: lastRun.output,
      requestStartTime,
      timings: {
        ...lastRun.timings,
        totalMs: this.measureElapsedMs(requestStartTime),
      },
    });
  }

  private async executeSingleRun(
    parsedRequest: ParsedRunRequest,
    parseMs: number,
    requestedRunnerMode: 'mock' | 'shopify',
  ): Promise<SingleRunExecutionResult> {
    const executionStartTime = process.hrtime.bigint();

    try {
      if (parsedRequest.hasRealRunnerConfig) {
        const shopifyResult = await this.executeShopifyRunner({
          exportName: parsedRequest.trimmedExportName,
          functionDir: parsedRequest.trimmedFunctionDir!,
          parsedInput: parsedRequest.parsedInput,
          target: parsedRequest.trimmedTarget!,
          wasmFile: parsedRequest.wasmFile,
        });

        return {
          diagnostics: {
            actualRunnerMode: 'shopify',
            benchmarkEnabled: parsedRequest.benchmarkEnabled,
            requestedRunnerMode,
            shopify: shopifyResult.diagnostics,
          },
          errorDetails: [],
          output: shopifyResult.output,
          success: true,
          timings: {
            executionMs: this.measureElapsedMs(executionStartTime),
            parseMs,
            shopifyPhases: shopifyResult.shopifyPhases,
            totalMs: parseMs + this.measureElapsedMs(executionStartTime),
          },
        };
      }

      const output = this.mockFunctionRunner.run({
        functionType: parsedRequest.normalizedFunctionType,
        requestedFunctionType: parsedRequest.requestedFunctionType,
        parsedInput: parsedRequest.parsedInput,
        wasmFile: parsedRequest.wasmFile,
      });
      const executionMs = this.measureElapsedMs(executionStartTime);

      return {
        diagnostics: {
          actualRunnerMode: 'mock',
          benchmarkEnabled: parsedRequest.benchmarkEnabled,
          requestedRunnerMode,
        },
        errorDetails: [],
        output,
        success: true,
        timings: {
          executionMs,
          parseMs,
          totalMs: parseMs + executionMs,
        },
      };
    } catch (error) {
      const executionMs = this.measureElapsedMs(executionStartTime);
      const failure = this.toRunFailure(error);

      return {
        diagnostics: {
          actualRunnerMode: parsedRequest.hasRealRunnerConfig
            ? 'shopify'
            : 'mock',
          benchmarkEnabled: parsedRequest.benchmarkEnabled,
          requestedRunnerMode,
        },
        errorDetails: [failure],
        output: {},
        success: false,
        timings: {
          executionMs,
          parseMs,
          totalMs: parseMs + executionMs,
        },
      };
    }
  }

  private async executeShopifyRunner({
    exportName,
    functionDir,
    parsedInput,
    target,
    wasmFile,
  }: {
    exportName?: string;
    functionDir: string;
    parsedInput: Record<string, unknown>;
    target: string;
    wasmFile?: UploadedWasmFile;
  }): Promise<ShopifyExecutionResult> {
    const directoryCheckStartTime = process.hrtime.bigint();
    await this.assertDirectoryExists(functionDir);
    const directoryCheckMs = this.measureElapsedMs(directoryCheckStartTime);

    const functionInfoStartTime = process.hrtime.bigint();
    const functionInfo =
      await this.shopifyFunctionRunner.getFunctionInfo(functionDir);
    const functionInfoMs = this.measureElapsedMs(functionInfoStartTime);
    const targetConfig = functionInfo.targeting[target];
    const queryPath = targetConfig?.inputQueryPath;

    if (!queryPath) {
      throw new RunFailure(
        'SHOPIFY_TARGET_NOT_FOUND',
        'shopify-config',
        `Unknown target "${target}" for functionDir "${functionDir}".`,
      );
    }

    const effectiveExportName = this.resolveExportName(
      exportName,
      targetConfig?.export,
    );
    const wasmPreparationStartTime = process.hrtime.bigint();
    const temporaryWasmArtifact = await this.writeTemporaryWasmFile(wasmFile);
    const wasmPreparationMs = this.measureElapsedMs(wasmPreparationStartTime);
    const wasmPath = temporaryWasmArtifact?.wasmPath ?? functionInfo.wasmPath;

    if (!temporaryWasmArtifact) {
      await this.assertWasmExists(wasmPath);
    }

    let cleanupMs = 0;
    let functionRunnerMs = 0;
    let output: Record<string, unknown> = {};

    try {
      const functionRunnerStartTime = process.hrtime.bigint();
      const result = await this.shopifyFunctionRunner.runFunction(
        {
          export: effectiveExportName,
          expectedOutput: {},
          input: parsedInput,
          target,
        },
        functionInfo.functionRunnerPath,
        wasmPath,
        queryPath,
        functionInfo.schemaPath,
      );
      functionRunnerMs = this.measureElapsedMs(functionRunnerStartTime);

      if (result.error) {
        throw this.mapShopifyRunnerError(result.error);
      }

      output = result.result?.output ?? {};
    } finally {
      if (temporaryWasmArtifact) {
        const cleanupStartTime = process.hrtime.bigint();
        await fs
          .rm(temporaryWasmArtifact.directoryPath, {
            force: true,
            recursive: true,
          })
          .catch(() => undefined);
        cleanupMs = this.measureElapsedMs(cleanupStartTime);
      }
    }

    return {
      diagnostics: {
        effectiveExportName,
        requestedExportName: exportName?.trim() || null,
        target,
        targetResolved: true,
        usedUploadedWasm: Boolean(wasmFile?.buffer?.length),
        wasmOverrideActive: Boolean(temporaryWasmArtifact),
      },
      output,
      shopifyPhases: {
        cleanupMs,
        directoryCheckMs,
        functionInfoMs,
        functionRunnerMs,
        wasmPreparationMs,
      },
    };
  }

  private buildResponse({
    benchmark,
    diagnostics,
    errorDetails,
    output,
    requestStartTime,
    timings,
  }: {
    benchmark?: BenchmarkResult;
    diagnostics: RunDiagnostics;
    errorDetails: RunErrorDetail[];
    output: Record<string, unknown>;
    requestStartTime: bigint;
    timings: RunTimings;
  }): RunResponse {
    const normalizedTimings = this.normalizeTimings({
      ...timings,
      totalMs: benchmark
        ? timings.totalMs
        : this.measureElapsedMs(requestStartTime),
    });

    return {
      benchmark,
      diagnostics,
      errorDetails,
      errors: errorDetails.map((errorDetail) => errorDetail.message),
      executionTimeMs: normalizedTimings.totalMs,
      output,
      success: errorDetails.length === 0,
      timings: normalizedTimings,
    };
  }

  private buildBenchmarkSummary(runs: BenchmarkRunResult[]): BenchmarkSummary {
    if (runs.length === 0) {
      return {
        averageExecutionMs: 0,
        averageRunnerMs: null,
        averageTotalMs: 0,
        maxTotalMs: 0,
        minTotalMs: 0,
      };
    }

    const totalValues = runs.map((run) => run.timings.totalMs);
    const executionValues = runs.map((run) => run.timings.executionMs);
    const runnerValues = runs
      .map((run) => run.timings.shopifyPhases?.functionRunnerMs)
      .filter((value): value is number => typeof value === 'number');

    return {
      averageExecutionMs: this.average(executionValues),
      averageRunnerMs:
        runnerValues.length > 0 ? this.average(runnerValues) : null,
      averageTotalMs: this.average(totalValues),
      maxTotalMs: Math.max(...totalValues),
      minTotalMs: Math.min(...totalValues),
    };
  }

  private normalizeTimings(timings: RunTimings): RunTimings {
    return {
      ...timings,
      executionMs: Number(timings.executionMs.toFixed(3)),
      parseMs: Number(timings.parseMs.toFixed(3)),
      shopifyPhases: timings.shopifyPhases
        ? {
            cleanupMs: Number(timings.shopifyPhases.cleanupMs.toFixed(3)),
            directoryCheckMs: Number(
              timings.shopifyPhases.directoryCheckMs.toFixed(3),
            ),
            functionInfoMs: Number(
              timings.shopifyPhases.functionInfoMs.toFixed(3),
            ),
            functionRunnerMs: Number(
              timings.shopifyPhases.functionRunnerMs.toFixed(3),
            ),
            wasmPreparationMs: Number(
              timings.shopifyPhases.wasmPreparationMs.toFixed(3),
            ),
          }
        : undefined,
      totalMs: Number(timings.totalMs.toFixed(3)),
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    return Number(
      (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(
        3,
      ),
    );
  }

  private mapShopifyRunnerError(errorMessage: string): RunFailure {
    if (errorMessage.startsWith('function-runner failed to start:')) {
      return new RunFailure(
        'SHOPIFY_RUNNER_START_FAILED',
        'shopify-runner',
        errorMessage,
      );
    }

    if (errorMessage.includes('failed to find function export')) {
      return new RunFailure(
        'SHOPIFY_EXPORT_NOT_FOUND',
        'shopify-runner',
        errorMessage,
      );
    }

    if (errorMessage.includes("missing 'output' field")) {
      return new RunFailure(
        'SHOPIFY_OUTPUT_INVALID',
        'shopify-runner',
        errorMessage,
      );
    }

    if (errorMessage.startsWith('Failed to parse function-runner output:')) {
      return new RunFailure(
        'SHOPIFY_OUTPUT_INVALID',
        'shopify-runner',
        errorMessage,
      );
    }

    return new RunFailure(
      'SHOPIFY_RUNNER_EXIT_FAILED',
      'shopify-runner',
      errorMessage,
    );
  }

  private toRunFailure(error: unknown): RunErrorDetail {
    if (error instanceof RunFailure) {
      return {
        code: error.code,
        message: error.message,
        source: error.source,
      };
    }

    const message =
      error instanceof Error ? error.message : 'Unknown runner error.';

    return {
      code: 'SHOPIFY_RUNNER_EXIT_FAILED',
      message,
      source: 'shopify-runner',
    };
  }

  private resolveExportName(
    exportName: string | undefined,
    targetExportName: string | undefined,
  ): string {
    const trimmedExportName = exportName?.trim();

    if (!targetExportName) {
      return trimmedExportName || 'run';
    }

    if (
      !trimmedExportName ||
      trimmedExportName === 'run' ||
      trimmedExportName === `run${targetExportName}`
    ) {
      return targetExportName;
    }

    return trimmedExportName;
  }

  private getRequestedRunnerMode({
    functionDir,
    target,
  }: {
    functionDir?: string;
    target?: string;
  }): 'mock' | 'shopify' {
    return functionDir?.trim() || target?.trim() ? 'shopify' : 'mock';
  }

  private measureElapsedMs(startTime: bigint): number {
    return Number(process.hrtime.bigint() - startTime) / 1_000_000;
  }

  private async assertDirectoryExists(functionDir: string): Promise<void> {
    const cachedDirectoryCheck = this.directoryCheckCache.get(functionDir);

    if (cachedDirectoryCheck) {
      return cachedDirectoryCheck;
    }

    const directoryCheckPromise = this.validateDirectory(functionDir).catch(
      (error) => {
        this.directoryCheckCache.delete(functionDir);
        throw error;
      },
    );

    this.directoryCheckCache.set(functionDir, directoryCheckPromise);

    return directoryCheckPromise;
  }

  private async validateDirectory(functionDir: string): Promise<void> {
    let stat: Stats;

    try {
      stat = await fs.stat(functionDir);
    } catch {
      throw new RunFailure(
        'FUNCTION_DIR_NOT_FOUND',
        'shopify-config',
        `functionDir does not exist: ${functionDir}`,
      );
    }

    if (!stat.isDirectory()) {
      throw new RunFailure(
        'FUNCTION_DIR_NOT_DIRECTORY',
        'shopify-config',
        `functionDir is not a directory: ${functionDir}`,
      );
    }
  }

  private async assertWasmExists(wasmPath: string): Promise<void> {
    try {
      const wasmStat = await fs.stat(wasmPath);

      if (!wasmStat.isFile()) {
        throw new Error('not a file');
      }
    } catch {
      throw new RunFailure(
        'SHOPIFY_WASM_NOT_FOUND',
        'shopify-config',
        `No built Wasm file was found at "${wasmPath}". Build the Shopify function or provide a Wasm override.`,
      );
    }
  }

  private async writeTemporaryWasmFile(
    wasmFile?: UploadedWasmFile,
  ): Promise<TemporaryWasmArtifact | null> {
    if (!wasmFile?.buffer?.length) {
      return null;
    }

    try {
      const temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'shopify-function-runner-'),
      );
      const temporaryWasmPath = path.join(
        temporaryDirectory,
        'uploaded-function.wasm',
      );

      await fs.writeFile(temporaryWasmPath, wasmFile.buffer);

      return {
        directoryPath: temporaryDirectory,
        wasmPath: temporaryWasmPath,
      };
    } catch {
      throw new RunFailure(
        'SHOPIFY_WASM_OVERRIDE_FAILED',
        'shopify-config',
        'Failed to prepare the uploaded Wasm override for execution.',
      );
    }
  }
}
