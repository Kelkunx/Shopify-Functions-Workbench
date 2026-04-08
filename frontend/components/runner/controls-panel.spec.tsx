import { fireEvent, render, screen } from "@testing-library/react";
import { RunnerControlsPanel } from "./controls-panel";

describe("RunnerControlsPanel", () => {
  const baseProps = {
    currentBenchmarkIterations: 5,
    currentBenchmarkWarmup: 1,
    currentExportName: "run",
    currentFixtureName: "",
    currentFunctionDir: "/tmp/example",
    currentFunctionType: "product-discount" as const,
    lastRunResponse: null,
    onBenchmarkIterationsChange: () => undefined,
    onBenchmarkWarmupChange: () => undefined,
    onDeleteSavedFixture: () => undefined,
    onExportFixtures: () => undefined,
    onExportNameChange: () => undefined,
    onFixtureNameChange: () => undefined,
    onFixtureSave: () => undefined,
    onFunctionDirChange: () => undefined,
    onFunctionTypeChange: () => undefined,
    onImportFixtures: () => undefined,
    onLoadFixture: () => undefined,
    onLoadSelectedTemplate: () => undefined,
    onRenameScenario: () => undefined,
    onSelectedTemplateChange: () => undefined,
    onTargetChange: () => undefined,
    onWasmFileChange: () => undefined,
    runnerMode: "shopify" as const,
    savedFixtures: [],
    selectedTemplateId: "basic-product-discount",
    target: "cart.lines.discounts.generate.run",
    templates: [{ id: "basic-product-discount", label: "Basic product discount" }],
    transferFeedback: "",
    wasmFile: null,
  };

  it("keeps benchmark and saved scenarios collapsed by default", () => {
    render(<RunnerControlsPanel {...baseProps} />);

    expect(screen.queryByLabelText("Iterations")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scenario name")).not.toBeInTheDocument();
  });

  it("reveals benchmark fields when the benchmark section is opened", () => {
    render(<RunnerControlsPanel {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Show 2. Benchmark" }));

    expect(screen.getByText("Iterations")).toBeInTheDocument();
    expect(screen.getByText("Warm-up runs")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
  });
});
