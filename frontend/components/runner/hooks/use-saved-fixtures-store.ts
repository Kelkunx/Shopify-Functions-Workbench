"use client";

import { useMemo, useState } from "react";
import {
  loadSavedFixtures,
  parseImportedSavedFixtures,
  persistSavedFixtures,
  serializeSavedFixturesExport,
  type RunnerMode,
  type SavedScenario,
} from "@/lib/saved-fixtures";

export function useSavedFixturesStore(activeRunnerMode: RunnerMode) {
  const [allSavedScenarios, setAllSavedScenarios] = useState<SavedScenario[]>(
    () => loadSavedFixtures(),
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
          currentSavedScenario.name.toLowerCase() === savedScenario.name.toLowerCase(),
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
          : [{ ...savedScenario, updatedAt: new Date().toISOString() }, ...currentSavedScenarios];

      persistSavedFixtures(nextSavedScenarios);

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

    setAllSavedScenarios((currentSavedScenarios) => {
      const nextSavedScenarios = currentSavedScenarios.map((savedScenario) =>
        savedScenario.id === savedScenarioId
          ? {
              ...savedScenario,
              name: trimmedName,
              updatedAt: new Date().toISOString(),
            }
          : savedScenario,
      );

      persistSavedFixtures(nextSavedScenarios);

      return nextSavedScenarios;
    });

    setScenariosTransferFeedback("Scenario renamed.");
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

      persistSavedFixtures(nextSavedScenarios);

      return nextSavedScenarios;
    });
  }

  function deleteSavedScenario(savedScenarioId: string) {
    setAllSavedScenarios((currentSavedScenarios) => {
      const nextSavedScenarios = currentSavedScenarios.filter(
        (savedScenario) => savedScenario.id !== savedScenarioId,
      );

      persistSavedFixtures(nextSavedScenarios);

      return nextSavedScenarios;
    });

    setScenariosTransferFeedback("");
  }

  async function importSavedScenariosFile(importFile: File) {
    const importedText = await importFile.text();
    const importedScenarios = parseImportedSavedFixtures(importedText);

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

      persistSavedFixtures(nextSavedScenarios);

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

    const exportContent = serializeSavedFixturesExport(visibleSavedScenarios);
    const exportBlob = new Blob([exportContent], {
      type: "application/json;charset=utf-8",
    });
    const exportUrl = window.URL.createObjectURL(exportBlob);
    const downloadLink = window.document.createElement("a");

    downloadLink.href = exportUrl;
    downloadLink.download = `shopify-functions-workbench-${activeRunnerMode}-fixtures.json`;
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
    renameSavedScenario,
    scenariosTransferFeedback,
    upsertSavedScenario,
    visibleSavedScenarios,
  };
}
