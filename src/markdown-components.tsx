import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';
import css from './markdown-components.module.scss';

export function InlineCode(props: PropsWithChildren) {
  return <code className={css.code}>{props.children}</code>;
}

interface ParagraphProps extends PropsWithChildren {
  className?: string;
}

export function P(props: ParagraphProps) {
  return (
    <p {...props} className={clsx(css.p, props.className)}>
      {props.children}
    </p>
  );
}
