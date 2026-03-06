import {
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
} from '@primer/octicons-react';
import css from './devops-pr-icon.module.scss';

interface DevopsPrIconProps {
  isDraft: boolean;
  status: 'active' | 'abandoned' | 'completed';
  className?: string;
}

export function DevopsPrIcon(props: DevopsPrIconProps) {
  if (props.status === 'abandoned') {
    return <GitPullRequestClosedIcon className={`${css.iconClosed} ${props.className || ''}`} />;
  }

  if (props.status === 'completed') {
    return <GitMergeIcon className={`${css.iconDone} ${props.className || ''}`} />;
  }

  if (props.isDraft) {
    return <GitPullRequestDraftIcon className={`${css.iconMuted} ${props.className || ''}`} />;
  }

  return <GitPullRequestIcon className={`${css.iconOpen} ${props.className || ''}`} />;
}
