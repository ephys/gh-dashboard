import { clsx } from 'clsx';
import { useSnackbar } from 'notistack';
import css from './branch-button.module.scss';

interface Props {
  children: string;
  className?: string;
  /** Text to copy to clipboard. Defaults to children. Mutually exclusive with href. */
  copyValue?: string;
  /** When set, renders as an anchor that navigates to this URL (e.g. IDE URI schemes). */
  href?: string;
  /** Tooltip text. Auto-generated when omitted. */
  title?: string;
  /** Visual variant. Defaults to 'default' (accent colors). Use 'attention' for warning/attention colors. */
  variant?: 'accent' | 'attention';
}

export function BranchButton({
  children,
  className,
  copyValue,
  title,
  href,
  variant = 'accent',
}: Props) {
  const { enqueueSnackbar } = useSnackbar();

  if (href) {
    return (
      <a
        href={href}
        className={clsx(className, css.branchButton, css[variant])}
        title={title ?? 'Open in IDE'}
        // Prevent navigation for custom URI schemes; let the OS handle it
        onClick={e => {
          e.preventDefault();
          window.location.href = href;
        }}>
        {children}
      </a>
    );
  }

  const valueToCopy = copyValue ?? children;

  return (
    <button
      type="button"
      className={clsx(className, css.branchButton, css[variant])}
      title={title ?? 'Copy to clipboard'}
      onClick={() => {
        navigator.clipboard
          .writeText(valueToCopy)
          .then(() => {
            enqueueSnackbar(`Copied: ${valueToCopy}`, { autoHideDuration: 2000 });
          })
          .catch(() => {
            enqueueSnackbar('Could not copy to clipboard', { variant: 'error' });
          });
      }}>
      {children}
    </button>
  );
}
