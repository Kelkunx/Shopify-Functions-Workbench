import {
  parseImportedSavedScenarios,
  serializeSavedScenariosExport,
  type SavedScenario,
} from "./saved-scenarios";

describe("saved scenarios", () => {
  it("normalizes legacy scenario exports into the current shape", () => {
    const parsedScenarios = parseImportedSavedScenarios(
      JSON.stringify([
        {
          id: "scenario-1",
          name: "legacy",
          createdAt: "2026-04-01T10:00:00.000Z",
          exportName: "run",
          functionDir: "",
          functionType: "product-discount",
          inputJson: "{}",
          runnerMode: "mock",
          target: "",
        },
      ]),
    );

    expect(parsedScenarios).toHaveLength(1);
    expect(parsedScenarios[0]).toMatchObject({
      benchmarkIterations: 5,
      benchmarkWarmup: 1,
      lastUsedAt: null,
      name: "legacy",
      runnerMode: "mock",
    });
  });

  it("accepts the legacy export payload shape for migration", () => {
    const parsedScenarios = parseImportedSavedScenarios(
      JSON.stringify({
        version: 2,
        fixtures: [
          {
            id: "scenario-legacy-export",
            name: "legacy-export-shape",
            createdAt: "2026-04-01T10:00:00.000Z",
            exportName: "run",
            functionDir: "",
            functionType: "custom",
            inputJson: "{}",
            runnerMode: "mock",
            target: "",
            updatedAt: "2026-04-01T10:00:00.000Z",
          },
        ],
      }),
    );

    expect(parsedScenarios).toHaveLength(1);
    expect(parsedScenarios[0]?.name).toBe("legacy-export-shape");
  });

  it("serializes the versioned scenario export payload", () => {
    const scenario: SavedScenario = {
      benchmarkIterations: 5,
      benchmarkWarmup: 1,
      createdAt: "2026-04-01T10:00:00.000Z",
      exportName: "run",
      functionDir: "/tmp/function",
      functionType: "custom",
      id: "scenario-2",
      inputJson: "{\"cart\":{}}",
      lastUsedAt: null,
      name: "scenario",
      runnerMode: "shopify",
      target: "cart.lines.discounts.generate.run",
      updatedAt: "2026-04-02T10:00:00.000Z",
    };

    const serializedExport = serializeSavedScenariosExport([scenario]);
    const parsedExport = JSON.parse(serializedExport) as {
      scenarios: SavedScenario[];
      version: number;
    };

    expect(parsedExport.version).toBe(2);
    expect(parsedExport.scenarios).toHaveLength(1);
    expect(parsedExport.scenarios[0]?.name).toBe("scenario");
  });
});
