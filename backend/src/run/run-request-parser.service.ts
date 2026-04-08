import { Injectable } from '@nestjs/common';
import {
  SUPPORTED_FUNCTION_TYPES,
  type SupportedFunctionType,
} from './dto/run-request.dto';
import { type ParsedRunRequest } from './types/parsed-run-request.type';
import { type RunFunctionParams } from './types/run-function-params.type';
import { type RunErrorDetail } from './types/run-response.type';

interface ParsedRunRequestResult {
  errorDetails: RunErrorDetail[];
  parsedRequest: ParsedRunRequest | null;
}

const defaultBenchmarkIterations = 5;
const defaultBenchmarkWarmup = 1;

@Injectable()
export class RunRequestParserService {
  parse({
    benchmarkIterations,
    benchmarkWarmup,
    exportName,
    functionDir,
    functionType,
    inputJson,
    target,
    wasmFile,
  }: RunFunctionParams): ParsedRunRequestResult {
    const errorDetails: RunErrorDetail[] = [];
    const trimmedFunctionDir = functionDir?.trim();
    const trimmedTarget = target?.trim();
    const trimmedExportName = exportName?.trim();
    const requestedFunctionType = functionType?.trim();
    const hasRealRunnerConfig = Boolean(trimmedFunctionDir && trimmedTarget);
    const benchmarkEnabled =
      benchmarkIterations !== undefined || benchmarkWarmup !== undefined;
    const resolvedBenchmarkIterations = benchmarkEnabled
      ? (benchmarkIterations ?? defaultBenchmarkIterations)
      : 1;
    const resolvedBenchmarkWarmup = benchmarkEnabled
      ? (benchmarkWarmup ?? defaultBenchmarkWarmup)
      : 0;

    if (wasmFile?.originalname && !wasmFile.originalname.endsWith('.wasm')) {
      errorDetails.push({
        code: 'INVALID_WASM_FILE',
        message: 'The uploaded file must have a .wasm extension.',
        source: 'request',
      });
    }

    if (
      (trimmedFunctionDir && !trimmedTarget) ||
      (!trimmedFunctionDir && trimmedTarget)
    ) {
      errorDetails.push({
        code: 'SHOPIFY_TARGET_NOT_FOUND',
        message:
          'Both functionDir and target are required to use the real Shopify runner.',
        source: 'request',
      });
    }

    if (
      benchmarkEnabled &&
      resolvedBenchmarkWarmup >= resolvedBenchmarkIterations
    ) {
      errorDetails.push({
        code: 'BENCHMARK_SETTINGS_INVALID',
        message:
          'benchmarkWarmup must be lower than benchmarkIterations so at least one measured run remains.',
        source: 'benchmark',
      });
    }

    let parsedInput: Record<string, unknown> | null = null;

    try {
      parsedInput = JSON.parse(inputJson) as Record<string, unknown>;
    } catch {
      errorDetails.push({
        code: 'INPUT_JSON_INVALID',
        message: 'Input JSON is invalid.',
        source: 'request',
      });
    }

    if (errorDetails.length > 0 || !parsedInput) {
      return {
        errorDetails,
        parsedRequest: null,
      };
    }

    return {
      errorDetails: [],
      parsedRequest: {
        benchmarkEnabled,
        benchmarkIterations: resolvedBenchmarkIterations,
        benchmarkWarmup: resolvedBenchmarkWarmup,
        hasRealRunnerConfig,
        normalizedFunctionType: this.normalizeFunctionType(
          requestedFunctionType,
        ),
        parsedInput,
        requestedFunctionType,
        trimmedExportName,
        trimmedFunctionDir,
        trimmedTarget,
        wasmFile,
      },
    };
  }

  private normalizeFunctionType(functionType?: string): SupportedFunctionType {
    if (
      functionType &&
      SUPPORTED_FUNCTION_TYPES.includes(functionType as SupportedFunctionType)
    ) {
      return functionType as SupportedFunctionType;
    }

    return 'custom';
  }
}
