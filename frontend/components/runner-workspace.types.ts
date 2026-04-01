import type { FunctionType } from "@/lib/function-templates";
import type { RunnerMode } from "@/lib/saved-fixtures";

export interface RunResponse {
  success: boolean;
  output: Record<string, unknown>;
  executionTimeMs: number;
  errors: string[];
}

export interface RunnerFormState {
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
