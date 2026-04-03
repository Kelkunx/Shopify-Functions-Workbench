import type { FunctionType } from "./function-templates";

export type RunnerMode = "mock" | "shopify";

export interface SavedFixture {
  id: string;
  name: string;
  createdAt: string;
  exportName: string;
  functionDir: string;
  functionType: FunctionType;
  inputJson: string;
  runnerMode: RunnerMode;
  target: string;
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

function parseSavedFixtures(rawValue: string | null): SavedFixture[] | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as SavedFixture[];

    return Array.isArray(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}
