import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MinLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

function parseOptionalInteger(value: unknown): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number.parseInt(value, 10);
  }

  return undefined;
}

export const SUPPORTED_FUNCTION_TYPES = [
  'product-discount',
  'delivery-customization',
  'cart-transform',
  'custom',
] as const;

export type SupportedFunctionType = (typeof SUPPORTED_FUNCTION_TYPES)[number];

export class RunRequestDto {
  @IsString()
  @MinLength(1)
  inputJson = '';

  @IsOptional()
  @IsString()
  functionType = '';

  @ValidateIf(
    (value: RunRequestDto) =>
      value.functionDir !== undefined || value.target !== undefined,
  )
  @IsString()
  @MinLength(1)
  functionDir?: string;

  @ValidateIf(
    (value: RunRequestDto) =>
      value.functionDir !== undefined || value.target !== undefined,
  )
  @IsString()
  @MinLength(1)
  target?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  exportName?: string;

  @IsOptional()
  @Transform(({ value }) => parseOptionalInteger(value))
  @IsInt()
  @Min(1)
  @Max(20)
  benchmarkIterations?: number;

  @IsOptional()
  @Transform(({ value }) => parseOptionalInteger(value))
  @IsInt()
  @Min(0)
  @Max(5)
  benchmarkWarmup?: number;
}
