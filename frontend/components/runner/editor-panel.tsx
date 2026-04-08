import type { RunnerMode } from "@/lib/saved-fixtures";
import { JsonEditor } from "../json-editor";
import {
  InlineNote,
  PanelHeader,
  StateBadge,
  SurfacePanel,
} from "./runner-ui-primitives";

export function EditorPanel({
  className,
  inputJson,
  jsonValidationError,
  onInputChange,
  runnerMode,
}: {
  className?: string;
  inputJson: string;
  jsonValidationError: string;
  onInputChange: (value: string) => void;
  runnerMode: RunnerMode;
}) {
  return (
    <SurfacePanel className={className}>
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
              ? "Edit the payload for mock runs or a Wasm override."
              : "Edit the payload for the Shopify runner."}
          </div>
          <InlineNote>
            {runnerMode === "mock"
              ? "Use mock mode for quick checks."
              : "Use Shopify mode for real local validation."}
          </InlineNote>
        </div>
      </PanelHeader>
      <div className="min-h-0 flex-1">
        <JsonEditor onChange={onInputChange} value={inputJson} />
      </div>
    </SurfacePanel>
  );
}
