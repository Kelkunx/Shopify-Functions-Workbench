import type { RunnerMode } from "@/lib/saved-fixtures";
import { JsonEditor } from "../json-editor";
import {
  InlineNote,
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
          <StateBadge tone={jsonValidationError ? "danger" : "neutral"}>
            {jsonValidationError ? "JSON invalid" : "JSON valid"}
          </StateBadge>
        }
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Input JSON</h2>
          <div className="mt-1 text-sm text-muted">
            {runnerMode === "mock"
              ? "Edit the payload used for mock runs or a local Wasm override."
              : "Edit the payload passed to the local Shopify runner."}
          </div>
          <InlineNote>
            {runnerMode === "mock"
              ? "Mock mode is useful for quick payload checks before a real Shopify run."
              : "Shopify mode is the primary path for real local validation."}
          </InlineNote>
        </div>
      </PanelHeader>
      <div className="min-h-0 flex-1">
        <JsonEditor onChange={onInputChange} value={inputJson} />
      </div>
    </SurfacePanel>
  );
}
