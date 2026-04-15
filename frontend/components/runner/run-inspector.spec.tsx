import { fireEvent, render, screen } from "@testing-library/react";
import { RunInspector } from "./run-inspector";

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

describe("RunInspector", () => {
  it("opens the details drawer and shows timings and benchmark data", () => {
    render(
      <RunInspector
        copyFeedback=""
        onCopyOutput={() => undefined}
        onExpandOutput={() => undefined}
        runRequestError=""
        runResponse={baseRunResponse}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Local timings are indicative only/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show benchmark" }));

    expect(screen.getByText("Measured avg")).toBeInTheDocument();
    expect(screen.getByText(/Warm-up 1/i)).toBeInTheDocument();
  });

  it("shows Shopify as the runner mode when Shopify diagnostics are present", () => {
    render(
      <RunInspector
        copyFeedback=""
        onCopyOutput={() => undefined}
        onExpandOutput={() => undefined}
        runRequestError=""
        runResponse={{
          ...baseRunResponse,
          diagnostics: {
            ...baseRunResponse.diagnostics,
            actualRunnerMode: "mock",
          },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    fireEvent.click(screen.getByRole("button", { name: "Show diagnostics" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Runner mode:\s*shopify/i)).toBeInTheDocument();
    expect(screen.getByText(/Requested mode:\s*shopify/i)).toBeInTheDocument();
  });
});
