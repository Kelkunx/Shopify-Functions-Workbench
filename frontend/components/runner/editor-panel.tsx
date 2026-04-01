import type { RunnerMode } from "@/lib/saved-fixtures";
import { JsonEditor } from "../json-editor";
import {
  PanelHeader,
  StateBadge,
  SurfacePanel,
} from "./runner-ui-primitives";

export function EditorPanel({
  inputJson,
  jsonValidationError,
  onInputChange,
  runnerMode,
}: {
  inputJson: string;
  jsonValidationError: string;
  onInputChange: (value: string) => void;
  runnerMode: RunnerMode;
}) {
  return (
    <SurfacePanel>
      <PanelHeader
        actions={
          <>
            <StateBadge tone={jsonValidationError ? "danger" : "neutral"}>
              {jsonValidationError ? "JSON invalid" : "JSON valid"}
            </StateBadge>
            <StateBadge tone="neutral">
              {runnerMode === "mock" ? "Mode: mock" : "Mode: Shopify"}
            </StateBadge>
          </>
        }
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Input JSON</h2>
          <div className="mt-1 text-sm text-muted">
            {runnerMode === "mock"
              ? "Send a payload to the mock runner or an uploaded .wasm."
              : "Edit the payload passed to the local Shopify function runner."}
          </div>
        </div>
      </PanelHeader>
      <div className="h-[calc(100vh-210px)] min-h-155">
        <JsonEditor onChange={onInputChange} value={inputJson} />
      </div>
    </SurfacePanel>
  );
}
