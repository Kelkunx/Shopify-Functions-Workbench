import { formatOutputJson } from "../runner-workspace.helpers";
import {
  CodeBlock,
  SmallActionButton,
} from "./runner-ui-primitives";

export function ExpandedOutputModal({
  onClose,
  onCopyOutput,
  output,
}: {
  onClose: () => void;
  onCopyOutput: () => void;
  output: Record<string, unknown>;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-6"
      role="dialog"
    >
      <div className="flex h-[min(88vh,920px)] w-full max-w-400 flex-col rounded-lg border border-border-strong bg-surface-strong">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Expanded output</h2>
            <div className="mt-1 text-sm text-muted">
              Use this view when the result JSON no longer fits in the side inspector.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SmallActionButton onClick={onCopyOutput} type="button">
              Copy
            </SmallActionButton>
            <SmallActionButton onClick={onClose} type="button">
              Close
            </SmallActionButton>
          </div>
        </div>
        <div className="min-h-0 flex-1 p-4">
          <CodeBlock expanded>{formatOutputJson(output)}</CodeBlock>
        </div>
      </div>
    </div>
  );
}
