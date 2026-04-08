export const runnerUiClassNames = {
  cardButton:
    "rounded-md border border-border bg-white px-2 py-1 text-xs font-medium transition-colors",
  codeBlock:
    "mt-3 max-h-180 overflow-auto rounded-md border border-stone-800 bg-stone-950 px-3 py-3 font-mono text-[13px] leading-5 text-stone-100",
  dangerBox:
    "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger",
  emptyState:
    "rounded-md border border-dashed border-border bg-surface px-3 py-3 text-sm text-muted",
  fieldHelper: "mt-1.5 text-xs leading-5 text-muted",
  fieldLabel: "mb-1.5 text-sm font-medium text-foreground",
  iconActionButton:
    "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted transition-colors hover:border-border-strong hover:bg-stone-100 hover:text-foreground disabled:opacity-50",
  primaryButton:
    "rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-amber-300",
  resultsActionButton:
    "rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-border-strong hover:bg-stone-100 disabled:opacity-50",
  sectionPanel:
    "flex h-full min-h-0 w-full flex-1 flex-col border border-border bg-surface-strong",
  sectionPanelHeader:
    "flex items-start justify-between gap-4 border-b border-border px-5 py-4",
  sectionPanelWrapper:
    "flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto border border-border bg-surface-strong",
  focusedPanel:
    "border-border-strong",
  sectionWrapper: "border-b border-border px-5 py-5 last:border-b-0",
  secondaryButton:
    "rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60",
  sectionToggleButton:
    "inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-border-strong hover:bg-stone-100",
  selectInput:
    "h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-border-strong",
  textInput:
    "h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition-colors focus:border-border-strong",
  toggleButton:
    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
} as const;
