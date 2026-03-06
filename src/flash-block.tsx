import { KebabHorizontalIcon } from '@primer/octicons-react';
import { ActionList, ActionMenu, Flash } from '@primer/react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { ActionMenuIconButton } from './action-menu-icon-button.tsx';

export enum AlertVariant {
  info = 'info',
  success = 'success',
  warning = 'warning',
  danger = 'danger',
}

type AlertProps = {
  markdown: string;
  variant: AlertVariant;
  actions?: ReactNode;
};

export function FlashBlock(props: AlertProps) {
  return (
    <Flash variant={props.variant === 'info' ? 'default' : props.variant} className="markdown-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <ReactMarkdown>{props.markdown}</ReactMarkdown>
        </div>
        <div style={{ display: 'flex', marginLeft: '8px' }}>
          <ActionMenuIconButton icon={KebabHorizontalIcon} aria-label="More Actions">
            <ActionMenu.Overlay width="auto">
              <ActionList>{props.actions}</ActionList>
            </ActionMenu.Overlay>
          </ActionMenuIconButton>
        </div>
      </div>
    </Flash>
  );
}
