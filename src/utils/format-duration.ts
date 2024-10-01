type DurationUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week';

interface DurationStruct {
  day?: number;
  hour?: number;
  millisecond?: number;
  minute?: number;
  second?: number;
  sign?: 1 | -1;
}

function makeNumberFormat(
  unit: DurationUnit,
  extraOptions?: Intl.NumberFormatOptions,
): Intl.NumberFormatOptions {
  return {
    ...extraOptions,
    style: 'unit',
    unit,
  };
}

export const durationUnitFormatters: Record<DurationUnit, Intl.NumberFormatOptions> = Object.freeze(
  {
    millisecond: makeNumberFormat('millisecond'),
    second: makeNumberFormat('second'),
    minute: makeNumberFormat('minute'),
    hour: makeNumberFormat('hour', { unitDisplay: 'long' }),
    day: makeNumberFormat('day', { unitDisplay: 'long' }),
    week: makeNumberFormat('week'),
  },
);

export function formatDurationPart(value: number, unit: DurationUnit, locale: string): string {
  return value.toLocaleString(locale, durationUnitFormatters[unit]);
}

const unitOrder = ['day', 'hour', 'minute', 'second', 'millisecond'] as const;

export function formatDuration(
  durationMs: number,
  locale: string,
  precision: number = unitOrder.length,
): string {
  const duration = millisecondsToDuration(durationMs);

  const { sign = 1 } = duration;

  const parts = [];

  for (const currentUnit of unitOrder) {
    const unitValue = duration[currentUnit];

    if (unitValue) {
      parts.push(formatDurationPart(unitValue, currentUnit, locale));
    }

    if (unitValue || parts.length > 0) {
      precision--;
    }

    if (precision <= 0) {
      break;
    }
  }

  if (parts.length === 0) {
    return formatDurationPart(0, 'second', locale);
  }

  const signStr: string = sign < 0 ? '-' : '';

  return `${signStr}${parts.join(' ')}`;
}

function millisecondsToDuration(durationMs: number): Required<DurationStruct> {
  const sign = Math.sign(durationMs) as -1 | 0 | 1;
  durationMs = Math.abs(durationMs);

  const millisecond = durationMs % 1000;
  durationMs = (durationMs - millisecond) / 1000;

  const second = durationMs % 60;
  durationMs = (durationMs - second) / 60;

  const minute = durationMs % 60;
  durationMs = (durationMs - minute) / 60;

  const hour = durationMs % 24;
  const day = (durationMs - hour) / 24;

  return {
    sign: sign === 0 ? 1 : sign,
    day,
    hour,
    minute,
    second,
    millisecond,
  };
}
