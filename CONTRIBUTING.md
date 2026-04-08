# Contributing

Shopify Functions Workbench is a web-first local developer tool for trusted Shopify Function workflows.

## Local setup

From the repository root:

```bash
npm install
npm run dev
```

Useful variants:

```bash
npm run dev:light
npm run dev:backend
npm run dev:frontend
```

## Validation before opening a PR

Run the full local validation set from the repository root:

```bash
npm run lint
npm run build
npm run test
```

Focused commands:

```bash
npm run build:backend
npm run build:frontend
npm run test:backend
npm run test:frontend
npm run test:e2e
```

## Contribution guidelines

- Prefer Shopify mode changes that improve real local validation over mock-only conveniences.
- Keep mock mode useful, but treat it as assistive DX rather than the primary product path.
- Preserve the existing `/run` contract unless a compatibility-preserving extension is not possible.
- When adding timings, make clear whether they are local diagnostics or Shopify-runtime guarantees.
- Only run trusted Wasm locally. This project is not a hardened sandbox for untrusted Wasm.

## Examples and fixtures

- Browser-saved scenarios are for local iteration and should not be committed as source-controlled truth by default.
- A clean official example package can be added later; avoid committing ad hoc local sandboxes.

## Pull request expectations

- Keep changes modular across backend, frontend, and docs when possible.
- Add or update tests for behavior changes.
- Update the relevant README sections when the user-facing workflow changes.
