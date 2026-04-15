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
      recentBenchmarks: [
        {
          averageExecutionMs: 28.2,
          averageRunnerMs: 27.4,
          averageTotalMs: 28.3,
          maxTotalMs: 29.1,
          measuredRuns: 3,
          minTotalMs: 27.8,
          recordedAt: "2026-04-02T10:30:00.000Z",
          warmupRuns: 1,
        },
      ],
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
    expect(parsedExport.scenarios[0]?.recentBenchmarks?.[0]).toMatchObject({
      averageTotalMs: 28.3,
      measuredRuns: 3,
      warmupRuns: 1,
    });
  });

  it("normalizes benchmark history when importing a scenario export", () => {
    const parsedScenarios = parseImportedSavedScenarios(
      JSON.stringify({
        version: 2,
        scenarios: [
          {
            benchmarkIterations: 5,
            benchmarkWarmup: 1,
            createdAt: "2026-04-01T10:00:00.000Z",
            exportName: "run",
            functionDir: "examples/shopify-product-discount/extensions/workbench-product-discount",
            functionType: "product-discount",
            id: "scenario-benchmark-ready",
            inputJson: "{}",
            lastUsedAt: null,
            name: "benchmark-ready",
            recentBenchmarks: [
              {
                averageExecutionMs: 34.1,
                averageRunnerMs: 33.7,
                averageTotalMs: 34.2,
                maxTotalMs: 35.4,
                measuredRuns: 5,
                minTotalMs: 33.9,
                recordedAt: "2026-04-03T10:00:00.000Z",
                warmupRuns: 1,
              },
            ],
            runnerMode: "shopify",
            target: "cart.lines.discounts.generate.run",
            updatedAt: "2026-04-03T10:00:00.000Z",
          },
        ],
      }),
    );

    expect(parsedScenarios[0]?.recentBenchmarks?.[0]).toMatchObject({
      averageRunnerMs: 33.7,
      measuredRuns: 5,
    });
  });
});
