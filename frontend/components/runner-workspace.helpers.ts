import {
  formatTemplateInput,
  getTemplatesForType,
  type FunctionType,
} from "@/lib/function-templates";

export const runnerApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export const initialRunnerFunctionType: FunctionType = "product-discount";
export const initialFunctionTemplate =
  getTemplatesForType(initialRunnerFunctionType)[0]!;
export const initialFunctionInputJson = formatTemplateInput(
  initialFunctionTemplate.input,
);

export function formatOutputJson(output: Record<string, unknown> | undefined) {
  return JSON.stringify(output ?? {}, null, 2);
}

export function getJsonValidationError(inputJson: string) {
  try {
    JSON.parse(inputJson);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid JSON";
  }
}

export function formatTimestamp(isoValue: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(isoValue));
  } catch {
    return isoValue;
  }
}

export function formatJsonString(inputJson: string) {
  const parsedJsonValue = JSON.parse(inputJson) as Record<string, unknown>;

  return JSON.stringify(parsedJsonValue, null, 2);
}
