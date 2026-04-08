import type { RunnerMode } from "@/lib/saved-fixtures";
import {
  ModeButton,
  PrimaryButton,
  SecondaryButton,
} from "./runner-ui-primitives";

export function WorkspaceHeader({
  activeExecutionKind,
  isRunInFlight,
  jsonValidationError,
  onBenchmark,
  onFormatJson,
  onRun,
  onRunnerModeChange,
  runnerMode,
}: {
  activeExecutionKind: "benchmark" | "single" | null;
  isRunInFlight: boolean;
  jsonValidationError: string;
  onBenchmark: () => void;
  onFormatJson: () => void;
  onRun: () => void;
  onRunnerModeChange: (mode: RunnerMode) => void;
  runnerMode: RunnerMode;
}) {
  return (
    <header className="border-b border-border bg-surface-strong">
      <div className="flex min-h-16 items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-5">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold">Shopify Functions Workbench</h1>
            <p className="mt-0.5 text-sm text-muted">
              Local Shopify Function runs, scenarios, and benchmark checks.
            </p>
          </div>
          <div className="hidden h-8 w-px bg-border lg:block" />
          <div className="hidden items-center gap-2 lg:flex">
            <ModeButton
              active={runnerMode === "mock"}
              label="Mock"
              onClick={() => onRunnerModeChange("mock")}
            />
            <ModeButton
              active={runnerMode === "shopify"}
              label="Shopify"
              onClick={() => onRunnerModeChange("shopify")}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SecondaryButton
            disabled={Boolean(jsonValidationError)}
            onClick={onFormatJson}
            type="button"
          >
            Format JSON
          </SecondaryButton>
          <SecondaryButton
            disabled={isRunInFlight || Boolean(jsonValidationError)}
            onClick={onBenchmark}
            type="button"
          >
            {isRunInFlight && activeExecutionKind === "benchmark"
              ? "Benchmarking..."
              : "Benchmark"}
          </SecondaryButton>
          <PrimaryButton disabled={isRunInFlight} onClick={onRun} type="button">
            {isRunInFlight && activeExecutionKind === "single" ? "Running..." : "Run"}
          </PrimaryButton>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-5 py-2 text-sm lg:hidden">
        <ModeButton
          active={runnerMode === "mock"}
          label="Mock"
          onClick={() => onRunnerModeChange("mock")}
        />
        <ModeButton
          active={runnerMode === "shopify"}
          label="Shopify"
          onClick={() => onRunnerModeChange("shopify")}
        />
      </div>
    </header>
  );
}
