import { Avatar } from '@primer/react';
import { AvatarIcon } from './avatar-icon.tsx';
import { graphql, useFragment, type FragmentType } from './gql/index.ts';
import { PendingReviewIcon } from './pending-review-icon.tsx';
import type { DisplayablePullRequestReviewState } from './review-state-icon.tsx';
import { ReviewStateIcon } from './review-state-icon.tsx';

// TODO: support bots
export const ReviewAvatarUserFragment = graphql(/* GraphQL */ `
  fragment ReviewAvatarUser on User {
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
  const reviewer = useFragment(ReviewAvatarUserFragment, props.reviewer);

  // TODO: labels
  return (
    <AvatarIcon
      avatar={<Avatar src={reviewer.avatarUrl} size={32} />}
      topIcon={pending || requested ? <PendingReviewIcon inProgress={pending} /> : null}
      bottomIcon={state ? <ReviewStateIcon state={state} /> : null}
    />
  );
}
