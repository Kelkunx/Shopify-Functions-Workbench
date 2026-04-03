import { Injectable } from '@nestjs/common';
import { type SupportedFunctionType } from './dto/run-request.dto';
import { type UploadedWasmFile } from './types/uploaded-wasm-file.type';

@Injectable()
export class MockFunctionRunnerService {
  run({
    functionType,
    requestedFunctionType,
    parsedInput,
    wasmFile,
  }: {
    functionType: SupportedFunctionType;
    requestedFunctionType?: string;
    parsedInput: Record<string, unknown>;
    wasmFile?: UploadedWasmFile;
  }): Record<string, unknown> {
    if (parsedInput.forceError === true) {
      throw new Error('Forced runner error triggered by input.forceError.');
    }

    const baseMetadata = {
      mockRunner: true,
      functionType,
      requestedFunctionType:
        requestedFunctionType && requestedFunctionType !== functionType
          ? requestedFunctionType
          : undefined,
      wasmFileName: wasmFile?.originalname ?? 'mock-runner.wasm',
      wasmSizeBytes: wasmFile?.size ?? wasmFile?.buffer?.length ?? 0,
      usedUploadedWasm: Boolean(wasmFile?.buffer?.length),
    };

    switch (functionType) {
      case 'product-discount':
        return {
          ...baseMetadata,
          discounts: [],
          discountApplicationStrategy: 'FIRST',
          inputSummary: {
            cartLines: this.getNestedArrayLength(parsedInput, 'cart', 'lines'),
          },
        };
      case 'delivery-customization':
        return {
          ...baseMetadata,
          operations: [],
          inputSummary: {
            deliveryGroups: this.getNestedArrayLength(
              parsedInput,
              'cart',
              'deliveryGroups',
            ),
          },
        };
      case 'cart-transform':
        return {
          ...baseMetadata,
          operations: [],
          inputSummary: {
            cartLines: this.getNestedArrayLength(parsedInput, 'cart', 'lines'),
          },
        };
      case 'custom':
        return {
          ...baseMetadata,
          output: {},
          inputSummary: {
            topLevelKeys: Object.keys(parsedInput).length,
          },
          echo: parsedInput,
        };
    }
  }

  private getNestedArrayLength(
    value: Record<string, unknown>,
    parentKey: string,
    childKey: string,
  ): number {
    const parentValue = value[parentKey];

    if (
      !parentValue ||
      typeof parentValue !== 'object' ||
      !Array.isArray((parentValue as Record<string, unknown>)[childKey])
    ) {
      return 0;
    }

    return ((parentValue as Record<string, unknown>)[childKey] as unknown[])
      .length;
  }
}
