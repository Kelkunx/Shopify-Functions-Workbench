# Shopify Delivery Customization Example

This official example validates the real Shopify runner path for `purchase.delivery-customization.run`.

## What it contains

- `shopify.app.toml`: minimal app config for Shopify CLI metadata
- `extensions/workbench-delivery-customization/`: function directory for the workbench
- `input/delivery-customization.input.json`: ready-to-run input payload

## What it does

The function renames every delivery option in the matching province by appending a configured label.

With the bundled input, delivery options in `QC` are renamed with:

- `Workbench local rename`

## Workbench values

From the repository root, use:

- `functionDir`: `examples/shopify-delivery-customization/extensions/workbench-delivery-customization`
- `target`: `purchase.delivery-customization.run`
- `exportName`: `run`

Then paste `input/delivery-customization.input.json` into the JSON editor and click `Run`.

## Expected result

- `success: true`
- two `rename` operations
- `standard-qc` becomes `Standard shipping - Workbench local rename`
- `express-qc` becomes `Express shipping - Workbench local rename`
- no rename operation for the `ON` delivery group

## Notes

- This example is intentionally minimal and versioned for workbench validation.
- It includes a prebuilt `dist/function.wasm`, so a first real Shopify run does not require `npm run build`.
- Local timings remain diagnostics only.
