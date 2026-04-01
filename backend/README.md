# Backend

NestJS API for the Shopify Functions Local Runner.

## Purpose

The backend exposes a local `POST /run` endpoint used by the frontend to:

- receive a `.wasm` file
- receive JSON input
- receive the selected Shopify function type
- execute the function locally
- return output, timing, and errors

At the moment, the execution layer is still mocked. The API shape is already stable, so the real WASI runtime can replace the mock without changing the frontend contract.

## Main Files

- `src/main.ts`: Nest bootstrap and CORS setup
- `src/app.module.ts`: root application module
- `src/run/run.module.ts`: run feature module
- `src/run/run.controller.ts`: `POST /run` endpoint
- `src/run/run.service.ts`: request validation, timing, and mock execution

## Scripts

From `backend/`:

```bash
npm run start:dev
npm run start:dev:light
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Notes

- `start:dev` uses Nest watch mode with the `swc` builder
- `start:dev:light` keeps the same path with slightly quieter output for lighter local use
- the current mock runner also supports requests without a real `.wasm` file to simplify local UI testing
