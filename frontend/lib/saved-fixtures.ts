import type { FunctionType } from "./function-templates";

export type RunnerMode = "mock" | "shopify";

export interface SavedFixture {
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

export type SavedScenario = SavedFixture;

interface SavedFixturesExportPayload {
  exportedAt: string;
  fixtures: SavedFixture[];
  version: 2;
}

const currentStorageKey = "shopify-functions-workbench-fixtures";
const legacyStorageKeys = ["shopify-functions-local-runner-fixtures"];

export function loadSavedFixtures(): SavedFixture[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawCurrentValue = window.localStorage.getItem(currentStorageKey);
  const fixturesFromCurrentStorage = parseSavedFixtures(rawCurrentValue);

  if (fixturesFromCurrentStorage) {
    return fixturesFromCurrentStorage;
  }

  for (const legacyStorageKey of legacyStorageKeys) {
    const rawLegacyValue = window.localStorage.getItem(legacyStorageKey);
    const fixturesFromLegacyStorage = parseSavedFixtures(rawLegacyValue);

    if (!fixturesFromLegacyStorage) {
      continue;
    }

    persistSavedFixtures(fixturesFromLegacyStorage);
    window.localStorage.removeItem(legacyStorageKey);

    return fixturesFromLegacyStorage;
  }

  return [];
}

export function persistSavedFixtures(fixtures: SavedFixture[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(currentStorageKey, JSON.stringify(fixtures));
}

export function parseImportedSavedFixtures(rawValue: string): SavedFixture[] {
  try {
    const parsedValue = JSON.parse(rawValue) as SavedFixture[] | SavedFixturesExportPayload;

    if (Array.isArray(parsedValue)) {
      return normalizeSavedFixtures(parsedValue);
    }

    if (
      parsedValue &&
      typeof parsedValue === "object" &&
      Array.isArray(parsedValue.fixtures)
    ) {
      return normalizeSavedFixtures(parsedValue.fixtures);
    }

    return [];
  } catch {
    return [];
  }
}

export function serializeSavedFixturesExport(fixtures: SavedFixture[]) {
  const exportPayload: SavedFixturesExportPayload = {
    exportedAt: new Date().toISOString(),
    fixtures,
    version: 2,
  };

  return JSON.stringify(exportPayload, null, 2);
}

function parseSavedFixtures(rawValue: string | null): SavedFixture[] | null {
  if (!rawValue) {
    return null;
  }

  const parsedFixtures = parseImportedSavedFixtures(rawValue);

  return parsedFixtures.length > 0 ? parsedFixtures : null;
}

function normalizeSavedFixtures(rawFixtures: unknown[]) {
  return rawFixtures.flatMap((rawFixture) => {
    const normalizedFixture = normalizeSavedFixture(rawFixture);

    return normalizedFixture ? [normalizedFixture] : [];
  });
}

function normalizeSavedFixture(rawFixture: unknown): SavedFixture | null {
  if (!rawFixture || typeof rawFixture !== "object") {
    return null;
  }

  const fixture = rawFixture as Partial<SavedFixture>;
  const nowIso = new Date().toISOString();

  const normalizedFixture: SavedFixture = {
    benchmarkIterations:
      typeof fixture.benchmarkIterations === "number"
        ? fixture.benchmarkIterations
        : 5,
    benchmarkWarmup:
      typeof fixture.benchmarkWarmup === "number" ? fixture.benchmarkWarmup : 1,
    id: typeof fixture.id === "string" ? fixture.id : crypto.randomUUID(),
    createdAt: typeof fixture.createdAt === "string" ? fixture.createdAt : nowIso,
    exportName: typeof fixture.exportName === "string" ? fixture.exportName : "run",
    functionDir: typeof fixture.functionDir === "string" ? fixture.functionDir : "",
    functionType:
      fixture.functionType === "product-discount" ||
      fixture.functionType === "delivery-customization" ||
      fixture.functionType === "cart-transform" ||
      fixture.functionType === "custom"
        ? fixture.functionType
        : "custom",
    inputJson: typeof fixture.inputJson === "string" ? fixture.inputJson : "{}",
    lastUsedAt:
      fixture.lastUsedAt === null || typeof fixture.lastUsedAt === "string"
        ? fixture.lastUsedAt
        : null,
    name: typeof fixture.name === "string" ? fixture.name : "scenario",
    runnerMode:
      fixture.runnerMode === "mock" || fixture.runnerMode === "shopify"
        ? fixture.runnerMode
        : "mock",
    target: typeof fixture.target === "string" ? fixture.target : "",
    updatedAt: typeof fixture.updatedAt === "string" ? fixture.updatedAt : nowIso,
  };

  return isSavedFixture(normalizedFixture) ? normalizedFixture : null;
}

function isSavedFixture(value: unknown): value is SavedFixture {
  if (!value || typeof value !== "object") {
    return false;
  }

  const fixture = value as Partial<SavedFixture>;

  return (
    typeof fixture.benchmarkIterations === "number" &&
    typeof fixture.benchmarkWarmup === "number" &&
    typeof fixture.id === "string" &&
    typeof fixture.name === "string" &&
    typeof fixture.createdAt === "string" &&
    typeof fixture.exportName === "string" &&
    typeof fixture.functionDir === "string" &&
    typeof fixture.functionType === "string" &&
    typeof fixture.inputJson === "string" &&
    (fixture.lastUsedAt === null || typeof fixture.lastUsedAt === "string") &&
    (fixture.runnerMode === "mock" || fixture.runnerMode === "shopify") &&
    typeof fixture.target === "string" &&
    typeof fixture.updatedAt === "string"
  );
}
