"use client";

import { useMemo, useState } from "react";
import { getTemplatesForType, type FunctionType } from "@/lib/function-templates";
import { type SavedFixture, type RunnerMode } from "@/lib/saved-fixtures";
import {
  getJsonValidationError,
  initialFunctionInputJson,
  initialFunctionTemplate,
  initialRunnerFunctionType,
} from "@/components/runner-workspace.helpers";

export function useRunnerFormState() {
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

  const availableTemplates = useMemo(
    () => getTemplatesForType(currentFunctionType),
    [currentFunctionType],
  );
  const activeTemplate = useMemo(
    () =>
      availableTemplates.find((template) => template.id === selectedTemplateId) ??
      null,
    [availableTemplates, selectedTemplateId],
  );
  const jsonValidationError = useMemo(
    () => getJsonValidationError(currentInputJson),
    [currentInputJson],
  );

  function updateRunnerMode(nextRunnerMode: RunnerMode) {
    setActiveRunnerMode(nextRunnerMode);
    setCurrentFixtureName("");
  }

  function updateFunctionType(nextFunctionType: FunctionType) {
    setCurrentFunctionType(nextFunctionType);
    const nextAvailableTemplates = getTemplatesForType(nextFunctionType);
    setSelectedTemplateId(nextAvailableTemplates[0]?.id ?? "");
  }

  function applySavedFixture(savedFixture: SavedFixture) {
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
    setCurrentWasmFile(null);
  }

  return {
    activeRunnerMode,
    activeTemplate,
    availableTemplates,
    currentExportName,
    currentFixtureName,
    currentFunctionDir,
    currentFunctionType,
    currentInputJson,
    currentTarget,
    currentWasmFile,
    jsonValidationError,
    selectedTemplateId,
    setCurrentExportName,
    setCurrentFixtureName,
    setCurrentFunctionDir,
    setCurrentInputJson,
    setCurrentTarget,
    setCurrentWasmFile,
    setSelectedTemplateId,
    applySavedFixture,
    updateFunctionType,
    updateRunnerMode,
  };
}
