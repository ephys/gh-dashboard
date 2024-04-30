import { CheckIcon, DotFillIcon, EyeIcon, XIcon } from '@primer/octicons-react';
import { Box, Octicon } from '@primer/react';
import type { ComponentType } from 'react';

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
  state: ReviewState;
}

const ICONS: Record<
  ReviewState,
  {
    bgColor?: string;
    fgColor?: string;
    icon: ComponentType;
    iconSize: number;
  }
> = {
  [ReviewState.Approved]: {
    bgColor: 'success.emphasis',
    icon: CheckIcon,
    iconSize: 12,
  },
  [ReviewState.ChangesRequested]: {
    bgColor: 'danger.emphasis',
    icon: XIcon,
    iconSize: 8,
  },
  [ReviewState.Commented]: {
    bgColor: 'var(--timelineBadge-bgColor)',
    fgColor: 'var(--fgColor-muted)',
    icon: EyeIcon,
    iconSize: 12,
  },
  [ReviewState.Pending]: {
    fgColor: 'attention.emphasis',
    icon: DotFillIcon,
    iconSize: 16,
  },
  [ReviewState.Rejected]: {
    fgColor: 'black',
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
