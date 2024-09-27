import { clsx } from 'clsx';
import { useSnackbar } from 'notistack';
import type { ComponentProps } from 'react';
import css from './branch-button.module.scss';

interface Props extends Omit<ComponentProps<'button'>, 'title' | 'onClick' | 'children'> {
  children: string;
}

export function BranchButton(props: Props) {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <button
      type="button"
      {...props}
      className={clsx(props.className, css.branchButton)}
      title="Copy branch name to clipboard"
      onClick={() => {
        navigator.clipboard
          .writeText(props.children)
          .then(() => {
            enqueueSnackbar('Copied to clipboard', { autoHideDuration: 1000 });
          })
          .catch(() => {
            enqueueSnackbar('Could not copy to clipboard', { variant: 'error' });
          });
      }}
    />
  );
}
