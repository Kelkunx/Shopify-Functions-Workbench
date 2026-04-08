"use client";

import { formatTemplateInput } from "@/lib/function-templates";
import { type SavedFixture } from "@/lib/saved-fixtures";
import { formatJsonString } from "./runner-workspace.helpers";
import { useRunOutputState } from "./runner/hooks/use-run-output-state";
import { useRunnerExecution } from "./runner/hooks/use-runner-execution";
import { useRunnerFormState } from "./runner/hooks/use-runner-form-state";
import { useSavedFixturesStore } from "./runner/hooks/use-saved-fixtures-store";

export function useRunnerWorkspaceController() {
  const {
    activeRunnerMode,
    activeTemplate,
    availableTemplates,
    applySavedFixture,
    currentBenchmarkIterations,
    currentBenchmarkWarmup,
    currentExportName,
    currentFixtureName,
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
    setCurrentFixtureName,
    setCurrentFunctionDir,
    setCurrentInputJson,
    setCurrentTarget,
    setCurrentWasmFile,
    setSelectedTemplateId,
    updateFunctionType,
    updateRunnerMode,
  } = useRunnerFormState();

  const {
    deleteSavedFixture: removeSavedFixture,
    exportVisibleFixtures,
    fixturesTransferFeedback,
    importSavedFixturesFile,
    markFixtureUsed,
    renameSavedFixture,
    upsertSavedFixture,
    visibleSavedFixtures,
  } = useSavedFixturesStore(activeRunnerMode);
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

  function saveCurrentFixture() {
    const trimmedFixtureName = currentFixtureName.trim();

    if (!trimmedFixtureName) {
      setRunRequestError("Fixture name is required.");
      return;
    }

    const savedFixture: SavedFixture = {
      id: crypto.randomUUID(),
      benchmarkIterations: currentBenchmarkIterations,
      benchmarkWarmup: currentBenchmarkWarmup,
      name: trimmedFixtureName,
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

    upsertSavedFixture(savedFixture);
    setCurrentFixtureName("");
    setRunRequestError("");
  }

  function loadSavedFixture(savedFixture: SavedFixture) {
    applySavedFixture(savedFixture);
    markFixtureUsed(savedFixture.id);
    setRunRequestError("");
  }

  function deleteSavedFixture(savedFixtureId: string) {
    if (!window.confirm("Delete this saved scenario?")) {
      return;
    }

    removeSavedFixture(savedFixtureId);
  }

  function renameScenario(savedFixture: SavedFixture) {
    const nextName = window.prompt("Rename saved scenario", savedFixture.name);

    if (!nextName || nextName.trim() === savedFixture.name) {
      return;
    }

    renameSavedFixture(savedFixture.id, nextName);
  }

  async function importFixtureFile(importFile: File | null) {
    if (!importFile) {
      return;
    }

    try {
      await importSavedFixturesFile(importFile);
      setRunRequestError("");
    } catch {
      setRunRequestError("Fixture import failed.");
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
  };
}
