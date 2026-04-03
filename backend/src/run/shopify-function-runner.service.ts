import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

interface FixtureData {
  export: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  target: string;
}

interface RunFunctionResult {
  result: {
    output: Record<string, unknown>;
  } | null;
  error: string | null;
}

export interface ShopifyFunctionInfo {
  schemaPath: string;
  functionRunnerPath: string;
  wasmPath: string;
  targeting: Record<string, { inputQueryPath?: string; export?: string }>;
}

interface ShopifyFunctionTestHelpersModule {
  getFunctionInfo: (functionDir: string) => Promise<ShopifyFunctionInfo>;
  runFunction: (
    fixture: FixtureData,
    functionRunnerPath: string,
    wasmPath: string,
    queryPath: string,
    schemaPath: string,
  ) => Promise<RunFunctionResult>;
}

@Injectable()
export class ShopifyFunctionRunnerService {
  private helpersModulePromise: Promise<ShopifyFunctionTestHelpersModule> | null =
    null;
  private readonly dynamicImport = new Function(
    'specifier',
    'return import(specifier)',
  ) as (specifier: string) => Promise<ShopifyFunctionTestHelpersModule>;

  async getFunctionInfo(functionDir: string): Promise<ShopifyFunctionInfo> {
    const helpers = await this.loadHelpersModule();

    return helpers.getFunctionInfo(functionDir);
  }

  async runFunction(
    fixture: FixtureData,
    functionRunnerPath: string,
    wasmPath: string,
    queryPath: string,
    schemaPath: string,
  ): Promise<RunFunctionResult> {
    const helpers = await this.loadHelpersModule();

    return helpers.runFunction(
      fixture,
      functionRunnerPath,
      wasmPath,
      queryPath,
      schemaPath,
    );
  }

  private loadHelpersModule(): Promise<ShopifyFunctionTestHelpersModule> {
    this.helpersModulePromise ??= this.dynamicImport(
      this.getHelpersModuleFileUrl().href,
    );

    return this.helpersModulePromise;
  }

  private getHelpersModuleFileUrl(): URL {
    const currentDirectory = __dirname;
    const relativeSegments = [
      ['node_modules', '@shopify', 'shopify-function-test-helpers', 'dist', 'wasm-testing-helpers.js'],
      ['..', 'node_modules', '@shopify', 'shopify-function-test-helpers', 'dist', 'wasm-testing-helpers.js'],
      ['..', '..', 'node_modules', '@shopify', 'shopify-function-test-helpers', 'dist', 'wasm-testing-helpers.js'],
      ['..', '..', '..', 'node_modules', '@shopify', 'shopify-function-test-helpers', 'dist', 'wasm-testing-helpers.js'],
    ];

    for (const segments of relativeSegments) {
      const candidatePath = path.resolve(currentDirectory, ...segments);

      if (existsSync(candidatePath)) {
        return pathToFileURL(candidatePath);
      }
    }

    throw new Error(
      'Unable to locate @shopify/shopify-function-test-helpers in node_modules.',
    );
  }
}
