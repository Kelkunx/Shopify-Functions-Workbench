"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatTemplateInput,
  getTemplatesForType,
  type FunctionType,
} from "@/lib/function-templates";
import {
  loadSavedFixtures,
  persistSavedFixtures,
  type SavedFixture,
  type RunnerMode,
} from "@/lib/saved-fixtures";
import type { RunResponse } from "./runner-workspace.types";
import {
  formatJsonString,
  formatOutputJson,
  getJsonValidationError,
  initialFunctionInputJson,
  initialFunctionTemplate,
  initialRunnerFunctionType,
  runnerApiBaseUrl,
} from "./runner-workspace.helpers";

export function useRunnerWorkspaceController() {
  const [activeRunnerMode, setActiveRunnerMode] = useState<RunnerMode>("mock");
  const [currentFunctionType, setCurrentFunctionType] =
    useState<FunctionType>(initialRunnerFunctionType);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialFunctionTemplate.id,
  );
  const [currentInputJson, setCurrentInputJson] = useState(
    initialFunctionInputJson,
  );
  const [currentWasmFile, setCurrentWasmFile] = useState<File | null>(null);
  const [currentFunctionDir, setCurrentFunctionDir] = useState("");
  const [currentTarget, setCurrentTarget] = useState("");
  const [currentExportName, setCurrentExportName] = useState("run");
  const [currentFixtureName, setCurrentFixtureName] = useState("");
  const [allSavedFixtures, setAllSavedFixtures] = useState<SavedFixture[]>([]);
  const [runResponse, setRunResponse] = useState<RunResponse | null>(null);
  const [runRequestError, setRunRequestError] = useState("");
  const [outputCopyFeedback, setOutputCopyFeedback] = useState("");
  const [isRunInFlight, setIsRunInFlight] = useState(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);

  const availableTemplates = useMemo(
    () => getTemplatesForType(currentFunctionType),
    [currentFunctionType],
  );
  const visibleSavedFixtures = useMemo(
    () =>
      allSavedFixtures.filter(
        (savedFixture) => savedFixture.runnerMode === activeRunnerMode,
      ),
    [activeRunnerMode, allSavedFixtures],
  );
  const jsonValidationError = useMemo(
    () => getJsonValidationError(currentInputJson),
    [currentInputJson],
  );
  const activeTemplate = useMemo(
    () =>
      availableTemplates.find((template) => template.id === selectedTemplateId) ??
      null,
    [selectedTemplateId, availableTemplates],
  );

  useEffect(() => {
    setAllSavedFixtures(loadSavedFixtures());
  }, []);

  useEffect(() => {
    if (
      availableTemplates.some((template) => template.id === selectedTemplateId)
    ) {
      return;
    }

    setSelectedTemplateId(availableTemplates[0]?.id ?? "");
  }, [selectedTemplateId, availableTemplates]);

  async function runFunction() {
    setIsRunInFlight(true);
    setRunRequestError("");

    if (jsonValidationError) {
      setIsRunInFlight(false);
      setRunResponse(null);
      setRunRequestError(`Input JSON is invalid: ${jsonValidationError}`);
      return;
    }

    const formData = new FormData();
    formData.append("inputJson", currentInputJson);
    formData.append("functionType", currentFunctionType);

    if (currentWasmFile) {
      formData.append("wasm", currentWasmFile);
    }

    if (activeRunnerMode === "shopify") {
      if (currentFunctionDir.trim()) {
        formData.append("functionDir", currentFunctionDir.trim());
      }

      if (currentTarget.trim()) {
        formData.append("target", currentTarget.trim());
      }

      if (currentExportName.trim()) {
        formData.append("exportName", currentExportName.trim());
      }
    }

    try {
      const runHttpResponse = await fetch(`${runnerApiBaseUrl}/run`, {
        body: formData,
        method: "POST",
      });
      const runPayload = (await runHttpResponse.json()) as RunResponse;

      if (!runHttpResponse.ok) {
        throw new Error(
          runPayload.errors?.join(" ") || "Runner request failed.",
        );
      }

      setRunResponse(runPayload);
    } catch (error) {
      setRunResponse(null);
      setRunRequestError(
        error instanceof Error ? error.message : "Unable to reach the backend.",
      );
    } finally {
      setIsRunInFlight(false);
    }
  }

  function updateRunnerMode(nextRunnerMode: RunnerMode) {
    setActiveRunnerMode(nextRunnerMode);
    setCurrentFixtureName("");
  }

  function updateFunctionType(nextFunctionType: FunctionType) {
    setCurrentFunctionType(nextFunctionType);
    const nextAvailableTemplates = getTemplatesForType(nextFunctionType);

    if (nextAvailableTemplates[0]) {
      setSelectedTemplateId(nextAvailableTemplates[0].id);
    }
  }

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
      name: trimmedFixtureName,
      createdAt: new Date().toISOString(),
      exportName: currentExportName,
      functionDir: currentFunctionDir,
      functionType: currentFunctionType,
      inputJson: currentInputJson,
      runnerMode: activeRunnerMode,
      target: currentTarget,
    };
    const nextSavedFixtures = [savedFixture, ...allSavedFixtures];

    setAllSavedFixtures(nextSavedFixtures);
    persistSavedFixtures(nextSavedFixtures);
    setCurrentFixtureName("");
    setRunRequestError("");
  }

  function loadSavedFixture(savedFixture: SavedFixture) {
    setActiveRunnerMode(savedFixture.runnerMode);
    setCurrentFunctionType(savedFixture.functionType);
    setSelectedTemplateId(
      getTemplatesForType(savedFixture.functionType)[0]?.id ?? "",
    );
    setCurrentInputJson(savedFixture.inputJson);
    setCurrentFunctionDir(savedFixture.functionDir);
    setCurrentTarget(savedFixture.target);
    setCurrentExportName(savedFixture.exportName);
    setCurrentFixtureName(savedFixture.name);
    setRunRequestError("");
  }

  function deleteSavedFixture(savedFixtureId: string) {
    const nextSavedFixtures = allSavedFixtures.filter(
      (savedFixture) => savedFixture.id !== savedFixtureId,
    );

    setAllSavedFixtures(nextSavedFixtures);
    persistSavedFixtures(nextSavedFixtures);
  }

  async function copyRunOutput() {
    if (!runResponse) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatOutputJson(runResponse.output));
      setOutputCopyFeedback("Copied");
      window.setTimeout(() => setOutputCopyFeedback(""), 1400);
    } catch {
      setOutputCopyFeedback("Copy failed");
      window.setTimeout(() => setOutputCopyFeedback(""), 1800);
    }
  }

  return {
    activeRunnerMode,
    availableTemplates,
    copyRunOutput,
    currentExportName,
    currentFixtureName,
    currentFunctionDir,
    currentFunctionType,
    currentInputJson,
    currentTarget,
    currentWasmFile,
    deleteSavedFixture,
    formatCurrentInputJson,
    isOutputModalOpen,
    isRunInFlight,
    jsonValidationError,
    loadSavedFixture,
    loadSelectedTemplate,
    outputCopyFeedback,
    runFunction,
    runRequestError,
    runResponse,
    saveCurrentFixture,
    selectedTemplateId,
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
