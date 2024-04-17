import type { PropsWithChildren } from 'react';
import css from './markdown.module.scss';

export function InlineCode(props: PropsWithChildren) {
  return <code className={css.code}>{props.children}</code>;
}

export function P(props: PropsWithChildren) {
  return <p className={css.p}>{props.children}</p>;
}
