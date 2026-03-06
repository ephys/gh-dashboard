import { CheckIcon, DotFillIcon, EyeIcon, XIcon } from '@primer/octicons-react';
import type { ComponentType } from 'react';
import css from './review-state-icon.module.scss';

export enum ReviewState {
  Approved = 'Approved',
  ChangesRequested = 'ChangesRequested',
  // GitHub-specific
  Commented = 'Commented',
  // GitHub-specific
  Pending = 'Pending',
  // DevOps-specific
  Rejected = 'Rejected',
}

interface ReviewStateIconProps {
  blockingCommentCount?: number;
  state: ReviewState;
}

const ICONS: Record<
  ReviewState,
  {
    badgeClassName?: string;
    icon: ComponentType<{ className?: string; size?: number }>;
    iconSize: number;
  }
> = {
  [ReviewState.Approved]: {
    badgeClassName: css.approved,
    icon: CheckIcon,
    iconSize: 12,
  },
  [ReviewState.ChangesRequested]: {
    badgeClassName: css.changesRequested,
    icon: XIcon,
    iconSize: 8,
  },
  [ReviewState.Commented]: {
    badgeClassName: css.commented,
    icon: EyeIcon,
    iconSize: 12,
  },
  [ReviewState.Pending]: {
    badgeClassName: css.pending,
    icon: DotFillIcon,
    iconSize: 16,
  },
  [ReviewState.Rejected]: {
    badgeClassName: css.rejected,
    icon: DotFillIcon,
    iconSize: 16,
  },
};

export function ReviewStateIcon(props: ReviewStateIconProps) {
  const iconData = ICONS[props.state];

  const Icon = iconData.icon;

  const icon =
    !props.blockingCommentCount ||
    props.state === 'Rejected' ||
    props.state === 'ChangesRequested' ? (
      <Icon className={css.icon} size={iconData.iconSize} />
    ) : props.blockingCommentCount > 9 ? (
      '9+'
    ) : (
      props.blockingCommentCount
    );

  return <div className={`${css.badge} ${iconData.badgeClassName ?? ''}`}>{icon}</div>;
}
