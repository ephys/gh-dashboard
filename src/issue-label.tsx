import { Label } from '@primer/react';
import css from './issue-label.module.scss';
import { parseHexColor } from './utils/parse-hex-color.ts';
import { rgbToHsl } from './utils/rgb-to-hsl.ts';

interface IssueLabelProps {
  hexColor: string;
  name: string;
}

export function IssueLabel(props: IssueLabelProps) {
  const color = parseHexColor(props.hexColor);
  if (!color) {
    throw new Error(`${props.hexColor} is not a valid hexadecimal color.`);
  }

  const [r, g, b] = color;
  const [h, s, l] = rgbToHsl(r, g, b);

  return (
    <Label
      sx={{ fontWeight: 'var(--base-text-weight-normal)' }}
      className={css.label}
      style={{
        '--label-r': r,
        '--label-g': g,
        '--label-b': b,
        '--label-h': h,
        '--label-s': s,
        '--label-l': l,
      }}>
      {props.name}
    </Label>
  );
}
