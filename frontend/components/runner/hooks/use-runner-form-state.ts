"use client";

import { useMemo, useState } from "react";
import { getTemplatesForType, type FunctionType } from "@/lib/function-templates";
import { type RunnerMode, type SavedScenario } from "@/lib/saved-scenarios";
import {
  getJsonValidationError,
  initialFunctionInputJson,
  initialFunctionTemplate,
  initialRunnerFunctionType,
} from "@/components/runner-workspace.helpers";

export function useRunnerFormState() {
  const [activeRunnerMode, setActiveRunnerMode] = useState<RunnerMode>("shopify");
  const [currentBenchmarkIterations, setCurrentBenchmarkIterations] = useState(5);
  const [currentBenchmarkWarmup, setCurrentBenchmarkWarmup] = useState(1);
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
  const [currentScenarioName, setCurrentScenarioName] = useState("");

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
    setCurrentScenarioName("");
  }

  function updateFunctionType(nextFunctionType: FunctionType) {
    setCurrentFunctionType(nextFunctionType);
    const nextAvailableTemplates = getTemplatesForType(nextFunctionType);
    setSelectedTemplateId(nextAvailableTemplates[0]?.id ?? "");
  }

  function applySavedScenario(savedScenario: SavedScenario) {
    setActiveRunnerMode(savedScenario.runnerMode);
    setCurrentBenchmarkIterations(savedScenario.benchmarkIterations);
    setCurrentBenchmarkWarmup(savedScenario.benchmarkWarmup);
    setCurrentFunctionType(savedScenario.functionType);
    setSelectedTemplateId(
      getTemplatesForType(savedScenario.functionType)[0]?.id ?? "",
    );
    setCurrentInputJson(savedScenario.inputJson);
    setCurrentFunctionDir(savedScenario.functionDir);
    setCurrentTarget(savedScenario.target);
    setCurrentExportName(savedScenario.exportName);
    setCurrentScenarioName(savedScenario.name);
    setCurrentWasmFile(null);
  }

  return {
    activeRunnerMode,
    activeTemplate,
    availableTemplates,
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
    applySavedScenario,
    updateFunctionType,
    updateRunnerMode,
  };
}
