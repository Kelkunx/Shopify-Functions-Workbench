"use client";

import { useMemo, useState } from "react";
import {
  loadSavedFixtures,
  parseImportedSavedFixtures,
  persistSavedFixtures,
  serializeSavedFixturesExport,
  type RunnerMode,
  type SavedFixture,
} from "@/lib/saved-fixtures";

export function useSavedFixturesStore(activeRunnerMode: RunnerMode) {
  const [allSavedFixtures, setAllSavedFixtures] = useState<SavedFixture[]>(
    () => loadSavedFixtures(),
  );
  const [fixturesTransferFeedback, setFixturesTransferFeedback] = useState("");

  const visibleSavedFixtures = useMemo(
    () =>
      allSavedFixtures.filter(
        (savedFixture) => savedFixture.runnerMode === activeRunnerMode,
      ),
    [activeRunnerMode, allSavedFixtures],
  );

  function upsertSavedFixture(savedFixture: SavedFixture) {
    setAllSavedFixtures((currentSavedFixtures) => {
      const existingFixtureIndex = currentSavedFixtures.findIndex(
        (currentSavedFixture) =>
          currentSavedFixture.runnerMode === savedFixture.runnerMode &&
          currentSavedFixture.name.toLowerCase() === savedFixture.name.toLowerCase(),
      );

      const nextSavedFixtures =
        existingFixtureIndex >= 0
          ? currentSavedFixtures.map((currentSavedFixture, fixtureIndex) =>
              fixtureIndex === existingFixtureIndex
                ? {
                    ...currentSavedFixture,
                    ...savedFixture,
                    id: currentSavedFixture.id,
                    updatedAt: new Date().toISOString(),
                  }
                : currentSavedFixture,
            )
          : [{ ...savedFixture, updatedAt: new Date().toISOString() }, ...currentSavedFixtures];

      persistSavedFixtures(nextSavedFixtures);

      return nextSavedFixtures;
    });

    setFixturesTransferFeedback("");
  }

  function renameSavedFixture(savedFixtureId: string, nextName: string) {
    const trimmedName = nextName.trim();

    if (!trimmedName) {
      setFixturesTransferFeedback("Scenario name cannot be empty.");
      return;
    }

    setAllSavedFixtures((currentSavedFixtures) => {
      const nextSavedFixtures = currentSavedFixtures.map((savedFixture) =>
        savedFixture.id === savedFixtureId
          ? {
              ...savedFixture,
              name: trimmedName,
              updatedAt: new Date().toISOString(),
            }
          : savedFixture,
      );

      persistSavedFixtures(nextSavedFixtures);

      return nextSavedFixtures;
    });

    setFixturesTransferFeedback("Scenario renamed.");
  }

  function markFixtureUsed(savedFixtureId: string) {
    setAllSavedFixtures((currentSavedFixtures) => {
      const nextSavedFixtures = currentSavedFixtures.map((savedFixture) =>
        savedFixture.id === savedFixtureId
          ? {
              ...savedFixture,
              lastUsedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : savedFixture,
      );

      persistSavedFixtures(nextSavedFixtures);

      return nextSavedFixtures;
    });
  }

  function deleteSavedFixture(savedFixtureId: string) {
    setAllSavedFixtures((currentSavedFixtures) => {
      const nextSavedFixtures = currentSavedFixtures.filter(
        (savedFixture) => savedFixture.id !== savedFixtureId,
      );

      persistSavedFixtures(nextSavedFixtures);

      return nextSavedFixtures;
    });

    setFixturesTransferFeedback("");
  }

  async function importSavedFixturesFile(importFile: File) {
    const importedText = await importFile.text();
    const importedFixtures = parseImportedSavedFixtures(importedText);

    if (importedFixtures.length === 0) {
      setFixturesTransferFeedback("No valid fixtures were found in that file.");
      return;
    }

    const normalizedImportedFixtures = importedFixtures.map((savedFixture) => ({
      ...savedFixture,
      id: crypto.randomUUID(),
    }));

    setAllSavedFixtures((currentSavedFixtures) => {
      const nextSavedFixtures = [
        ...normalizedImportedFixtures,
        ...currentSavedFixtures,
      ];

      persistSavedFixtures(nextSavedFixtures);

      return nextSavedFixtures;
    });

    setFixturesTransferFeedback(
      `${normalizedImportedFixtures.length} fixture${
        normalizedImportedFixtures.length > 1 ? "s" : ""
      } imported.`,
    );
  }

  function exportVisibleFixtures() {
    if (visibleSavedFixtures.length === 0) {
      setFixturesTransferFeedback("No fixtures to export for the current mode.");
      return;
    }

    const exportContent = serializeSavedFixturesExport(visibleSavedFixtures);
    const exportBlob = new Blob([exportContent], {
      type: "application/json;charset=utf-8",
    });
    const exportUrl = window.URL.createObjectURL(exportBlob);
    const downloadLink = window.document.createElement("a");

    downloadLink.href = exportUrl;
    downloadLink.download = `shopify-functions-workbench-${activeRunnerMode}-fixtures.json`;
    downloadLink.click();
    window.URL.revokeObjectURL(exportUrl);

    setFixturesTransferFeedback(
      `${visibleSavedFixtures.length} fixture${
        visibleSavedFixtures.length > 1 ? "s" : ""
      } exported.`,
    );
  }

  return {
    deleteSavedFixture,
    exportVisibleFixtures,
    fixturesTransferFeedback,
    importSavedFixturesFile,
    markFixtureUsed,
    renameSavedFixture,
    upsertSavedFixture,
    visibleSavedFixtures,
  };
}
