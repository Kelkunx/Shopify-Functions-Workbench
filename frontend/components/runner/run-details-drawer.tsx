import { type ReactNode, useId, useState } from "react";
import type { RunResponse } from "../runner-workspace.types";
import {
  DangerBox,
  EmptyState,
  Metric,
  SectionToggleButton,
} from "./runner-ui-primitives";

function formatDuration(durationMs: number | undefined) {
  if (typeof durationMs !== "number") {
    return "N/A";
  }

  return `${durationMs.toFixed(3)} ms`;
}

function DetailSection({
  children,
  defaultOpen = true,
  description,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  description?: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="border-b border-border px-5 py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        <SectionToggleButton
          aria-controls={contentId}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Hide" : "Show"} ${title.toLowerCase()}`}
          onClick={() => setIsOpen((currentValue) => !currentValue)}
        >
          {isOpen ? "Hide" : "Show"}
        </SectionToggleButton>
      </div>
      {isOpen ? (
        <div className="mt-4 space-y-4" id={contentId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function RunDetailsDrawer({
  onClose,
  runRequestError,
  runResponse,
}: {
  onClose: () => void;
  runRequestError: string;
  runResponse: RunResponse | null;
}) {
  const benchmarkResult = runResponse?.benchmark;
  const shopifyDiagnostics = runResponse?.diagnostics.shopify;
  const displayedRunnerMode = shopifyDiagnostics
    ? "shopify"
    : runResponse?.diagnostics.actualRunnerMode;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex bg-stone-950/40"
      onClick={onClose}
      role="dialog"
    >
      <div className="hidden flex-1 lg:block" />
      <div
        className="flex h-full w-full flex-col border-l border-border bg-surface-strong lg:max-w-105"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h1 className="text-sm font-semibold">Run details</h1>
            <p className="mt-1 text-sm text-muted">
              Timings, diagnostics, benchmark runs, and full errors.
            </p>
          </div>
          <button
            className="rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <DetailSection defaultOpen description="Local timing breakdown." title="Timings">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Metric
                label="Parse"
                value={runResponse ? formatDuration(runResponse.timings.parseMs) : "Not run"}
              />
              <Metric
                label="Execute"
                value={runResponse ? formatDuration(runResponse.timings.executionMs) : "Not run"}
              />
              <Metric
                label="Dir check"
                value={formatDuration(runResponse?.timings.shopifyPhases?.directoryCheckMs)}
              />
              <Metric
                label="Function info"
                value={formatDuration(runResponse?.timings.shopifyPhases?.functionInfoMs)}
              />
              <Metric
                label="Wasm prep"
                value={formatDuration(runResponse?.timings.shopifyPhases?.wasmPreparationMs)}
              />
              <Metric
                label="Runner"
                value={formatDuration(runResponse?.timings.shopifyPhases?.functionRunnerMs)}
              />
            </div>
            {runResponse?.timings.shopifyPhases ? (
              <div className="space-y-3">
                <div className="text-xs text-muted">
                  Cleanup: {formatDuration(runResponse.timings.shopifyPhases.cleanupMs)}
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-stone-800">
                  Local timings are indicative only and may differ from Shopify runtime.
                </div>
              </div>
            ) : (
              <EmptyState>Detailed timings appear for Shopify runs.</EmptyState>
            )}
          </DetailSection>

          <DetailSection defaultOpen={false} description="Runner and Shopify metadata." title="Diagnostics">
            {runResponse ? (
              <div className="space-y-2 text-sm text-foreground">
                <div>Runner mode: {displayedRunnerMode}</div>
                <div>Requested mode: {runResponse.diagnostics.requestedRunnerMode}</div>
                <div>
                  Benchmark: {runResponse.diagnostics.benchmarkEnabled ? "enabled" : "off"}
                </div>
                {shopifyDiagnostics ? (
                  <>
                    <div>Target: {shopifyDiagnostics.target}</div>
                    <div>Export: {shopifyDiagnostics.effectiveExportName}</div>
                    <div>
                      Wasm override: {shopifyDiagnostics.wasmOverrideActive ? "on" : "off"}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <EmptyState>No diagnostics yet.</EmptyState>
            )}
          </DetailSection>

          <DetailSection
            defaultOpen={false}
            description="Benchmark summary and measured runs."
            title="Benchmark"
          >
            {benchmarkResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
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
                <div className="space-y-2">
                  {benchmarkResult.runs.map((benchmarkRun) => (
                    <div
                      className="flex items-center justify-between gap-3 border-b border-border pb-2 text-xs text-foreground last:border-b-0 last:pb-0"
                      key={`${benchmarkRun.index}-${benchmarkRun.warmup}`}
                    >
                      <span className="min-w-0">
                        {benchmarkRun.warmup
                          ? `Warm-up ${benchmarkRun.index + 1}`
                          : `Run ${benchmarkRun.index + 1 - benchmarkResult.warmupRuns}`}
                      </span>
                      <span className="text-muted">
                        total {formatDuration(benchmarkRun.timings.totalMs)} · runner{" "}
                        {formatDuration(benchmarkRun.timings.shopifyPhases?.functionRunnerMs)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState>No benchmark data.</EmptyState>
            )}
          </DetailSection>

          <DetailSection
            defaultOpen={Boolean(runRequestError) || Boolean(runResponse?.errorDetails.length)}
            description="Full error list."
            title="Errors"
          >
            {runRequestError ? <DangerBox>{runRequestError}</DangerBox> : null}
            {runResponse?.errorDetails.length ? (
              <div className="space-y-2">
                {runResponse.errorDetails.map((errorDetail) => (
                  <DangerBox key={`${errorDetail.code}-${errorDetail.message}`}>
                    <div className="font-medium">{errorDetail.message}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.02em] text-red-700">
                      {errorDetail.code} · {errorDetail.source}
                    </div>
                  </DangerBox>
                ))}
              </div>
            ) : !runRequestError ? (
              <EmptyState>No runner errors.</EmptyState>
            ) : null}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
