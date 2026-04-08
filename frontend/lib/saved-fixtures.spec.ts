import {
  parseImportedSavedFixtures,
  serializeSavedFixturesExport,
  type SavedFixture,
} from "./saved-fixtures";

describe("saved fixtures", () => {
  it("normalizes legacy fixtures into the current scenario shape", () => {
    const parsedFixtures = parseImportedSavedFixtures(
      JSON.stringify([
        {
          id: "fixture-1",
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

    expect(parsedFixtures).toHaveLength(1);
    expect(parsedFixtures[0]).toMatchObject({
      benchmarkIterations: 5,
      benchmarkWarmup: 1,
      lastUsedAt: null,
      name: "legacy",
      runnerMode: "mock",
    });
  });

  it("serializes the versioned export payload", () => {
    const fixture: SavedFixture = {
      benchmarkIterations: 5,
      benchmarkWarmup: 1,
      createdAt: "2026-04-01T10:00:00.000Z",
      exportName: "run",
      functionDir: "/tmp/function",
      functionType: "custom",
      id: "fixture-2",
      inputJson: "{\"cart\":{}}",
      lastUsedAt: null,
      name: "scenario",
      runnerMode: "shopify",
      target: "cart.lines.discounts.generate.run",
      updatedAt: "2026-04-02T10:00:00.000Z",
    };

    const serializedExport = serializeSavedFixturesExport([fixture]);
    const parsedExport = JSON.parse(serializedExport) as {
      fixtures: SavedFixture[];
      version: number;
    };

    expect(parsedExport.version).toBe(2);
    expect(parsedExport.fixtures).toHaveLength(1);
    expect(parsedExport.fixtures[0]?.name).toBe("scenario");
  });
});
