import { parseSafeInteger } from '@sequelize/utils';

const HEX_COLOR_REGEXP = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;

export type Rgb = [r: number, g: number, b: number];

export function parseHexColor(hexColor: string): null | Rgb {
  const match = HEX_COLOR_REGEXP.exec(hexColor);
  if (!match) {
    return null;
  }

  const [, red, green, blue] = match;

  const r = parseSafeInteger.orThrow(red, 16);
  const g = parseSafeInteger.orThrow(green, 16);
  const b = parseSafeInteger.orThrow(blue, 16);

  return [r, g, b];
}
