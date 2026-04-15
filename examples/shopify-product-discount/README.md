# Shopify Product Discount Example

This is the official example package for validating the real Shopify runner path in Shopify Functions Workbench.

For the shortest test path, start with `../README.md`.

## What it contains

- `shopify.app.toml`: minimal app config required by Shopify CLI
- `extensions/workbench-product-discount/`: the function directory used by the workbench
- `input/product-discount.input.json`: ready-to-run JSON input for the workbench

## What it does

The function applies a `15%` product discount to the most expensive cart line when `PRODUCT` is present in `discount.discountClasses`.

Expected message:

- `WORKBENCH PRODUCT TEST`

## Workbench values

From the repository root, use:

- `functionDir`: `examples/shopify-product-discount/extensions/workbench-product-discount`
- `target`: `cart.lines.discounts.generate.run`
- `exportName`: `run`

Then paste `input/product-discount.input.json` into the JSON editor and click `Run`.

## Expected result

- `success: true`
- one `productDiscountsAdd` operation
- message `WORKBENCH PRODUCT TEST`
- percentage `15`
- target cart line `gid://shopify/CartLine/high`

## Notes

- This example is meant to validate the workbench, not replace a full Shopify app project.
- It includes a prebuilt `dist/function.wasm` so a first real Shopify run can succeed without scaffolding a separate local sandbox.
- Local timings remain diagnostics only.
