import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from '@primer/octicons-react';
import { IconButton, Tooltip } from '@primer/react';
import type { ReactNode } from 'react';
import css from './component-wrapper.module.scss';

interface ComponentWrapperProps {
  canMoveDown: boolean;
  canMoveUp: boolean;
  children: ReactNode;
  onInsertBefore?(): void;
  onMoveDown?(): void;
  onMoveUp?(): void;
}

export function ComponentWrapper({
  children,
  onMoveUp,
  onMoveDown,
  onInsertBefore,
  canMoveUp,
  canMoveDown,
}: ComponentWrapperProps) {
  return (
    <div className={css.wrapper}>
      <div className={css.controls}>
        <Tooltip text="Insert component before" direction="e">
          <IconButton
            aria-label="Insert component before"
            icon={PlusIcon}
            size="small"
            onClick={onInsertBefore}
            variant="invisible"
          />
        </Tooltip>
        <Tooltip text="Move up" direction="e">
          <IconButton
            aria-label="Move up"
            icon={ChevronUpIcon}
            size="small"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            variant="invisible"
          />
        </Tooltip>
        <Tooltip text="Move down" direction="e">
          <IconButton
            aria-label="Move down"
            icon={ChevronDownIcon}
            size="small"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            variant="invisible"
          />
        </Tooltip>
      </div>
      <div className={css.content}>{children}</div>
    </div>
  );
}


