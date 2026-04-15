"use client";

import { formatTemplateInput } from "@/lib/function-templates";
import {
  type SavedScenario,
  type ScenarioBenchmarkSummary,
} from "@/lib/saved-scenarios";
import { formatJsonString } from "./runner-workspace.helpers";
import { useRunOutputState } from "./runner/hooks/use-run-output-state";
import { useRunnerExecution } from "./runner/hooks/use-runner-execution";
import { useRunnerFormState } from "./runner/hooks/use-runner-form-state";
import { useSavedScenariosStore } from "./runner/hooks/use-saved-scenarios-store";

export function useRunnerWorkspaceController() {
  const {
    activeRunnerMode,
    activeTemplate,
    availableTemplates,
    applySavedScenario,
    currentBenchmarkIterations,
    currentBenchmarkWarmup,
    currentExportName,
    currentScenarioName,
    currentFunctionDir,
    currentFunctionType,
    currentInputJson,
    currentTarget,
    currentWasmFile,
    jsonValidationError,
    selectedTemplateId,
    setCurrentBenchmarkIterations,
    setCurrentBenchmarkWarmup,
    setCurrentExportName,
    setCurrentScenarioName,
    setCurrentFunctionDir,
    setCurrentInputJson,
    setCurrentTarget,
    setCurrentWasmFile,
    setSelectedTemplateId,
    updateFunctionType,
    updateRunnerMode,
  } = useRunnerFormState();

  const {
    deleteSavedScenario: removeSavedScenario,
    exportVisibleScenarios,
    importSavedScenariosFile,
    markScenarioUsed,
    recordScenarioBenchmark,
    renameSavedScenario: renameStoredScenario,
    scenariosTransferFeedback,
    upsertSavedScenario,
    visibleSavedScenarios,
  } = useSavedScenariosStore(activeRunnerMode);
  const {
    activeExecutionKind,
    isRunInFlight,
    runBenchmark,
    runFunction,
    runRequestError,
    runResponse,
    setRunRequestError,
  } = useRunnerExecution({
    currentBenchmarkIterations,
    currentBenchmarkWarmup,
    currentExportName,
    currentFunctionDir,
    currentFunctionType,
    currentInputJson,
    currentTarget,
    currentWasmFile,
    jsonValidationError,
    onRunComplete: (completedRunResponse) => {
      if (!completedRunResponse.benchmark) {
        return;
      }

      const trimmedScenarioName = currentScenarioName.trim();

      if (!trimmedScenarioName) {
        return;
      }

      const matchingScenario = visibleSavedScenarios.find(
        (savedScenario) =>
          savedScenario.name.toLowerCase() === trimmedScenarioName.toLowerCase(),
      );

      if (!matchingScenario) {
        return;
      }

      const benchmarkSummary: ScenarioBenchmarkSummary = {
        averageExecutionMs:
          completedRunResponse.benchmark.summary.averageExecutionMs,
        averageRunnerMs: completedRunResponse.benchmark.summary.averageRunnerMs,
        averageTotalMs: completedRunResponse.benchmark.summary.averageTotalMs,
        maxTotalMs: completedRunResponse.benchmark.summary.maxTotalMs,
        measuredRuns: completedRunResponse.benchmark.measuredRuns,
        minTotalMs: completedRunResponse.benchmark.summary.minTotalMs,
        recordedAt: new Date().toISOString(),
        warmupRuns: completedRunResponse.benchmark.warmupRuns,
      };

      recordScenarioBenchmark(matchingScenario.id, benchmarkSummary);
    },
    runnerMode: activeRunnerMode,
  });
  const {
    copyRunOutput,
    isOutputModalOpen,
    outputCopyFeedback,
    setIsOutputModalOpen,
  } = useRunOutputState(runResponse);

  function loadSelectedTemplate() {
    if (!activeTemplate) {
      return;
    }

    setCurrentInputJson(formatTemplateInput(activeTemplate.input));
    setRunRequestError("");
  }

  function formatCurrentInputJson() {
    if (jsonValidationError) {
      return;
    }

    try {
      setCurrentInputJson(formatJsonString(currentInputJson));
    } catch {
      return;
    }
  }

  function saveCurrentScenario() {
    const trimmedScenarioName = currentScenarioName.trim();

    if (!trimmedScenarioName) {
      setRunRequestError("Scenario name is required.");
      return;
    }

    const matchingScenario = visibleSavedScenarios.find(
      (savedScenario) =>
        savedScenario.name.toLowerCase() === trimmedScenarioName.toLowerCase(),
    );

    if (
      matchingScenario &&
      !window.confirm(`Overwrite scenario "${matchingScenario.name}"?`)
    ) {
      return;
    }

    const savedScenario: SavedScenario = {
      id: crypto.randomUUID(),
      benchmarkIterations: currentBenchmarkIterations,
      benchmarkWarmup: currentBenchmarkWarmup,
      name: trimmedScenarioName,
      createdAt: new Date().toISOString(),
      exportName: currentExportName,
      functionDir: currentFunctionDir,
      functionType: currentFunctionType,
      inputJson: currentInputJson,
      lastUsedAt: null,
      runnerMode: activeRunnerMode,
      target: currentTarget,
      updatedAt: new Date().toISOString(),
    };

    upsertSavedScenario(savedScenario);
    setCurrentScenarioName("");
    setRunRequestError("");
  }

  function loadSavedScenario(savedScenario: SavedScenario) {
    applySavedScenario(savedScenario);
    markScenarioUsed(savedScenario.id);
    setRunRequestError("");
  }

  function deleteCurrentScenario(savedScenarioId: string) {
    if (!window.confirm("Delete this saved scenario?")) {
      return;
    }

    removeSavedScenario(savedScenarioId);
  }

  function renameSavedScenarioPrompt(savedScenario: SavedScenario) {
    const nextName = window.prompt("Rename saved scenario", savedScenario.name);

    if (!nextName || nextName.trim() === savedScenario.name) {
      return;
    }

    renameStoredScenario(savedScenario.id, nextName);
  }

  async function importScenarioFile(importFile: File | null) {
    if (!importFile) {
      return;
    }

    try {
      await importSavedScenariosFile(importFile);
      setRunRequestError("");
    } catch {
      setRunRequestError("Scenario import failed.");
    }
  }

  return {
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
    deleteSavedScenario: deleteCurrentScenario,
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
  };
}
