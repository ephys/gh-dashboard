import { Box, Button, Dialog } from '@primer/react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { P } from './markdown-components.tsx';

export interface DeletionConfirmationDialogProps {
  onCancel(this: void): void;
  onDelete(this: void): void;
  text: ReactNode;
  title: ReactNode;
}

export function DeletionConfirmationDialog({
  onDelete,
  onCancel,
  title,
  text,
}: DeletionConfirmationDialogProps) {
  const headerId = useId();

  return (
    <Dialog isOpen onDismiss={onDelete} aria-labelledby={headerId}>
      <Dialog.Header id={headerId}>{title}</Dialog.Header>
      <Box p={3}>
        {text}
        <P>Are you sure you want to proceed?</P>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, marginTop: 2 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
