import { CheckIcon, DotFillIcon, EyeIcon, XIcon } from '@primer/octicons-react';
import { Box, Octicon } from '@primer/react';
import type { ComponentType } from 'react';
import { PullRequestReviewState } from './gql/graphql.ts';

export type DisplayablePullRequestReviewState = Exclude<
  PullRequestReviewState,
  PullRequestReviewState.Dismissed
>;

interface ReviewStateIconProps {
  state: DisplayablePullRequestReviewState;
}

const ICONS: Record<
  DisplayablePullRequestReviewState,
  {
    bgColor?: string;
    fgColor?: string;
    icon: ComponentType;
    iconSize: number;
  }
> = {
  [PullRequestReviewState.Approved]: {
    bgColor: 'success.emphasis',
    icon: CheckIcon,
    iconSize: 12,
  },
  [PullRequestReviewState.ChangesRequested]: {
    bgColor: 'danger.emphasis',
    icon: XIcon,
    iconSize: 8,
  },
  [PullRequestReviewState.Commented]: {
    bgColor: 'var(--timelineBadge-bgColor)',
    fgColor: 'var(--fgColor-muted)',
    icon: EyeIcon,
    iconSize: 12,
  },
  [PullRequestReviewState.Pending]: {
    fgColor: 'attention.emphasis',
    icon: DotFillIcon,
    iconSize: 16,
  },
};

export function ReviewStateIcon(props: ReviewStateIconProps) {
  const iconData = ICONS[props.state];

  return (
    <Box
      sx={{
        alignItems: 'center',
        backgroundColor: iconData.bgColor,
        borderRadius: '50%',
        color: iconData.fgColor,
        display: 'flex',
        justifyContent: 'center',
        padding: 1,
        size: 16,
      }}>
      <Octicon icon={iconData.icon} size={iconData.iconSize} />
    </Box>
  );
}
