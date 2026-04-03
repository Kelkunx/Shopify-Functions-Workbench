"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-105 items-center justify-center bg-stone-950 text-sm text-stone-400">
      Loading editor...
    </div>
  ),
});

interface JsonEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const [editorValue, setEditorValue] = useState(value);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  useEffect(() => {
    const syncTimeout = window.setTimeout(() => {
      if (editorValue !== value) {
        onChange(editorValue);
      }
    }, 120);

    return () => window.clearTimeout(syncTimeout);
  }, [editorValue, onChange, value]);

  return (
    <MonacoEditor
      defaultLanguage="json"
      height="100%"
      loading={
        <div className="flex h-full min-h-105 items-center justify-center bg-stone-950 text-sm text-stone-400">
          Loading editor...
        </div>
      }
      theme="vs-dark"
      value={editorValue}
      onChange={(nextValue) => setEditorValue(nextValue ?? "")}
      options={{
        automaticLayout: true,
        bracketPairColorization: { enabled: false },
        codeLens: false,
        fontFamily: "var(--font-ibm-plex-mono)",
        fontLigatures: false,
        fontSize: 13,
        formatOnPaste: true,
        glyphMargin: false,
        occurrencesHighlight: "off",
        overviewRulerBorder: false,
        overviewRulerLanes: 0,
        quickSuggestions: false,
        renderValidationDecorations: "on",
        selectionHighlight: false,
        minimap: { enabled: false },
        padding: { top: 16 },
        scrollBeyondLastLine: false,
        stickyScroll: { enabled: false },
        tabSize: 2,
        wordBasedSuggestions: "off",
      }}
    />
  );
}
