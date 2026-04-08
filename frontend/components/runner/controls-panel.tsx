import { useRef } from "react";
import { functionTypes, type FunctionType } from "@/lib/function-templates";
import type { RunnerMode, SavedFixture } from "@/lib/saved-fixtures";
import { formatTimestamp } from "../runner-workspace.helpers";
import {
  EmptyState,
  Field,
  FixtureActionButton,
  StateBadge,
  SecondaryButton,
  SelectInput,
  SidebarPanel,
  SidebarSection,
  TextInput,
} from "./runner-ui-primitives";
import { runnerUiClassNames } from "./runner-ui-class-names";

export function RunnerControlsPanel({
  currentBenchmarkIterations,
  currentBenchmarkWarmup,
  currentExportName,
  currentFixtureName,
  currentFunctionDir,
  currentFunctionType,
  lastRunResponse,
  onDeleteSavedFixture,
  onExportNameChange,
  onExportFixtures,
  onFixtureNameChange,
  onFixtureSave,
  onFunctionDirChange,
  onImportFixtures,
  onBenchmarkIterationsChange,
  onBenchmarkWarmupChange,
  onFunctionTypeChange,
  onLoadFixture,
  onLoadSelectedTemplate,
  onRenameScenario,
  onSelectedTemplateChange,
  onTargetChange,
  onWasmFileChange,
  runnerMode,
  savedFixtures,
  selectedTemplateId,
  target,
  templates,
  transferFeedback,
  wasmFile,
}: {
  currentBenchmarkIterations: number;
  currentBenchmarkWarmup: number;
  currentExportName: string;
  currentFixtureName: string;
  currentFunctionDir: string;
  currentFunctionType: FunctionType;
  lastRunResponse: {
    diagnostics: {
      actualRunnerMode: RunnerMode;
      shopify?: {
        target: string;
        targetResolved: boolean;
        wasmOverrideActive: boolean;
      };
    };
  } | null;
  onDeleteSavedFixture: (savedFixtureId: string) => void;
  onExportNameChange: (value: string) => void;
  onExportFixtures: () => void;
  onFixtureNameChange: (value: string) => void;
  onFixtureSave: () => void;
  onFunctionDirChange: (value: string) => void;
  onImportFixtures: (file: File | null) => void;
  onBenchmarkIterationsChange: (value: number) => void;
  onBenchmarkWarmupChange: (value: number) => void;
  onFunctionTypeChange: (value: FunctionType) => void;
  onLoadFixture: (savedFixture: SavedFixture) => void;
  onLoadSelectedTemplate: () => void;
  onRenameScenario: (savedFixture: SavedFixture) => void;
  onSelectedTemplateChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onWasmFileChange: (file: File | null) => void;
  runnerMode: RunnerMode;
  savedFixtures: SavedFixture[];
  selectedTemplateId: string;
  target: string;
  templates: { id: string; label: string }[];
  transferFeedback: string;
  wasmFile: File | null;
}) {
  const currentShopifyConfigLooksReady =
    runnerMode === "shopify" &&
    currentFunctionDir.trim().length > 0 &&
    target.trim().length > 0;
  const currentTargetResolved =
    runnerMode === "shopify" &&
    lastRunResponse?.diagnostics.actualRunnerMode === "shopify" &&
    lastRunResponse.diagnostics.shopify?.targetResolved === true &&
    lastRunResponse.diagnostics.shopify.target === target.trim();

  return (
    <SidebarPanel>
      <SidebarSection title="Runner">
        <Field label="Function type">
          <SelectInput
            onChange={(event) => onFunctionTypeChange(event.target.value as FunctionType)}
            value={currentFunctionType}
          >
            {functionTypes.map((functionTypeOption) => (
              <option key={functionTypeOption.value} value={functionTypeOption.value}>
                {functionTypeOption.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Input template">
          <div className="flex gap-2">
            <SelectInput
              className="min-w-0 flex-1"
              onChange={(event) => onSelectedTemplateChange(event.target.value)}
              value={selectedTemplateId}
            >
              {templates.map((templateOption) => (
                <option key={templateOption.id} value={templateOption.id}>
                  {templateOption.label}
                </option>
              ))}
            </SelectInput>
            <SecondaryButton onClick={onLoadSelectedTemplate} type="button">
              Load
            </SecondaryButton>
          </div>
        </Field>

        <Field
          helper={
            runnerMode === "mock"
              ? "Optional in assistive mock mode. The backend can run without a real file. Only run trusted Wasm locally."
              : "Optional override when you want to run a local Shopify function with a different build output. Only run trusted Wasm locally."
          }
          label="Wasm file"
        >
          <input
            accept=".wasm"
            className={`${runnerUiClassNames.textInput} block py-2 file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white`}
            onChange={(event) => onWasmFileChange(event.target.files?.[0] ?? null)}
            type="file"
          />
          <div className="mt-2 text-sm text-muted">
            {wasmFile ? wasmFile.name : "No file selected"}
          </div>
        </Field>
      </SidebarSection>

      {runnerMode === "shopify" ? (
        <SidebarSection title="Shopify runner">
          <StateBadge tone={currentShopifyConfigLooksReady ? "neutral" : "danger"}>
            {currentShopifyConfigLooksReady
              ? "Shopify runner fields are present."
              : "functionDir and target are required for real Shopify runs."}
          </StateBadge>

          <Field
            helper="Local function directory. This is the primary path for serious local validation."
            label="functionDir"
          >
            <TextInput
              onChange={(event) => onFunctionDirChange(event.target.value)}
              placeholder="/path/to/extensions/discount"
              type="text"
              value={currentFunctionDir}
            />
          </Field>

          <Field
            helper="Exact Shopify target, for example `cart.lines.discounts.generate.run`."
            label="target"
          >
            <TextInput
              onChange={(event) => onTargetChange(event.target.value)}
              placeholder="cart.lines.discounts.generate.run"
              type="text"
              value={target}
            />
          </Field>

          <Field helper="Defaults to `run`." label="exportName">
            <TextInput
              onChange={(event) => onExportNameChange(event.target.value)}
              placeholder="run"
              type="text"
              value={currentExportName}
            />
          </Field>

          <div className="space-y-2">
            {currentTargetResolved ? (
              <StateBadge tone="neutral">Target resolved on the last successful run.</StateBadge>
            ) : null}
            {wasmFile ? (
              <StateBadge tone="neutral">
                Wasm override selected. This run will not use the built Shopify Wasm.
              </StateBadge>
            ) : null}
          </div>
        </SidebarSection>
      ) : null}

      <SidebarSection title="Benchmark">
        <Field
          helper="Warm-up runs are excluded from the averages. Use this to compare local runner performance without the browser."
          label="Iterations"
        >
          <TextInput
            min={1}
            onChange={(event) =>
              onBenchmarkIterationsChange(Number.parseInt(event.target.value || "1", 10))
            }
            type="number"
            value={currentBenchmarkIterations}
          />
        </Field>
        <Field helper="Default is 1. Keep this lower than iterations." label="Warm-up runs">
          <TextInput
            min={0}
            onChange={(event) =>
              onBenchmarkWarmupChange(Number.parseInt(event.target.value || "0", 10))
            }
            type="number"
            value={currentBenchmarkWarmup}
          />
        </Field>
      </SidebarSection>

      <SavedFixturesSection
        currentScenarioName={currentFixtureName}
        onDeleteSavedFixture={onDeleteSavedFixture}
        onExportFixtures={onExportFixtures}
        onRenameScenario={onRenameScenario}
        onScenarioNameChange={onFixtureNameChange}
        onScenarioSave={onFixtureSave}
        onImportFixtures={onImportFixtures}
        onLoadFixture={onLoadFixture}
        savedFixtures={savedFixtures}
        transferFeedback={transferFeedback}
      />
    </SidebarPanel>
  );
}

function SavedFixturesSection({
  currentScenarioName,
  onDeleteSavedFixture,
  onExportFixtures,
  onRenameScenario,
  onScenarioNameChange,
  onScenarioSave,
  onImportFixtures,
  onLoadFixture,
  savedFixtures,
  transferFeedback,
}: {
  currentScenarioName: string;
  onDeleteSavedFixture: (savedFixtureId: string) => void;
  onExportFixtures: () => void;
  onRenameScenario: (savedFixture: SavedFixture) => void;
  onScenarioNameChange: (value: string) => void;
  onScenarioSave: () => void;
  onImportFixtures: (file: File | null) => void;
  onLoadFixture: (savedFixture: SavedFixture) => void;
  savedFixtures: SavedFixture[];
  transferFeedback: string;
}) {
  const importInputReference = useRef<HTMLInputElement | null>(null);

  return (
    <SidebarSection title="Saved scenarios">
      <Field
        helper="Reusable local scenarios for the current runner mode. Save will overwrite by name inside the same mode."
        label="Scenario name"
      >
        <div className="flex gap-2">
          <TextInput
            className="min-w-0 flex-1"
            onChange={(event) => onScenarioNameChange(event.target.value)}
            placeholder="black-friday-check"
            type="text"
            value={currentScenarioName}
          />
          <SecondaryButton onClick={onScenarioSave} type="button">
            Save
          </SecondaryButton>
        </div>
      </Field>

      <div className="flex gap-2">
        <SecondaryButton onClick={onExportFixtures} type="button">
          Export
        </SecondaryButton>
        <SecondaryButton
          onClick={() => importInputReference.current?.click()}
          type="button"
        >
          Import
        </SecondaryButton>
        <input
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            onImportFixtures(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
          ref={importInputReference}
          type="file"
        />
      </div>

      {transferFeedback ? (
        <StateBadge tone="neutral">{transferFeedback}</StateBadge>
      ) : null}

      <div className="space-y-2">
        {savedFixtures.length === 0 ? (
          <EmptyState>No saved scenarios for this mode.</EmptyState>
        ) : (
          savedFixtures.map((savedFixture) => (
            <SavedFixtureCard
              key={savedFixture.id}
              onDelete={() => onDeleteSavedFixture(savedFixture.id)}
              onLoad={() => onLoadFixture(savedFixture)}
              onRename={() => onRenameScenario(savedFixture)}
              savedFixture={savedFixture}
            />
          ))
        )}
      </div>
    </SidebarSection>
  );
}

function SavedFixtureCard({
  onDelete,
  onLoad,
  onRename,
  savedFixture,
}: {
  onDelete: () => void;
  onLoad: () => void;
  onRename: () => void;
  savedFixture: SavedFixture;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">
            {savedFixture.name}
          </div>
          <div className="mt-1 text-xs text-muted">
            {savedFixture.runnerMode} • {savedFixture.functionType} • updated{" "}
            {formatTimestamp(savedFixture.updatedAt)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <FixtureActionButton onClick={onLoad} type="button">
            Load
          </FixtureActionButton>
          <FixtureActionButton onClick={onRename} type="button">
            Rename
          </FixtureActionButton>
          <FixtureActionButton onClick={onDelete} tone="danger" type="button">
            Delete
          </FixtureActionButton>
        </div>
      </div>
      {savedFixture.lastUsedAt ? (
        <div className="mt-2 text-xs text-muted">
          Last used {formatTimestamp(savedFixture.lastUsedAt)}
        </div>
      ) : null}
      {savedFixture.runnerMode === "shopify" && savedFixture.target ? (
        <div className="mt-2 truncate text-xs text-muted">{savedFixture.target}</div>
      ) : null}
    </div>
  );
}
