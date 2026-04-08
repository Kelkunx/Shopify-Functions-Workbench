import { act, renderHook } from "@testing-library/react";
import { useRunnerFormState } from "./use-runner-form-state";

describe("useRunnerFormState", () => {
  it("defaults to Shopify mode with benchmark settings", () => {
    const { result } = renderHook(() => useRunnerFormState());

    expect(result.current.activeRunnerMode).toBe("shopify");
    expect(result.current.currentBenchmarkIterations).toBe(5);
    expect(result.current.currentBenchmarkWarmup).toBe(1);
  });

  it("loads benchmark settings from a saved scenario", () => {
    const { result } = renderHook(() => useRunnerFormState());

    act(() => {
      result.current.applySavedScenario({
        benchmarkIterations: 7,
        benchmarkWarmup: 2,
        createdAt: "2026-04-01T10:00:00.000Z",
        exportName: "run",
        functionDir: "/tmp/function",
        functionType: "custom",
        id: "fixture-1",
        inputJson: "{\"cart\":{}}",
        lastUsedAt: null,
        name: "benchmark-scenario",
        runnerMode: "mock",
        target: "",
        updatedAt: "2026-04-02T10:00:00.000Z",
      });
    });

    expect(result.current.activeRunnerMode).toBe("mock");
    expect(result.current.currentBenchmarkIterations).toBe(7);
    expect(result.current.currentBenchmarkWarmup).toBe(2);
  });
});
