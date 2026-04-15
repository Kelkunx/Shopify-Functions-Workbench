# Examples

Official examples for Shopify Functions Workbench live here.

Use these examples to validate the real Shopify runner path without setting up your own Shopify Function first.

## Official examples

- `shopify-product-discount/`: product discount target for `cart.lines.discounts.generate.run`
- `shopify-delivery-customization/`: delivery customization target for `purchase.delivery-customization.run`
- `shopify-cart-transform/`: cart transform target for `purchase.cart-transform.run`

## Recommended test flow

From the repository root:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` and use the workbench with one of these setups:

### Product discount

- mode: `Shopify`
- `functionDir`: `examples/shopify-product-discount/extensions/workbench-product-discount`
- `target`: `cart.lines.discounts.generate.run`
- `exportName`: `run`
- `inputJson`: paste `examples/shopify-product-discount/input/product-discount.input.json`

### Delivery customization

- mode: `Shopify`
- `functionDir`: `examples/shopify-delivery-customization/extensions/workbench-delivery-customization`
- `target`: `purchase.delivery-customization.run`
- `exportName`: `run`
- `inputJson`: paste `examples/shopify-delivery-customization/input/delivery-customization.input.json`

### Cart transform

- mode: `Shopify`
- `functionDir`: `examples/shopify-cart-transform/extensions/workbench-cart-transform`
- `target`: `purchase.cart-transform.run`
- `exportName`: `run`
- `inputJson`: paste `examples/shopify-cart-transform/input/cart-transform.input.json`

Then click `Run`.

## Expected results

- product discount: one `productDiscountsAdd` operation with `WORKBENCH PRODUCT TEST`
- delivery customization: two `rename` operations for the `QC` delivery group
- cart transform: one `update` operation for the first cart line

## Notes

- each example includes a prebuilt `dist/function.wasm`, so the first run does not require a manual build
- local timings remain diagnostics only
- only run trusted Wasm locally

For the full breakdown, see:

- `examples/shopify-product-discount/README.md`
- `examples/shopify-delivery-customization/README.md`
- `examples/shopify-cart-transform/README.md`
