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
    currentScenarioName,
    currentFunctionDir,
    currentFunctionType,
    currentInputJson,
    currentTarget,
    currentWasmFile,
    deleteSavedScenario,
    exportVisibleScenarios,
    scenariosTransferFeedback,
    formatCurrentInputJson,
    importScenarioFile,
    isOutputModalOpen,
    isRunInFlight,
    jsonValidationError,
    loadSavedScenario,
    loadSelectedTemplate,
    outputCopyFeedback,
    renameSavedScenarioPrompt,
    runBenchmark,
    runFunction,
    runRequestError,
    runResponse,
    saveCurrentScenario,
    selectedTemplateId,
    setCurrentBenchmarkIterations,
    setCurrentBenchmarkWarmup,
    setCurrentExportName,
    setCurrentScenarioName,
    setCurrentFunctionDir,
    setCurrentInputJson,
    setCurrentTarget,
    setCurrentWasmFile,
    setIsOutputModalOpen,
    setSelectedTemplateId,
    updateFunctionType,
    updateRunnerMode,
    visibleSavedScenarios,
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
                currentScenarioName={currentScenarioName}
                currentFunctionDir={currentFunctionDir}
                currentFunctionType={currentFunctionType}
                lastRunResponse={runResponse}
                onBenchmarkIterationsChange={setCurrentBenchmarkIterations}
                onBenchmarkWarmupChange={setCurrentBenchmarkWarmup}
                onDeleteSavedScenario={deleteSavedScenario}
                onExportNameChange={setCurrentExportName}
                onExportScenarios={exportVisibleScenarios}
                onScenarioNameChange={setCurrentScenarioName}
                onScenarioSave={saveCurrentScenario}
                onFunctionDirChange={setCurrentFunctionDir}
                onImportScenarios={importScenarioFile}
                onFunctionTypeChange={updateFunctionType}
                onLoadScenario={loadSavedScenario}
                onLoadSelectedTemplate={loadSelectedTemplate}
                onRenameSavedScenario={renameSavedScenarioPrompt}
                onSelectedTemplateChange={setSelectedTemplateId}
                onTargetChange={setCurrentTarget}
                onWasmFileChange={setCurrentWasmFile}
                runnerMode={activeRunnerMode}
                savedScenarios={visibleSavedScenarios}
                selectedTemplateId={selectedTemplateId}
                target={currentTarget}
                templates={availableTemplates}
                scenarioTransferFeedback={scenariosTransferFeedback}
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
