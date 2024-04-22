import { Flash } from '@primer/react';
import ReactMarkdown from 'react-markdown';

export enum AlertVariant {
  info = 'info',
  success = 'success',
  warning = 'warning',
  danger = 'danger',
}

type AlertProps = {
  markdown: string;
  variant: AlertVariant;
};

export function FlashBlock(props: AlertProps) {
  return (
    <Flash variant={props.variant === 'info' ? 'default' : props.variant} className="markdown-body">
      <ReactMarkdown>{props.markdown}</ReactMarkdown>
    </Flash>
  );
}
