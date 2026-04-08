"use client";

import { useState } from "react";
import type { RunResponse } from "../runner-workspace.types";
import { RunDetailsDrawer } from "./run-details-drawer";
import { RunResultsPanel } from "./results-panel";

export function RunInspector({
  copyFeedback,
  onCopyOutput,
  onExpandOutput,
  runRequestError,
  runResponse,
}: {
  copyFeedback: string;
  onCopyOutput: () => void;
  onExpandOutput: () => void;
  runRequestError: string;
  runResponse: RunResponse | null;
}) {
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  return (
    <>
      <RunResultsPanel
        copyFeedback={copyFeedback}
        onCopyOutput={onCopyOutput}
        onExpandOutput={onExpandOutput}
        onOpenDetails={() => setIsDetailsDrawerOpen(true)}
        runRequestError={runRequestError}
        runResponse={runResponse}
      />

      {isDetailsDrawerOpen ? (
        <RunDetailsDrawer
          onClose={() => setIsDetailsDrawerOpen(false)}
          runRequestError={runRequestError}
          runResponse={runResponse}
        />
      ) : null}
    </>
  );
}
