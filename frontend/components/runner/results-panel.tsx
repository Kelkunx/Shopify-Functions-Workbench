import type { RunResponse } from "../runner-workspace.types";
import { formatOutputJson } from "../runner-workspace.helpers";
import {
  CodeBlock,
  DangerBox,
  EmptyState,
  IconActionButton,
  InlineNote,
  Metric,
  SidebarPanel,
  SidebarSection,
} from "./runner-ui-primitives";

function formatDuration(durationMs: number | undefined) {
  if (typeof durationMs !== "number") {
    return "N/A";
  }

  return `${durationMs.toFixed(3)} ms`;
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect height="12" rx="2" width="12" x="9" y="9" />
      <path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M9 21H3v-6" />
      <path d="M3 21 14 10" />
    </svg>
  );
}

export function RunResultsPanel({
  copyFeedback,
  onCopyOutput,
  onExpandOutput,
  onOpenDetails,
  runRequestError,
  runResponse,
}: {
  copyFeedback: string;
  onCopyOutput: () => void;
  onExpandOutput: () => void;
  onOpenDetails: () => void;
  runRequestError: string;
  runResponse: RunResponse | null;
}) {
  const benchmarkResult = runResponse?.benchmark;
  const hasRunResponse = Boolean(runResponse);
  const isSuccessfulRun = runResponse?.success === true;
  const lastBenchmarkRun = benchmarkResult?.runs.at(-1) ?? null;
  const currentStatusLabel = hasRunResponse
    ? isSuccessfulRun
      ? "Success"
      : "Failed"
    : "Idle";
  const currentStatusDescription = hasRunResponse
    ? benchmarkResult
      ? isSuccessfulRun
        ? "Benchmark completed. Showing the final run."
        : "Benchmark stopped on the final run."
      : isSuccessfulRun
        ? "The last run completed."
        : "The last run failed."
    : "Run the current setup.";
  const currentExecutionTimeValue =
    lastBenchmarkRun?.executionTimeMs ?? runResponse?.executionTimeMs;
  const currentExecutionTime = hasRunResponse
    ? `${currentExecutionTimeValue?.toFixed(3)} ms`
    : "Not run";
  const currentExecutionTimeLabel = benchmarkResult
    ? "Last run time"
    : "Execution time";
  const hasDetails =
    Boolean(runResponse) || Boolean(runRequestError);
  const primaryErrorMessage = runRequestError || runResponse?.errorDetails[0]?.message || "";
  const additionalErrorCount = runRequestError
    ? runResponse?.errorDetails.length ?? 0
    : Math.max((runResponse?.errorDetails.length ?? 0) - 1, 0);

  return (
    <SidebarPanel>
      <SidebarSection
        actions={
          <button
            className="text-sm font-medium text-foreground underline-offset-2 transition-colors hover:text-primary disabled:text-muted"
            disabled={!hasDetails}
            onClick={onOpenDetails}
            type="button"
          >
            Details
          </button>
        }
        description="Latest run status."
        title="Run result"
      >
        <div className="rounded-md border border-border bg-surface px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-muted">Status</div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                {currentStatusLabel}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">{currentExecutionTimeLabel}</div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                {currentExecutionTime}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-5 text-muted">
            {currentStatusDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <Metric
            label="Errors"
            value={runResponse?.errorDetails.length?.toString() ?? "0"}
          />
          <Metric
            label="Output keys"
            value={runResponse ? Object.keys(runResponse.output).length.toString() : "0"}
          />
        </div>
      </SidebarSection>

      <SidebarSection
        actions={
          <div className="flex items-center gap-2">
            <IconActionButton
              aria-label="Copy output"
              disabled={!runResponse}
              onClick={onCopyOutput}
              title="Copy output"
            >
              <CopyIcon />
            </IconActionButton>
            <IconActionButton
              aria-label="Expand output"
              disabled={!runResponse}
              onClick={onExpandOutput}
              title="Expand output"
            >
              <ExpandIcon />
            </IconActionButton>
          </div>
        }
        description="Latest runner output."
        title="Output"
      >
        {copyFeedback ? <InlineNote>{copyFeedback}</InlineNote> : null}
        <CodeBlock className="max-h-72">
          {runResponse ? formatOutputJson(runResponse.output) : "{\n  \n}"}
        </CodeBlock>
      </SidebarSection>

      <SidebarSection description="Runner errors." title="Errors">
        {primaryErrorMessage ? (
          <DangerBox>
            <div className="font-medium">{primaryErrorMessage}</div>
            {additionalErrorCount > 0 ? (
              <div className="mt-1 text-xs text-red-700">
                {additionalErrorCount} more error
                {additionalErrorCount > 1 ? "s" : ""} in details.
              </div>
            ) : null}
          </DangerBox>
        ) : (
          <EmptyState>No runner errors.</EmptyState>
        )}

        {runResponse?.timings.shopifyPhases ? (
          <InlineNote>
            Parse {formatDuration(runResponse.timings.parseMs)} · Runner{" "}
            {formatDuration(runResponse.timings.shopifyPhases.functionRunnerMs)}
          </InlineNote>
        ) : null}
      </SidebarSection>
    </SidebarPanel>
  );
}
