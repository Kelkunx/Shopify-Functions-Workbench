import { type UploadedWasmFile } from './uploaded-wasm-file.type';

export interface RunFunctionParams {
  benchmarkIterations?: number;
  benchmarkWarmup?: number;
  exportName?: string;
  functionDir?: string;
  functionType?: string;
  inputJson: string;
  target?: string;
  wasmFile?: UploadedWasmFile;
}
