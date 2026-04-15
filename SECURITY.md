# Security Policy

Shopify Functions Workbench is a local developer tool for trusted workflows.

## Supported versions

Only the latest `main` branch state is supported.

## Reporting a vulnerability

Please do not open a public issue for a security-sensitive report.

Instead:

1. Email the maintainer or contact them privately through GitHub.
2. Include the affected version or commit, reproduction steps, and impact.
3. Mention whether the issue concerns:
   - local Wasm execution
   - Shopify runner integration
   - scenario import/export
   - dependency or supply-chain risk

## Scope notes

- The workbench is **not** a hardened sandbox for running arbitrary untrusted Wasm.
- Users should only run trusted Wasm locally.
- Local benchmark timings are diagnostics only and are not Shopify production guarantees.
