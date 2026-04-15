"use client";

import { useMemo, useState } from "react";
import {
  loadSavedScenarios,
  parseImportedSavedScenarios,
  persistSavedScenarios,
  serializeSavedScenariosExport,
  type RunnerMode,
  type SavedScenario,
  type ScenarioBenchmarkSummary,
} from "@/lib/saved-scenarios";

export function useSavedScenariosStore(activeRunnerMode: RunnerMode) {
  const [allSavedScenarios, setAllSavedScenarios] = useState<SavedScenario[]>(
    () => loadSavedScenarios(),
  );
  const [scenariosTransferFeedback, setScenariosTransferFeedback] = useState("");

  const visibleSavedScenarios = useMemo(
    () =>
      allSavedScenarios.filter(
        (savedScenario) => savedScenario.runnerMode === activeRunnerMode,
      ),
    [activeRunnerMode, allSavedScenarios],
  );

  function upsertSavedScenario(savedScenario: SavedScenario) {
    setAllSavedScenarios((currentSavedScenarios) => {
      const existingScenarioIndex = currentSavedScenarios.findIndex(
        (currentSavedScenario) =>
          currentSavedScenario.runnerMode === savedScenario.runnerMode &&
          currentSavedScenario.name.toLowerCase() ===
            savedScenario.name.toLowerCase(),
      );

      const nextSavedScenarios =
        existingScenarioIndex >= 0
          ? currentSavedScenarios.map((currentSavedScenario, scenarioIndex) =>
              scenarioIndex === existingScenarioIndex
                ? {
                    ...currentSavedScenario,
                    ...savedScenario,
                    id: currentSavedScenario.id,
                    updatedAt: new Date().toISOString(),
                  }
                : currentSavedScenario,
            )
          : [
              { ...savedScenario, updatedAt: new Date().toISOString() },
              ...currentSavedScenarios,
            ];

      persistSavedScenarios(nextSavedScenarios);

      return nextSavedScenarios;
    });

    setScenariosTransferFeedback("");
  }

  function renameSavedScenario(savedScenarioId: string, nextName: string) {
    const trimmedName = nextName.trim();

    if (!trimmedName) {
      setScenariosTransferFeedback("Scenario name cannot be empty.");
      return;
    }

    let nameAlreadyUsed = false;

    setAllSavedScenarios((currentSavedScenarios) => {
      const renamedScenario = currentSavedScenarios.find(
        (savedScenario) => savedScenario.id === savedScenarioId,
      );
      nameAlreadyUsed = currentSavedScenarios.some(
        (savedScenario) =>
          savedScenario.id !== savedScenarioId &&
          savedScenario.runnerMode === renamedScenario?.runnerMode &&
          savedScenario.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (nameAlreadyUsed) {
        return currentSavedScenarios;
      }

      const nextSavedScenarios = currentSavedScenarios.map((savedScenario) =>
        savedScenario.id === savedScenarioId
          ? {
              ...savedScenario,
              name: trimmedName,
              updatedAt: new Date().toISOString(),
            }
          : savedScenario,
      );

      persistSavedScenarios(nextSavedScenarios);

      return nextSavedScenarios;
    });

    setScenariosTransferFeedback(
      nameAlreadyUsed
        ? "Scenario name already exists for this mode."
        : "Scenario renamed.",
    );
  }

  function recordScenarioBenchmark(
    savedScenarioId: string,
    benchmarkSummary: ScenarioBenchmarkSummary,
  ) {
    setAllSavedScenarios((currentSavedScenarios) => {
      const nextSavedScenarios = currentSavedScenarios.map((savedScenario) =>
        savedScenario.id === savedScenarioId
          ? {
              ...savedScenario,
              recentBenchmarks: [
                benchmarkSummary,
                ...(savedScenario.recentBenchmarks ?? []).filter(
                  (savedBenchmark) =>
                    savedBenchmark.recordedAt !== benchmarkSummary.recordedAt,
                ),
              ].slice(0, 3),
              updatedAt: new Date().toISOString(),
            }
          : savedScenario,
      );

      persistSavedScenarios(nextSavedScenarios);

      return nextSavedScenarios;
    });
  }

  function markScenarioUsed(savedScenarioId: string) {
    setAllSavedScenarios((currentSavedScenarios) => {
      const nextSavedScenarios = currentSavedScenarios.map((savedScenario) =>
        savedScenario.id === savedScenarioId
          ? {
              ...savedScenario,
              lastUsedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : savedScenario,
      );

      persistSavedScenarios(nextSavedScenarios);

      return nextSavedScenarios;
    });
  }

  function deleteSavedScenario(savedScenarioId: string) {
    setAllSavedScenarios((currentSavedScenarios) => {
      const nextSavedScenarios = currentSavedScenarios.filter(
        (savedScenario) => savedScenario.id !== savedScenarioId,
      );

      persistSavedScenarios(nextSavedScenarios);

      return nextSavedScenarios;
    });

    setScenariosTransferFeedback("");
  }

  async function importSavedScenariosFile(importFile: File) {
    const importedText = await importFile.text();
    const importedScenarios = parseImportedSavedScenarios(importedText);

    if (importedScenarios.length === 0) {
      setScenariosTransferFeedback("No valid scenarios were found in that file.");
      return;
    }

    const normalizedImportedScenarios = importedScenarios.map((savedScenario) => ({
      ...savedScenario,
      id: crypto.randomUUID(),
    }));

    setAllSavedScenarios((currentSavedScenarios) => {
      const nextSavedScenarios = [
        ...normalizedImportedScenarios,
        ...currentSavedScenarios,
      ];

      persistSavedScenarios(nextSavedScenarios);

      return nextSavedScenarios;
    });

    setScenariosTransferFeedback(
      `${normalizedImportedScenarios.length} scenario${
        normalizedImportedScenarios.length > 1 ? "s" : ""
      } imported.`,
    );
  }

  function exportVisibleScenarios() {
    if (visibleSavedScenarios.length === 0) {
      setScenariosTransferFeedback("No scenarios to export for the current mode.");
      return;
    }

    const exportContent = serializeSavedScenariosExport(visibleSavedScenarios);
    const exportBlob = new Blob([exportContent], {
      type: "application/json;charset=utf-8",
    });
    const exportUrl = window.URL.createObjectURL(exportBlob);
    const downloadLink = window.document.createElement("a");

    downloadLink.href = exportUrl;
    downloadLink.download = `shopify-functions-workbench-${activeRunnerMode}-scenarios.json`;
    downloadLink.click();
    window.URL.revokeObjectURL(exportUrl);

    setScenariosTransferFeedback(
      `${visibleSavedScenarios.length} scenario${
        visibleSavedScenarios.length > 1 ? "s" : ""
      } exported.`,
    );
  }

  return {
    deleteSavedScenario,
    exportVisibleScenarios,
    importSavedScenariosFile,
    markScenarioUsed,
    recordScenarioBenchmark,
    renameSavedScenario,
    scenariosTransferFeedback,
    upsertSavedScenario,
    visibleSavedScenarios,
  };
}
