"use client";

import { useMemo } from "react";
import { RunnerControlsPanel } from "./runner/controls-panel";
import { EditorPanel } from "./runner/editor-panel";
import { ExpandedOutputModal } from "./runner/expanded-output-modal";
import { RunInspector } from "./runner/run-inspector";
import { WorkspaceHeader } from "./runner/workspace-header";
import { useRunnerWorkspaceController } from "./use-runner-workspace-controller";

export function RunnerWorkspace() {
  const {
    activeRunnerMode,
    activeExecutionKind,
    availableTemplates,
    currentBenchmarkIterations,
    currentBenchmarkWarmup,
    copyRunOutput,
    currentExportName,
    currentFixtureName,
    currentFunctionDir,
    currentFunctionType,
    currentInputJson,
    currentTarget,
    currentWasmFile,
    deleteSavedFixture,
    exportVisibleFixtures,
    fixturesTransferFeedback,
    formatCurrentInputJson,
    importFixtureFile,
    isOutputModalOpen,
    isRunInFlight,
    jsonValidationError,
    loadSavedFixture,
    loadSelectedTemplate,
    outputCopyFeedback,
    renameScenario,
    runBenchmark,
    runFunction,
    runRequestError,
    runResponse,
    saveCurrentFixture,
    selectedTemplateId,
    setCurrentBenchmarkIterations,
    setCurrentBenchmarkWarmup,
    setCurrentExportName,
    setCurrentFixtureName,
    setCurrentFunctionDir,
    setCurrentInputJson,
    setCurrentTarget,
    setCurrentWasmFile,
    setIsOutputModalOpen,
    setSelectedTemplateId,
    updateFunctionType,
    updateRunnerMode,
    visibleSavedFixtures,
  } = useRunnerWorkspaceController();
  const desktopGridColumns = useMemo(
    () => "xl:grid-cols-[332px_minmax(0,1fr)_384px] 2xl:grid-cols-[348px_minmax(0,1fr)_408px]",
    [],
  );

  function handleRun() {
    runFunction();
  }

  function handleBenchmark() {
    runBenchmark();
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
        <WorkspaceHeader
          activeExecutionKind={activeExecutionKind}
          isRunInFlight={isRunInFlight}
          onBenchmark={handleBenchmark}
          jsonValidationError={jsonValidationError}
          onFormatJson={formatCurrentInputJson}
          onRun={handleRun}
          onRunnerModeChange={updateRunnerMode}
          runnerMode={activeRunnerMode}
        />

        <main className="flex min-h-0 flex-1 flex-col px-5 py-5 lg:overflow-hidden lg:px-6 lg:py-6">
          <div className={`grid min-h-0 flex-1 gap-4 xl:h-full ${desktopGridColumns}`}>
            <div className="flex min-h-0 xl:h-full">
              <RunnerControlsPanel
                currentBenchmarkIterations={currentBenchmarkIterations}
                currentBenchmarkWarmup={currentBenchmarkWarmup}
                currentExportName={currentExportName}
                currentFixtureName={currentFixtureName}
                currentFunctionDir={currentFunctionDir}
                currentFunctionType={currentFunctionType}
                lastRunResponse={runResponse}
                onBenchmarkIterationsChange={setCurrentBenchmarkIterations}
                onBenchmarkWarmupChange={setCurrentBenchmarkWarmup}
                onDeleteSavedFixture={deleteSavedFixture}
                onExportNameChange={setCurrentExportName}
                onExportFixtures={exportVisibleFixtures}
                onFixtureNameChange={setCurrentFixtureName}
                onFixtureSave={saveCurrentFixture}
                onFunctionDirChange={setCurrentFunctionDir}
                onImportFixtures={importFixtureFile}
                onFunctionTypeChange={updateFunctionType}
                onLoadFixture={loadSavedFixture}
                onLoadSelectedTemplate={loadSelectedTemplate}
                onRenameScenario={renameScenario}
                onSelectedTemplateChange={setSelectedTemplateId}
                onTargetChange={setCurrentTarget}
                onWasmFileChange={setCurrentWasmFile}
                runnerMode={activeRunnerMode}
                savedFixtures={visibleSavedFixtures}
                selectedTemplateId={selectedTemplateId}
                target={currentTarget}
                templates={availableTemplates}
                transferFeedback={fixturesTransferFeedback}
                wasmFile={currentWasmFile}
              />
            </div>

            <div className="flex min-h-0 xl:h-full">
              <EditorPanel
                inputJson={currentInputJson}
                jsonValidationError={jsonValidationError}
                onInputChange={setCurrentInputJson}
                runnerMode={activeRunnerMode}
              />
            </div>

            <div className="flex min-h-0 xl:h-full">
              <RunInspector
                copyFeedback={outputCopyFeedback}
                onCopyOutput={copyRunOutput}
                onExpandOutput={() => setIsOutputModalOpen(true)}
                runRequestError={runRequestError}
                runResponse={runResponse}
              />
            </div>
          </div>
        </main>
      </div>

      {isOutputModalOpen && runResponse ? (
        <ExpandedOutputModal
          onClose={() => setIsOutputModalOpen(false)}
          onCopyOutput={copyRunOutput}
          output={runResponse.output}
        />
      ) : null}
    </>
  );
}
