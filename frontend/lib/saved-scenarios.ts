import type { FunctionType } from "./function-templates";

export type RunnerMode = "mock" | "shopify";

export interface SavedScenario {
  benchmarkIterations: number;
  benchmarkWarmup: number;
  id: string;
  createdAt: string;
  exportName: string;
  functionDir: string;
  functionType: FunctionType;
  inputJson: string;
  lastUsedAt: string | null;
  name: string;
  runnerMode: RunnerMode;
  target: string;
  updatedAt: string;
}

interface SavedScenariosExportPayload {
  exportedAt: string;
  scenarios: SavedScenario[];
  version: 2;
}

const currentStorageKey = "shopify-functions-workbench-scenarios";
const legacyStorageKeys = [
  "shopify-functions-workbench-fixtures",
  "shopify-functions-local-runner-fixtures",
];

export function loadSavedScenarios(): SavedScenario[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawCurrentValue = window.localStorage.getItem(currentStorageKey);
  const scenariosFromCurrentStorage = parseSavedScenarios(rawCurrentValue);

  if (scenariosFromCurrentStorage) {
    return scenariosFromCurrentStorage;
  }

  for (const legacyStorageKey of legacyStorageKeys) {
    const rawLegacyValue = window.localStorage.getItem(legacyStorageKey);
    const scenariosFromLegacyStorage = parseSavedScenarios(rawLegacyValue);

    if (!scenariosFromLegacyStorage) {
      continue;
    }

    persistSavedScenarios(scenariosFromLegacyStorage);
    window.localStorage.removeItem(legacyStorageKey);

    return scenariosFromLegacyStorage;
  }

  return [];
}

export function persistSavedScenarios(scenarios: SavedScenario[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(currentStorageKey, JSON.stringify(scenarios));
}

export function parseImportedSavedScenarios(rawValue: string): SavedScenario[] {
  try {
    const parsedValue = JSON.parse(rawValue) as
      | SavedScenario[]
      | SavedScenariosExportPayload
      | { fixtures?: SavedScenario[] };

    if (Array.isArray(parsedValue)) {
      return normalizeSavedScenarios(parsedValue);
    }

    if (
      parsedValue &&
      typeof parsedValue === "object" &&
      "scenarios" in parsedValue &&
      Array.isArray(parsedValue.scenarios)
    ) {
      return normalizeSavedScenarios(parsedValue.scenarios);
    }

    if (
      parsedValue &&
      typeof parsedValue === "object" &&
      "fixtures" in parsedValue &&
      Array.isArray(parsedValue.fixtures)
    ) {
      return normalizeSavedScenarios(parsedValue.fixtures);
    }

    return [];
  } catch {
    return [];
  }
}

export function serializeSavedScenariosExport(scenarios: SavedScenario[]) {
  const exportPayload: SavedScenariosExportPayload = {
    exportedAt: new Date().toISOString(),
    scenarios,
    version: 2,
  };

  return JSON.stringify(exportPayload, null, 2);
}

function parseSavedScenarios(rawValue: string | null): SavedScenario[] | null {
  if (!rawValue) {
    return null;
  }

  const parsedScenarios = parseImportedSavedScenarios(rawValue);

  return parsedScenarios.length > 0 ? parsedScenarios : null;
}

function normalizeSavedScenarios(rawScenarios: unknown[]) {
  return rawScenarios.flatMap((rawScenario) => {
    const normalizedScenario = normalizeSavedScenario(rawScenario);

    return normalizedScenario ? [normalizedScenario] : [];
  });
}

function normalizeSavedScenario(rawScenario: unknown): SavedScenario | null {
  if (!rawScenario || typeof rawScenario !== "object") {
    return null;
  }

  const scenario = rawScenario as Partial<SavedScenario>;
  const nowIso = new Date().toISOString();

  const normalizedScenario: SavedScenario = {
    benchmarkIterations:
      typeof scenario.benchmarkIterations === "number"
        ? scenario.benchmarkIterations
        : 5,
    benchmarkWarmup:
      typeof scenario.benchmarkWarmup === "number"
        ? scenario.benchmarkWarmup
        : 1,
    id: typeof scenario.id === "string" ? scenario.id : crypto.randomUUID(),
    createdAt:
      typeof scenario.createdAt === "string" ? scenario.createdAt : nowIso,
    exportName:
      typeof scenario.exportName === "string" ? scenario.exportName : "run",
    functionDir:
      typeof scenario.functionDir === "string" ? scenario.functionDir : "",
    functionType:
      scenario.functionType === "product-discount" ||
      scenario.functionType === "delivery-customization" ||
      scenario.functionType === "cart-transform" ||
      scenario.functionType === "custom"
        ? scenario.functionType
        : "custom",
    inputJson: typeof scenario.inputJson === "string" ? scenario.inputJson : "{}",
    lastUsedAt:
      scenario.lastUsedAt === null || typeof scenario.lastUsedAt === "string"
        ? scenario.lastUsedAt
        : null,
    name: typeof scenario.name === "string" ? scenario.name : "scenario",
    runnerMode:
      scenario.runnerMode === "mock" || scenario.runnerMode === "shopify"
        ? scenario.runnerMode
        : "mock",
    target: typeof scenario.target === "string" ? scenario.target : "",
    updatedAt:
      typeof scenario.updatedAt === "string" ? scenario.updatedAt : nowIso,
  };

  return isSavedScenario(normalizedScenario) ? normalizedScenario : null;
}

function isSavedScenario(value: unknown): value is SavedScenario {
  if (!value || typeof value !== "object") {
    return false;
  }

  const scenario = value as Partial<SavedScenario>;

  return (
    typeof scenario.benchmarkIterations === "number" &&
    typeof scenario.benchmarkWarmup === "number" &&
    typeof scenario.id === "string" &&
    typeof scenario.name === "string" &&
    typeof scenario.createdAt === "string" &&
    typeof scenario.exportName === "string" &&
    typeof scenario.functionDir === "string" &&
    typeof scenario.functionType === "string" &&
    typeof scenario.inputJson === "string" &&
    (scenario.lastUsedAt === null || typeof scenario.lastUsedAt === "string") &&
    (scenario.runnerMode === "mock" || scenario.runnerMode === "shopify") &&
    typeof scenario.target === "string" &&
    typeof scenario.updatedAt === "string"
  );
}
