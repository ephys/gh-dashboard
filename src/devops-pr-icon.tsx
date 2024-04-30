import {
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
} from '@primer/octicons-react';
import type { OcticonProps } from '@primer/react';
import { Octicon } from '@primer/react';

interface DevopsPrIconProps {
  isDraft: boolean;
  status: 'active' | 'abandoned' | 'completed';
  sx?: OcticonProps['sx'];
}

export function DevopsPrIcon(props: DevopsPrIconProps) {
  if (props.status === 'abandoned') {
    return <Octicon icon={GitPullRequestClosedIcon} color="closed.fg" sx={props.sx} />;
  }

  if (props.status === 'completed') {
    return <Octicon icon={GitMergeIcon} color="done.fg" sx={props.sx} />;
  }

  if (props.isDraft) {
    return <Octicon icon={GitPullRequestDraftIcon} color="fg.muted" sx={props.sx} />;
  }

  return <Octicon icon={GitPullRequestIcon} color="open.fg" sx={props.sx} />;
}
