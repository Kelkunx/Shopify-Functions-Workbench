import { promises as fs } from 'node:fs';
import type { Stats } from 'node:fs';
import { MockFunctionRunnerService } from './mock-function-runner.service';
import { RunRequestParserService } from './run-request-parser.service';
import { RunService } from './run.service';
import { ShopifyFunctionRunnerService } from './shopify-function-runner.service';

describe('RunService', () => {
  const actualFsStat = fs.stat.bind(fs) as typeof fs.stat;
  let getFunctionInfoMock: jest.Mock;
  let requestParser: RunRequestParserService;
  let runFunctionMock: jest.Mock;
  let shopifyRunner: jest.Mocked<ShopifyFunctionRunnerService>;
  let service: RunService;

  beforeEach(() => {
    jest.restoreAllMocks();
    getFunctionInfoMock = jest.fn();
    runFunctionMock = jest.fn();

    shopifyRunner = {
      getFunctionInfo: getFunctionInfoMock,
      runFunction: runFunctionMock,
    } as unknown as jest.Mocked<ShopifyFunctionRunnerService>;

    requestParser = new RunRequestParserService();
    service = new RunService(
      new MockFunctionRunnerService(),
      requestParser,
      shopifyRunner,
    );

    jest.spyOn(fs, 'stat').mockImplementation((filePath) => {
      if (filePath === '/tmp/function.wasm') {
        return Promise.resolve({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats);
      }

      return actualFsStat(filePath);
    });
  });

  it('returns a mock success response for a supported function', async () => {
    const response = await service.runFunction({
      wasmFile: {
        originalname: 'discount.wasm',
        size: 16,
        buffer: Buffer.from('wasm'),
      },
      functionType: 'product-discount',
      inputJson: JSON.stringify({
        cart: {
          lines: [{ id: 'gid://shopify/CartLine/1' }],
        },
      }),
    });

    expect(response.success).toBe(true);
    expect(response.errors).toEqual([]);
    expect(response.output).toMatchObject({
      mockRunner: true,
      functionType: 'product-discount',
      discountApplicationStrategy: 'FIRST',
      inputSummary: {
        cartLines: 1,
      },
    });
  });

  it('returns validation errors for invalid requests', async () => {
    const response = await service.runFunction({
      wasmFile: undefined,
      functionType: 'unknown-type',
      inputJson: '{bad json}',
    });

    expect(response.success).toBe(false);
    expect(response.output).toEqual({});
    expect(response.errors).toEqual(['Input JSON is invalid.']);
    expect(response.errorDetails).toEqual([
      {
        code: 'INPUT_JSON_INVALID',
        message: 'Input JSON is invalid.',
        source: 'request',
      },
    ]);
  });

  it('allows running without an uploaded wasm while the runner is mocked', async () => {
    const response = await service.runFunction({
      wasmFile: undefined,
      functionType: 'cart-transform',
      inputJson: JSON.stringify({
        cart: {
          lines: [],
        },
      }),
    });

    expect(response.success).toBe(true);
    expect(response.errors).toEqual([]);
    expect(response.output).toMatchObject({
      mockRunner: true,
      functionType: 'cart-transform',
      wasmFileName: 'mock-runner.wasm',
      usedUploadedWasm: false,
    });
  });

  it('falls back to custom mock mode for unknown function types', async () => {
    const response = await service.runFunction({
      functionType: 'my-own-function-type',
      inputJson: JSON.stringify({
        anything: true,
      }),
    });

    expect(response.success).toBe(true);
    expect(response.errors).toEqual([]);
    expect(response.output).toMatchObject({
      mockRunner: true,
      functionType: 'custom',
      requestedFunctionType: 'my-own-function-type',
      inputSummary: {
        topLevelKeys: 1,
      },
      echo: {
        anything: true,
      },
    });
  });

  it('uses the real Shopify runner when functionDir and target are provided', async () => {
    getFunctionInfoMock.mockResolvedValue({
      functionRunnerPath: '/tmp/function-runner',
      schemaPath: '/tmp/schema.graphql',
      targeting: {
        'purchase.product-discount.run': {
          export: 'purchase-product-discount-run',
          inputQueryPath: '/tmp/input.graphql',
        },
      },
      wasmPath: '/tmp/function.wasm',
    });

    runFunctionMock.mockResolvedValue({
      error: null,
      result: {
        output: {
          discounts: [],
        },
      },
    });

    const response = await service.runFunction({
      functionDir: __dirname,
      functionType: 'anything-goes-here',
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'purchase.product-discount.run',
    });

    expect(response.success).toBe(true);
    expect(response.errors).toEqual([]);
    expect(response.output).toEqual({
      discounts: [],
    });
    expect(response.diagnostics).toMatchObject({
      actualRunnerMode: 'shopify',
      requestedRunnerMode: 'shopify',
      shopify: {
        effectiveExportName: 'purchase-product-discount-run',
        target: 'purchase.product-discount.run',
        targetResolved: true,
        usedUploadedWasm: false,
        wasmOverrideActive: false,
      },
    });
    expect(getFunctionInfoMock).toHaveBeenCalledWith(__dirname);
    expect(runFunctionMock).toHaveBeenCalledWith(
      {
        export: 'purchase-product-discount-run',
        input: { cart: { lines: [] } },
        target: 'purchase.product-discount.run',
      },
      '/tmp/function-runner',
      '/tmp/function.wasm',
      '/tmp/input.graphql',
      '/tmp/schema.graphql',
    );
  });

  it('cleans up temporary wasm directories after real runner execution', async () => {
    jest.spyOn(fs, 'mkdtemp').mockResolvedValue('/tmp/uploaded-function-dir');
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    const removeDirectorySpy = jest
      .spyOn(fs, 'rm')
      .mockResolvedValue(undefined);

    getFunctionInfoMock.mockResolvedValue({
      functionRunnerPath: '/tmp/function-runner',
      schemaPath: '/tmp/schema.graphql',
      targeting: {
        'purchase.product-discount.run': {
          export: 'purchase-product-discount-run',
          inputQueryPath: '/tmp/input.graphql',
        },
      },
      wasmPath: '/tmp/function.wasm',
    });

    runFunctionMock.mockResolvedValue({
      error: null,
      result: {
        output: {
          discounts: [],
        },
      },
    });

    await service.runFunction({
      functionDir: __dirname,
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'purchase.product-discount.run',
      wasmFile: {
        buffer: Buffer.from('wasm'),
        originalname: 'uploaded.wasm',
      },
    });

    expect(runFunctionMock).toHaveBeenCalledWith(
      expect.any(Object),
      '/tmp/function-runner',
      '/tmp/uploaded-function-dir/uploaded-function.wasm',
      '/tmp/input.graphql',
      '/tmp/schema.graphql',
    );
    expect(removeDirectorySpy).toHaveBeenCalledWith(
      '/tmp/uploaded-function-dir',
      {
        force: true,
        recursive: true,
      },
    );
  });

  it('falls back to the target export when the submitted exportName is still run', async () => {
    getFunctionInfoMock.mockResolvedValue({
      functionRunnerPath: '/tmp/function-runner',
      schemaPath: '/tmp/schema.graphql',
      targeting: {
        'purchase.product-discount.run': {
          export: 'purchase-product-discount-run',
          inputQueryPath: '/tmp/input.graphql',
        },
      },
      wasmPath: '/tmp/function.wasm',
    });

    runFunctionMock.mockResolvedValue({
      error: null,
      result: {
        output: {
          discounts: [],
        },
      },
    });

    await service.runFunction({
      exportName: 'run',
      functionDir: __dirname,
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'purchase.product-discount.run',
    });

    expect(runFunctionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        export: 'purchase-product-discount-run',
      }),
      '/tmp/function-runner',
      '/tmp/function.wasm',
      '/tmp/input.graphql',
      '/tmp/schema.graphql',
    );
  });

  it('returns a specific error when the target does not exist in Shopify metadata', async () => {
    getFunctionInfoMock.mockResolvedValue({
      functionRunnerPath: '/tmp/function-runner',
      schemaPath: '/tmp/schema.graphql',
      targeting: {},
      wasmPath: '/tmp/function.wasm',
    });

    const response = await service.runFunction({
      functionDir: __dirname,
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'purchase.product-discount.run',
    });

    expect(response.success).toBe(false);
    expect(response.errorDetails).toEqual([
      expect.objectContaining({
        code: 'SHOPIFY_TARGET_NOT_FOUND',
        source: 'shopify-config',
      }),
    ]);
  });

  it('returns a specific error when functionDir does not exist', async () => {
    const response = await service.runFunction({
      functionDir: '/tmp/does-not-exist-workbench',
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'purchase.product-discount.run',
    });

    expect(response.success).toBe(false);
    expect(response.errorDetails).toEqual([
      expect.objectContaining({
        code: 'FUNCTION_DIR_NOT_FOUND',
        source: 'shopify-config',
      }),
    ]);
  });

  it('resolves repo-relative Shopify example paths when the backend runs from backend/', async () => {
    jest.spyOn(process, 'cwd').mockReturnValue('/tmp/workbench/backend');
    jest.spyOn(fs, 'stat').mockImplementation((filePath) => {
      if (
        filePath ===
        '/tmp/workbench/examples/shopify-product-discount/extension'
      ) {
        return Promise.resolve({
          isDirectory: () => true,
          isFile: () => false,
        } as Stats);
      }

      if (filePath === '/tmp/function.wasm') {
        return Promise.resolve({
          isDirectory: () => false,
          isFile: () => true,
        } as Stats);
      }

      return actualFsStat(filePath);
    });

    getFunctionInfoMock.mockResolvedValue({
      functionRunnerPath: '/tmp/function-runner',
      schemaPath: '/tmp/schema.graphql',
      targeting: {
        'cart.lines.discounts.generate.run': {
          export: 'run',
          inputQueryPath: '/tmp/input.graphql',
        },
      },
      wasmPath: '/tmp/function.wasm',
    });

    runFunctionMock.mockResolvedValue({
      error: null,
      result: {
        output: {
          operations: [],
        },
      },
    });

    const response = await service.runFunction({
      functionDir: 'examples/shopify-product-discount/extension',
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'cart.lines.discounts.generate.run',
    });

    expect(response.success).toBe(true);
    expect(getFunctionInfoMock).toHaveBeenCalledWith(
      '/tmp/workbench/examples/shopify-product-discount/extension',
    );
  });

  it('returns a specific error when the built Shopify wasm is missing', async () => {
    getFunctionInfoMock.mockResolvedValue({
      functionRunnerPath: '/tmp/function-runner',
      schemaPath: '/tmp/schema.graphql',
      targeting: {
        'purchase.product-discount.run': {
          export: 'purchase-product-discount-run',
          inputQueryPath: '/tmp/input.graphql',
        },
      },
      wasmPath: '/tmp/missing-function.wasm',
    });

    const response = await service.runFunction({
      functionDir: __dirname,
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'purchase.product-discount.run',
    });

    expect(response.success).toBe(false);
    expect(response.errorDetails).toEqual([
      expect.objectContaining({
        code: 'SHOPIFY_WASM_NOT_FOUND',
        source: 'shopify-config',
      }),
    ]);
  });

  it('returns a structured error when the Shopify export is not found', async () => {
    getFunctionInfoMock.mockResolvedValue({
      functionRunnerPath: '/tmp/function-runner',
      schemaPath: '/tmp/schema.graphql',
      targeting: {
        'purchase.product-discount.run': {
          export: 'purchase-product-discount-run',
          inputQueryPath: '/tmp/input.graphql',
        },
      },
      wasmPath: '/tmp/function.wasm',
    });

    runFunctionMock.mockResolvedValue({
      error:
        'function-runner failed with exit code 1: Error: failed to find function export `purchase-product-discount-run`',
      result: null,
    });

    const response = await service.runFunction({
      functionDir: __dirname,
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'purchase.product-discount.run',
    });

    expect(response.success).toBe(false);
    expect(response.errorDetails).toEqual([
      expect.objectContaining({
        code: 'SHOPIFY_EXPORT_NOT_FOUND',
        source: 'shopify-runner',
      }),
    ]);
  });

  it('returns a structured error when the Shopify runner output is malformed', async () => {
    getFunctionInfoMock.mockResolvedValue({
      functionRunnerPath: '/tmp/function-runner',
      schemaPath: '/tmp/schema.graphql',
      targeting: {
        'purchase.product-discount.run': {
          export: 'purchase-product-discount-run',
          inputQueryPath: '/tmp/input.graphql',
        },
      },
      wasmPath: '/tmp/function.wasm',
    });

    runFunctionMock.mockResolvedValue({
      error:
        "function-runner returned unexpected format - missing 'output' field.",
      result: null,
    });

    const response = await service.runFunction({
      functionDir: __dirname,
      inputJson: JSON.stringify({ cart: { lines: [] } }),
      target: 'purchase.product-discount.run',
    });

    expect(response.success).toBe(false);
    expect(response.errorDetails).toEqual([
      expect.objectContaining({
        code: 'SHOPIFY_OUTPUT_INVALID',
        source: 'shopify-runner',
      }),
    ]);
  });

  it('returns benchmark results with warmup exclusion and aggregate timings', async () => {
    const response = await service.runFunction({
      benchmarkIterations: 3,
      benchmarkWarmup: 1,
      functionType: 'product-discount',
      inputJson: JSON.stringify({
        cart: {
          lines: [{ id: 'gid://shopify/CartLine/1' }],
        },
      }),
    });

    expect(response.success).toBe(true);
    expect(response.benchmark).toMatchObject({
      enabled: true,
      iterations: 3,
      measuredRuns: 3,
      warmupRuns: 1,
    });
    expect(response.benchmark?.runs).toHaveLength(4);
    expect(response.benchmark?.runs[0]?.warmup).toBe(true);
    expect(response.benchmark?.summary.averageTotalMs).toBeGreaterThanOrEqual(
      0,
    );
    expect(response.diagnostics.benchmarkEnabled).toBe(true);
  });
});
