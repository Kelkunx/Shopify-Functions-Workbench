import { useRef } from "react";
import { functionTypes, type FunctionType } from "@/lib/function-templates";
import type { RunnerMode, SavedFixture } from "@/lib/saved-fixtures";
import { formatTimestamp } from "../runner-workspace.helpers";
import {
  EmptyState,
  Field,
  FixtureActionButton,
  InlineNote,
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
      <SidebarSection
        description="Configure the next run here. Required Shopify fields are grouped together so the path to execution stays obvious."
        title="1. Run setup"
      >
        {runnerMode === "shopify" ? (
          currentShopifyConfigLooksReady ? (
            <InlineNote>Shopify mode is active. The next run will use your local function directory.</InlineNote>
          ) : (
            <InlineNote tone="danger">
              Shopify mode is active. Fill both <code>functionDir</code> and <code>target</code> before running.
            </InlineNote>
          )
        ) : (
          <InlineNote>
            Mock mode is available for quick payload and output checks before a real Shopify run.
          </InlineNote>
        )}

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

        {runnerMode === "shopify" ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Required for Shopify runs</h3>
              <p className="mt-1 text-sm leading-5 text-muted">
                These fields point the workbench to the local Shopify Function you want to execute.
              </p>
            </div>

            <Field
              helper="Local function directory. This is the main path used for real local validation."
              label="functionDir (required)"
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
              label="target (required)"
            >
              <TextInput
                onChange={(event) => onTargetChange(event.target.value)}
                placeholder="cart.lines.discounts.generate.run"
                type="text"
                value={target}
              />
            </Field>

            <Field helper="Optional. Defaults to `run`." label="exportName">
              <TextInput
                onChange={(event) => onExportNameChange(event.target.value)}
                placeholder="run"
                type="text"
                value={currentExportName}
              />
            </Field>

            {currentTargetResolved ? (
              <InlineNote>Target resolved on the last successful Shopify run.</InlineNote>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Optional Wasm override</h3>
            <p className="mt-1 text-sm leading-5 text-muted">
              Use this only when you want to run a specific local Wasm build instead of the default output.
            </p>
          </div>

          <Field
            helper={
              runnerMode === "mock"
                ? "Optional in mock mode. The backend can run without a real file. Only run trusted Wasm locally."
                : "Optional override for Shopify mode. Only run trusted Wasm locally."
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

          {wasmFile ? (
            <InlineNote>
              Wasm override selected. This run will ignore the built Shopify Wasm in the
              function directory.
            </InlineNote>
          ) : null}
        </div>
      </SidebarSection>

      <SidebarSection
        description="Secondary tool. Use this when you want repeated local measurements rather than a single execution."
        title="2. Benchmark"
      >
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
    <SidebarSection
      description="Secondary tool. Keep reusable local scenarios here so you can reload them quickly later."
      title="Saved scenarios"
    >
      <Field
        helper="Save will overwrite by name inside the same mode."
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

      {transferFeedback ? <InlineNote>{transferFeedback}</InlineNote> : null}

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
    <div className="border-b border-border pb-3 last:border-b-0 last:pb-0">
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
