import { Avatar, Tooltip } from '@primer/react';
import { useAppConfiguration } from './app-configuration.tsx';
import { AvatarIcon } from './avatar-icon.tsx';
import { formatUserName } from './format-user-name.tsx';
import { PullRequestReviewState } from './gql/graphql.ts';
import { getFragmentData, graphql, type FragmentType } from './gql/index.ts';
import { PendingReviewIcon } from './pending-review-icon.tsx';
import type { DisplayablePullRequestReviewState } from './review-state-icon.tsx';
import { ReviewStateIcon } from './review-state-icon.tsx';

export const ReviewAvatarUserFragment = graphql(/* GraphQL */ `
  fragment ReviewAvatarUser on Actor {
    ...FormatUser
    login
    avatarUrl
  }
`);

export interface ReviewAvatarProps {
  pending: boolean;
  requested: boolean;
  reviewer: FragmentType<typeof ReviewAvatarUserFragment>;
  state: DisplayablePullRequestReviewState | null;
}

export function ReviewAvatar(props: ReviewAvatarProps) {
  const { pending, requested, state } = props;
  const reviewer = getFragmentData(ReviewAvatarUserFragment, props.reviewer);
  const [appConfig] = useAppConfiguration();

  // TODO: labels
  return (
    <Tooltip
      text={
        pending
          ? 'You have a review in progress'
          : requested
            ? `Waiting for review from ${formatUserName(reviewer, appConfig.userNameStyle)}`
            : state === PullRequestReviewState.Commented
              ? `Commented by ${formatUserName(reviewer, appConfig.userNameStyle)}`
              : state === PullRequestReviewState.Approved
                ? `Approved by ${formatUserName(reviewer, appConfig.userNameStyle)}`
                : state === PullRequestReviewState.ChangesRequested
                  ? `Changes requested by ${formatUserName(reviewer, appConfig.userNameStyle)}`
                  : ''
      }
      direction="nw">
      <AvatarIcon
        avatar={<Avatar src={reviewer.avatarUrl} size={32} />}
        topIcon={pending || requested ? <PendingReviewIcon inProgress={pending} /> : null}
        bottomIcon={state ? <ReviewStateIcon state={state} /> : null}
      />
    </Tooltip>
  );
}
