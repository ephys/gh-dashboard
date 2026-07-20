import { Avatar, Link, Tooltip } from '@primer/react';
import { useAppConfiguration } from './app-configuration.tsx';
import { AvatarIcon } from './avatar-icon.tsx';
import { formatUserName } from './format-user-name.tsx';
import type { InlineUserProps } from './inline-user.tsx';
import { PendingReviewIcon } from './pending-review-icon.tsx';
import css from './review-avatar.module.scss';
import { ReviewState, ReviewStateIcon } from './review-state-icon.tsx';

export interface ReviewAvatarProps {
  blockingCommentCount?: number;
  codeOwner?: boolean;
  pending: boolean;
  requested: boolean;
  reviewer: InlineUserProps;
  state: ReviewState | null;
}

export function ReviewAvatar(props: ReviewAvatarProps) {
  const { pending, requested, state, reviewer, codeOwner } = props;
  const [appConfig] = useAppConfiguration();

  const formattedUserName = formatUserName({ ...reviewer, style: appConfig.userNameStyle });

  const stateText = pending
    ? 'You have a review in progress'
    : requested
      ? `Waiting for review from ${formattedUserName}`
      : state === ReviewState.Commented
        ? `Commented by ${formattedUserName}`
        : state === ReviewState.Approved
          ? `Approved by ${formattedUserName}${props.blockingCommentCount ? `, with ${props.blockingCommentCount} unresolved threads` : ''}`
          : state === ReviewState.ChangesRequested
            ? `Changes requested by ${formattedUserName}`
            : state === ReviewState.Rejected
              ? `Rejected by ${formattedUserName}`
              : '';

  const avatarIcon = (
    <AvatarIcon
      avatar={<Avatar src={reviewer.avatarUrl} size={32} />}
      topIcon={pending || requested ? <PendingReviewIcon inProgress={pending} /> : null}
      bottomIcon={
        state ? (
          <ReviewStateIcon
            className={css.reviewStateIcon}
            state={state}
            blockingCommentCount={props.blockingCommentCount}
          />
        ) : null
      }
    />
  );

  return (
    <Tooltip text={codeOwner ? `${stateText} (code owner)`.trimStart() : stateText} direction="nw">
      {reviewer.profileUrl ? (
        <Link href={reviewer.profileUrl} className={css.link}>
          {avatarIcon}
        </Link>
      ) : (
        <span className={css.link}>{avatarIcon}</span>
      )}
    </Tooltip>
  );
}
