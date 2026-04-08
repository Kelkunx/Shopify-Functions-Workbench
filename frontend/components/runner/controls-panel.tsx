import { type ReactNode, useId, useRef, useState } from "react";
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
  SectionToggleButton,
  SidebarPanel,
  SidebarSection,
  TextInput,
} from "./runner-ui-primitives";
import { runnerUiClassNames } from "./runner-ui-class-names";

export function RunnerControlsPanel({
  className,
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
  className?: string;
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
    <SidebarPanel className={className}>
      <SidebarSection
        description="Set up the next run."
        title="1. Run setup"
      >
        {runnerMode === "shopify" ? (
          currentShopifyConfigLooksReady ? (
            <InlineNote>Shopify mode is active.</InlineNote>
          ) : (
            <InlineNote tone="danger">
              Fill <code>functionDir</code> and <code>target</code> to run in Shopify mode.
            </InlineNote>
          )
        ) : (
          <InlineNote>Mock mode is for quick checks.</InlineNote>
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
                Point the workbench to the local Shopify Function.
              </p>
            </div>

            <Field
              helper="Path to the local function directory."
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
              helper="Exact Shopify target."
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
              <InlineNote>Target resolved on the last run.</InlineNote>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Optional Wasm override</h3>
            <p className="mt-1 text-sm leading-5 text-muted">
              Use a specific local Wasm build.
            </p>
          </div>

          <Field
          helper={
            runnerMode === "mock"
                ? "Optional in mock mode. Only run trusted Wasm locally."
                : "Optional in Shopify mode. Only run trusted Wasm locally."
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
              This run will use the uploaded Wasm.
            </InlineNote>
          ) : null}
        </div>
      </SidebarSection>

      <CollapsibleRailSection
        defaultOpen={false}
        description="Optional repeated runs."
        title="2. Benchmark"
      >
        <Field
          helper="Warm-up runs are excluded from averages."
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
        <Field helper="Default: 1. Keep this below iterations." label="Warm-up runs">
          <TextInput
            min={0}
            onChange={(event) =>
              onBenchmarkWarmupChange(Number.parseInt(event.target.value || "0", 10))
            }
            type="number"
            value={currentBenchmarkWarmup}
          />
        </Field>
      </CollapsibleRailSection>

      <SavedFixturesSection
        currentScenarioName={currentFixtureName}
        defaultOpen={false}
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

function CollapsibleRailSection({
  children,
  defaultOpen,
  description,
  title,
}: {
  children: ReactNode;
  defaultOpen: boolean;
  description: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <SidebarSection
      actions={
        <SectionToggleButton
          aria-controls={contentId}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Hide" : "Show"} ${title}`}
          onClick={() => setIsOpen((currentValue) => !currentValue)}
        >
          {isOpen ? "Hide" : "Show"}
        </SectionToggleButton>
      }
      description={description}
      title={title}
    >
      {isOpen ? <div id={contentId}>{children}</div> : null}
    </SidebarSection>
  );
}

function SavedFixturesSection({
  currentScenarioName,
  defaultOpen,
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
  defaultOpen: boolean;
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
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const importInputReference = useRef<HTMLInputElement | null>(null);
  const contentId = useId();

  return (
    <SidebarSection
      actions={
        <SectionToggleButton
          aria-controls={contentId}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Hide" : "Show"} saved scenarios`}
          onClick={() => setIsOpen((currentValue) => !currentValue)}
        >
          {isOpen ? "Hide" : "Show"}
        </SectionToggleButton>
      }
      description="Optional saved scenarios."
      title="Saved scenarios"
    >
      {isOpen ? (
        <div id={contentId} className="space-y-4">
          <Field
            helper="Save overwrites by name in the same mode."
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
              <EmptyState>No saved scenarios.</EmptyState>
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
        </div>
      ) : null}
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
