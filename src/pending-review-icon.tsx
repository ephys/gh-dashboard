import css from './pending-review-icon.module.scss';

interface PendingReviewIconProps {
  inProgress: boolean;
}

export function PendingReviewIcon(props: PendingReviewIconProps) {
  return <div className={props.inProgress ? css.pendingReview : css.requestedReview} />;
}
