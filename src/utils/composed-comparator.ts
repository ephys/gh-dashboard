import type { Comparator } from '@sequelize/utils';

/**
 * Composes multiple comparators together. They are run in-order up to the first one to return a non-zero value.
 *
 * @param comparators the comparators to compose.
 */
export function composedComparator<T>(...comparators: Array<Comparator<T>>): Comparator<T> {
  return (a, b) => {
    for (const comparator of comparators) {
      const out = comparator(a, b);

      if (out !== 0) {
        return out;
      }
    }

    return 0;
  };
}
