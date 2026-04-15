import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
} from '../generated/api';

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  if (!input.cart.lines.length) {
    return {operations: []};
  }

  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass) {
    return {operations: []};
  }

  const maxCartLine = input.cart.lines.reduce((maxLine, line) => {
    if (line.cost.subtotalAmount.amount > maxLine.cost.subtotalAmount.amount) {
      return line;
    }
    return maxLine;
  }, input.cart.lines[0]);

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: [
            {
              message: 'WORKBENCH PRODUCT TEST',
              targets: [
                {
                  cartLine: {
                    id: maxCartLine.id,
                  },
                },
              ],
              value: {
                percentage: {
                  value: 15,
                },
              },
            },
          ],
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}
