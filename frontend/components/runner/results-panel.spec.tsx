import { render, screen } from "@testing-library/react";
import { RunResultsPanel } from "./results-panel";

const baseRunResponse = {
  benchmark: {
    enabled: true,
    iterations: 3,
    measuredRuns: 2,
    runs: [
      {
        errors: [],
        executionTimeMs: 40,
        index: 0,
        success: true,
        timings: {
          executionMs: 40,
          parseMs: 0.02,
          shopifyPhases: {
            cleanupMs: 0.2,
            directoryCheckMs: 0.1,
            functionInfoMs: 0.4,
            functionRunnerMs: 39.1,
            wasmPreparationMs: 0,
          },
          totalMs: 40,
        },
        warmup: true,
      },
      {
        errors: [],
        executionTimeMs: 32,
        index: 1,
        success: true,
        timings: {
          executionMs: 32,
          parseMs: 0.02,
          shopifyPhases: {
            cleanupMs: 0.2,
            directoryCheckMs: 0.1,
            functionInfoMs: 0.2,
            functionRunnerMs: 31.1,
            wasmPreparationMs: 0,
          },
          totalMs: 32,
        },
        warmup: false,
      },
    ],
    summary: {
      averageExecutionMs: 32,
      averageRunnerMs: 31.1,
      averageTotalMs: 32,
      maxTotalMs: 32,
      minTotalMs: 32,
    },
    warmupRuns: 1,
  },
  diagnostics: {
    actualRunnerMode: "shopify" as const,
    benchmarkEnabled: true,
    requestedRunnerMode: "shopify" as const,
    shopify: {
      effectiveExportName: "run",
      requestedExportName: "run",
      target: "cart.lines.discounts.generate.run",
      targetResolved: true,
      usedUploadedWasm: false,
      wasmOverrideActive: false,
    },
  },
  errorDetails: [],
  errors: [],
  executionTimeMs: 72,
  output: {
    discounts: [],
  },
  success: true,
  timings: {
    executionMs: 32,
    parseMs: 0.02,
    shopifyPhases: {
      cleanupMs: 0.2,
      directoryCheckMs: 0.1,
      functionInfoMs: 0.2,
      functionRunnerMs: 31.1,
      wasmPreparationMs: 0,
    },
    totalMs: 72,
  },
};

describe("RunResultsPanel", () => {
  it("shows the last benchmark run time instead of the benchmark total", () => {
    render(
      <RunResultsPanel
        copyFeedback=""
        onCopyOutput={() => undefined}
        onExpandOutput={() => undefined}
        onOpenDetails={() => undefined}
        runRequestError=""
        runResponse={baseRunResponse}
      />,
    );

    expect(screen.getByText("Last run time")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Run result" }).closest("section"),
    ).toHaveTextContent("32.000 ms");
    expect(screen.queryByText("72.000 ms")).not.toBeInTheDocument();
    expect(screen.getByText("Benchmark summary")).toBeInTheDocument();
    expect(screen.getByText("Avg total")).toBeInTheDocument();
    expect(screen.getByText(/2 measured runs; 1 warm-up excluded\./i)).toBeInTheDocument();
  });

  it("renders output icon actions with accessible labels", () => {
    render(
      <RunResultsPanel
        copyFeedback=""
        onCopyOutput={() => undefined}
        onExpandOutput={() => undefined}
        onOpenDetails={() => undefined}
        runRequestError=""
        runResponse={baseRunResponse}
      />,
    );

    expect(screen.getByRole("button", { name: "Copy output" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand output" })).toBeInTheDocument();
  });
});
