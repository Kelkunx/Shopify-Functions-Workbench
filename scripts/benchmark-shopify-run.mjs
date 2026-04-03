#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    exportName: "run",
    iterations: 5,
    target: "",
    url: "http://localhost:3001/run",
    warmup: 1,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);

    switch (key) {
      case "url":
      case "function-dir":
      case "target":
      case "export-name":
      case "input-file":
      case "function-type":
        options[toCamelCase(key)] = next;
        index += 1;
        break;
      case "iterations":
      case "warmup":
        options[toCamelCase(key)] = Number.parseInt(next, 10);
        index += 1;
        break;
      case "help":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: --${key}`);
    }
  }

  return options;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function printUsage() {
  console.log(`Usage:
node scripts/benchmark-shopify-run.mjs \\
  --function-dir /abs/path/to/function \\
  --target cart.lines.discounts.generate.run \\
  --input-file /abs/path/to/input.json \\
  [--export-name run] \\
  [--iterations 5] \\
  [--warmup 1] \\
  [--url http://localhost:3001/run]

This script benchmarks the backend /run endpoint directly without the browser.
Start the backend first with: npm run dev:backend
`);
}

function assertRequiredOption(options, key) {
  if (!options[key]) {
    throw new Error(`Missing required option: --${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`);
  }
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatMs(value) {
  return `${value.toFixed(3)} ms`;
}

async function runBenchmark() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  assertRequiredOption(options, "functionDir");
  assertRequiredOption(options, "target");
  assertRequiredOption(options, "inputFile");

  if (!Number.isInteger(options.iterations) || options.iterations <= 0) {
    throw new Error("--iterations must be a positive integer");
  }

  if (!Number.isInteger(options.warmup) || options.warmup < 0) {
    throw new Error("--warmup must be a non-negative integer");
  }

  const inputFilePath = path.resolve(options.inputFile);
  const inputJson = await readFile(inputFilePath, "utf8");
  const totalRuns = options.warmup + options.iterations;
  const measuredRuns = [];

  for (let runIndex = 0; runIndex < totalRuns; runIndex += 1) {
    const formData = new FormData();
    formData.append("functionType", options.functionType ?? "custom");
    formData.append("functionDir", options.functionDir);
    formData.append("target", options.target);
    formData.append("exportName", options.exportName);
    formData.append("inputJson", inputJson);

    const requestStartedAt = performance.now();
    const response = await fetch(options.url, {
      body: formData,
      method: "POST",
    });
    const roundTripMs = performance.now() - requestStartedAt;
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      console.error(`Run ${runIndex + 1} failed`);
      console.error(JSON.stringify(payload, null, 2));
      process.exit(1);
    }

    const isWarmupRun = runIndex < options.warmup;
    const label = isWarmupRun ? `warmup ${runIndex + 1}` : `run ${runIndex + 1 - options.warmup}`;
    const shopifyPhases = payload.timings.shopifyPhases ?? {};

    console.log(
      [
        `${label}:`,
        `roundtrip=${formatMs(roundTripMs)}`,
        `total=${formatMs(payload.timings.totalMs)}`,
        `parse=${formatMs(payload.timings.parseMs)}`,
        `execute=${formatMs(payload.timings.executionMs)}`,
        `runner=${formatMs(shopifyPhases.functionRunnerMs ?? 0)}`,
        `functionInfo=${formatMs(shopifyPhases.functionInfoMs ?? 0)}`,
        `dirCheck=${formatMs(shopifyPhases.directoryCheckMs ?? 0)}`,
        `wasmPrep=${formatMs(shopifyPhases.wasmPreparationMs ?? 0)}`,
        `cleanup=${formatMs(shopifyPhases.cleanupMs ?? 0)}`,
      ].join(" | "),
    );

    if (!isWarmupRun) {
      measuredRuns.push({
        roundTripMs,
        timings: payload.timings,
      });
    }
  }

  console.log("\nAverages:");
  console.log(`roundtrip: ${formatMs(average(measuredRuns.map((run) => run.roundTripMs)))}`);
  console.log(`total: ${formatMs(average(measuredRuns.map((run) => run.timings.totalMs)))}`);
  console.log(`parse: ${formatMs(average(measuredRuns.map((run) => run.timings.parseMs)))}`);
  console.log(`execute: ${formatMs(average(measuredRuns.map((run) => run.timings.executionMs)))}`);
  console.log(
    `runner: ${formatMs(
      average(
        measuredRuns.map((run) => run.timings.shopifyPhases?.functionRunnerMs ?? 0),
      ),
    )}`,
  );
}

runBenchmark().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  printUsage();
  process.exit(1);
});
