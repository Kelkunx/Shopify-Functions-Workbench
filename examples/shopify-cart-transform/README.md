# Shopify Cart Transform Example

This official example validates the real Shopify runner path for `purchase.cart-transform.run`.

## What it contains

- `shopify.app.toml`: minimal app config for Shopify CLI metadata
- `extensions/workbench-cart-transform/`: function directory for the workbench
- `input/cart-transform.input.json`: ready-to-run input payload

## What it does

The function updates any cart line that has the `Fabric Length` attribute and recalculates its fixed unit price from that value.

With the bundled input:

- line `gid://shopify/CartLine/1` becomes `Cotton roll (2m)`
- the fixed unit price becomes `17.00`

## Workbench values

From the repository root, use:

- `functionDir`: `examples/shopify-cart-transform/extensions/workbench-cart-transform`
- `target`: `purchase.cart-transform.run`
- `exportName`: `run`

Then paste `input/cart-transform.input.json` into the JSON editor and click `Run`.

## Expected result

- `success: true`
- one `update` operation
- updated title `Cotton roll (2m)`
- fixed price per unit `17.00`
- the second cart line is unchanged

## Notes

- This example is intentionally minimal and versioned for workbench validation.
- It includes a prebuilt `dist/function.wasm`, so a first real Shopify run does not require `npm run build`.
- Local timings remain diagnostics only.
