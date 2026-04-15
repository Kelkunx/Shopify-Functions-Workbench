"use client";

import { useState } from "react";
import type { FunctionType } from "@/lib/function-templates";
import type { RunnerMode } from "@/lib/saved-scenarios";
import type { RunResponse } from "../../runner-workspace.types";
import { runnerApiBaseUrl } from "../../runner-workspace.helpers";

interface UseRunnerExecutionParams {
  currentBenchmarkIterations: number;
  currentBenchmarkWarmup: number;
  currentExportName: string;
  currentFunctionDir: string;
  currentFunctionType: FunctionType;
  currentInputJson: string;
  currentTarget: string;
  currentWasmFile: File | null;
  jsonValidationError: string;
  runnerMode: RunnerMode;
}

export function useRunnerExecution({
  currentBenchmarkIterations,
  currentBenchmarkWarmup,
  currentExportName,
  currentFunctionDir,
  currentFunctionType,
  currentInputJson,
  currentTarget,
  currentWasmFile,
  jsonValidationError,
  runnerMode,
}: UseRunnerExecutionParams) {
  const [isRunInFlight, setIsRunInFlight] = useState(false);
  const [activeExecutionKind, setActiveExecutionKind] = useState<
    "benchmark" | "single" | null
  >(null);
  const [runRequestError, setRunRequestError] = useState("");
  const [runResponse, setRunResponse] = useState<RunResponse | null>(null);

  async function executeRunner(executionKind: "benchmark" | "single") {
    setIsRunInFlight(true);
    setActiveExecutionKind(executionKind);
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

    if (executionKind === "benchmark") {
      formData.append("benchmarkIterations", String(currentBenchmarkIterations));
      formData.append("benchmarkWarmup", String(currentBenchmarkWarmup));
    }

    if (currentWasmFile) {
      formData.append("wasm", currentWasmFile);
    }

    if (runnerMode === "shopify") {
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
      setActiveExecutionKind(null);
      setIsRunInFlight(false);
    }
  }

  async function runFunction() {
    await executeRunner("single");
  }

  async function runBenchmark() {
    await executeRunner("benchmark");
  }

  return {
    activeExecutionKind,
    isRunInFlight,
    runBenchmark,
    runFunction,
    runRequestError,
    runResponse,
    setRunRequestError,
  };
}
