import { PencilIcon, TrashIcon } from '@primer/octicons-react';
import { Flash, IconButton } from '@primer/react';
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
  onDelete(): void;
  onEdit(): void;
};

export function FlashBlock(props: AlertProps) {
  return (
    <Flash variant={props.variant === 'info' ? 'default' : props.variant} className="markdown-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <ReactMarkdown>{props.markdown}</ReactMarkdown>
        </div>
          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
            {props.onEdit && (
              <IconButton
                aria-label="Edit"
                icon={PencilIcon}
                size="small"
                onClick={props.onEdit}
                variant="invisible"
              />
            )}
            {props.onDelete && (
              <IconButton
                aria-label="Delete"
                icon={TrashIcon}
                size="small"
                onClick={props.onDelete}
                variant="invisible"
              />
            )}
          </div>
      </div>
    </Flash>
  );
}
