/**
 * Returns an array that includes the values of an iterator that matched the callback.
 */
export function filter<I, O extends I>(
  iterator: Iterable<I>,
  cb: (val: I) => val is O,
): Generator<O>;
export function filter<I>(iterator: Iterable<I>, cb: (val: I) => boolean): Generator<I>;
export function* filter<I>(iterator: Iterable<I>, cb: (val: I) => boolean): Generator<I> {
  for (const item of iterator) {
    if (cb(item)) {
      yield item;
    }
  }
}

/**
 * Returns an array that excludes the values of an iterator that matched the callback.
 */
export function filterOut<I, O extends I>(
  iterator: Iterable<I>,
  cb: (val: I) => val is O,
): Generator<Exclude<I, O>>;
export function filterOut<I>(iterator: Iterable<I>, cb: (val: I) => boolean): Generator<I>;
export function* filterOut<I>(iterator: Iterable<I>, cb: (val: I) => boolean): Generator<I> {
  for (const item of iterator) {
    if (!cb(item)) {
      yield item;
    }
  }
}
