import type { RunResponse } from "../runner-workspace.types";
import { formatOutputJson } from "../runner-workspace.helpers";
import {
  CodeBlock,
  DangerBox,
  EmptyState,
  Metric,
  SidebarPanel,
  SidebarSection,
  SmallActionButton,
} from "./runner-ui-primitives";

function formatDuration(durationMs: number | undefined) {
  if (typeof durationMs !== "number") {
    return "N/A";
  }

  return `${durationMs.toFixed(3)} ms`;
}

export function RunResultsPanel({
  copyFeedback,
  onCopyOutput,
  onExpandOutput,
  runRequestError,
  runResponse,
}: {
  copyFeedback: string;
  onCopyOutput: () => void;
  onExpandOutput: () => void;
  runRequestError: string;
  runResponse: RunResponse | null;
}) {
  const benchmarkResult = runResponse?.benchmark;

  return (
    <SidebarPanel>
      <SidebarSection title="Run state">
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Status"
            value={
              runResponse ? (runResponse.success ? "Success" : "Failed") : "Idle"
            }
          />
          <Metric
            label="Exec time"
            value={
              runResponse
                ? `${runResponse.executionTimeMs.toFixed(3)} ms`
                : "Not run"
            }
          />
          <Metric
            label="Errors"
            value={runResponse?.errorDetails.length?.toString() ?? "0"}
          />
          <Metric
            label="Output keys"
            value={runResponse ? Object.keys(runResponse.output).length.toString() : "0"}
          />
        </div>
        {runRequestError ? <DangerBox>{runRequestError}</DangerBox> : null}
      </SidebarSection>

      <SidebarSection title="Timings">
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Parse"
            value={runResponse ? formatDuration(runResponse.timings.parseMs) : "Not run"}
          />
          <Metric
            label="Execute"
            value={
              runResponse ? formatDuration(runResponse.timings.executionMs) : "Not run"
            }
          />
          <Metric
            label="Dir check"
            value={
              runResponse
                ? formatDuration(runResponse.timings.shopifyPhases?.directoryCheckMs)
                : "Not run"
            }
          />
          <Metric
            label="Function info"
            value={
              runResponse
                ? formatDuration(runResponse.timings.shopifyPhases?.functionInfoMs)
                : "Not run"
            }
          />
          <Metric
            label="Wasm prep"
            value={
              runResponse
                ? formatDuration(runResponse.timings.shopifyPhases?.wasmPreparationMs)
                : "Not run"
            }
          />
          <Metric
            label="Runner"
            value={
              runResponse
                ? formatDuration(runResponse.timings.shopifyPhases?.functionRunnerMs)
                : "Not run"
            }
          />
        </div>
        {runResponse?.timings.shopifyPhases ? (
          <div className="space-y-3">
            <div className="text-xs text-muted">
              Cleanup: {formatDuration(runResponse.timings.shopifyPhases.cleanupMs)}
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-stone-800">
              Local timings are indicative only. They include your local runner
              environment and may differ from Shopify production runtime
              performance.
            </div>
          </div>
        ) : (
          <EmptyState>Detailed phase timings appear for Shopify runs.</EmptyState>
        )}
      </SidebarSection>

      <SidebarSection title="Benchmark">
        {benchmarkResult ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Measured avg"
                value={formatDuration(benchmarkResult.summary.averageTotalMs)}
              />
              <Metric
                label="Runner avg"
                value={formatDuration(benchmarkResult.summary.averageRunnerMs ?? undefined)}
              />
              <Metric
                label="Min total"
                value={formatDuration(benchmarkResult.summary.minTotalMs)}
              />
              <Metric
                label="Max total"
                value={formatDuration(benchmarkResult.summary.maxTotalMs)}
              />
            </div>
            <div className="rounded-md border border-border bg-surface px-3 py-3">
              <div className="mb-2 text-xs text-muted">
                {benchmarkResult.warmupRuns} warm-up run
                {benchmarkResult.warmupRuns > 1 ? "s" : ""} excluded from{" "}
                {benchmarkResult.measuredRuns} measured run
                {benchmarkResult.measuredRuns > 1 ? "s" : ""}.
              </div>
              <div className="space-y-2">
                {benchmarkResult.runs.map((benchmarkRun) => (
                  <div
                    className="flex items-center justify-between gap-3 text-xs text-foreground"
                    key={`${benchmarkRun.index}-${benchmarkRun.warmup}`}
                  >
                    <span className="min-w-0">
                      {benchmarkRun.warmup
                        ? `Warm-up ${benchmarkRun.index + 1}`
                        : `Run ${benchmarkRun.index + 1 - benchmarkResult.warmupRuns}`}
                    </span>
                    <span className="text-muted">
                      total {formatDuration(benchmarkRun.timings.totalMs)} • runner{" "}
                      {formatDuration(
                        benchmarkRun.timings.shopifyPhases?.functionRunnerMs,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState>
            Run a benchmark to compare repeated local executions without the browser
            affecting every measurement equally.
          </EmptyState>
        )}
      </SidebarSection>

      <SidebarSection title="Errors">
        {runResponse?.errorDetails.length ? (
          <div className="space-y-2">
            {runResponse.errorDetails.map((errorDetail) => (
              <DangerBox key={`${errorDetail.code}-${errorDetail.message}`}>
                <div className="font-medium">{errorDetail.message}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.02em] text-red-700">
                  {errorDetail.code} • {errorDetail.source}
                </div>
              </DangerBox>
            ))}
          </div>
        ) : (
          <EmptyState>No runner errors.</EmptyState>
        )}
      </SidebarSection>

      <SidebarSection title="Output">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted">
            {runResponse
              ? "Structured JSON response from the runner."
              : "Run the payload to inspect output."}
          </div>
          <div className="flex items-center gap-2">
            {copyFeedback ? (
              <span className="text-xs text-muted">{copyFeedback}</span>
            ) : null}
            <SmallActionButton
              disabled={!runResponse}
              onClick={onCopyOutput}
              type="button"
            >
              Copy
            </SmallActionButton>
            <SmallActionButton
              disabled={!runResponse}
              onClick={onExpandOutput}
              type="button"
            >
              Expand
            </SmallActionButton>
          </div>
        </div>
        <CodeBlock>
          {runResponse ? formatOutputJson(runResponse.output) : "{\n  \n}"}
        </CodeBlock>
      </SidebarSection>
    </SidebarPanel>
  );
}
