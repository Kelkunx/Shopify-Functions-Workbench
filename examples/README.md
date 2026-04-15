# Examples

Official examples for Shopify Functions Workbench live here.

Use these examples to validate the real Shopify runner path without setting up your own Shopify Function first.

## Current example

- `shopify-product-discount/`: minimal Shopify Function example for validating the real Shopify runner path

## Recommended test flow

From the repository root:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` and use the workbench with:

- mode: `Shopify`
- `functionDir`: `examples/shopify-product-discount/extensions/workbench-product-discount`
- `target`: `cart.lines.discounts.generate.run`
- `exportName`: `run`
- `inputJson`: paste `examples/shopify-product-discount/input/product-discount.input.json`

Then click `Run`.

## Expected result

- `success: true`
- one `productDiscountsAdd` operation
- message `WORKBENCH PRODUCT TEST`
- percentage `15`
- target cart line `gid://shopify/CartLine/high`

## Notes

- the example includes a prebuilt `dist/function.wasm`
- local timings remain diagnostics only
- only run trusted Wasm locally

For the full example breakdown, see `examples/shopify-product-discount/README.md`.
