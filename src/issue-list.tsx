import { CommentIcon, KebabHorizontalIcon, XIcon } from '@primer/octicons-react';
import {
  ActionList,
  ActionMenu,
  Flash,
  LabelGroup,
  Link as PrimerLink,
  RelativeTime,
  Text,
  Tooltip,
} from '@primer/react';
import { DataTable, Table, type Column } from '@primer/react/experimental';
import { basicComparator } from '@sequelize/utils';
import { useMemo, type ReactNode } from 'react';
import { ActionMenuIconButton } from './action-menu-icon-button.tsx';
import { UserNameStyle } from './app-configuration.js';
import { BranchButton } from './branch-button.js';
import { formatUserName } from './format-user-name.js';
import type { InlineUserProps } from './inline-user.tsx';
import { InlineUser } from './inline-user.tsx';
import type { IssueLabelProps } from './issue-label.tsx';
import { IssueLabel } from './issue-label.tsx';
import css from './issue-list.module.scss';
import { P } from './markdown-components.tsx';
import { Markdown } from './markdown.tsx';
import { PendingReviewIcon } from './pending-review-icon.js';
import type { ReviewAvatarProps } from './review-avatar.tsx';
import { ReviewAvatar } from './review-avatar.tsx';
import { ReviewState, ReviewStateIcon } from './review-state-icon.js';
import { composedComparator } from './utils/composed-comparator.ts';
import { formatDuration } from './utils/format-duration.js';
import { intersperse } from './utils/intersperse.js';

export interface FailedCheck {
  name: string;
  url: string;
}

export enum CheckStatus {
  success = 'success',
  failure = 'failure',
  pending = 'pending',
}

export interface IssueListItem {
  authors: InlineUserProps[];
  autoMerge?: { at: string; by: InlineUserProps } | undefined;
  branchName?: string;
  checkStatus?: CheckStatus | undefined;
  checksUrl: string;
  commentCount?: number;
  createdAt: string;
  failedChecks?: readonly FailedCheck[];
  icon: ReactNode;
  id: string;
  labels: IssueLabelProps[];
  mergedAt?: string | undefined;
  number: string;
  repository?: {
    name: string;
    url: string;
  };
  reviews: readonly ReviewAvatarProps[];
  title: string;
  unread: boolean;
  url: string;
  /** For how long the viewer has been requested to review */
  viewerReviewWaitTimes?: number;
}

interface IssueListProps {
  countPerPage: number;
  defaultRepository?: string;
  description: ReactNode;
  error: unknown;
  hideBranchNames?: boolean;
  hideNumbers?: boolean;
  issues: readonly IssueListItem[];
  loaded: boolean;
  name: ReactNode;
  actions?: ReactNode;

  onPageChange(pageIndex: number): void;

  subtitle?: ReactNode;
  totalCount: number;
}

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export function IssueList(props: IssueListProps) {
  const { totalCount, countPerPage, issues, defaultRepository, hideNumbers, hideBranchNames } =
    props;

  const COLUMNS: Array<Column<IssueListItem>> = useMemo(() => {
    return [
      {
        header: 'Results',
        id: 'main',
        width: 'auto',
        renderCell: data => {
          const { labels, failedChecks, viewerReviewWaitTimes = 0 } = data;

          return (
            <div className={css.issueRow} data-unread={String(data.unread)}>
              <div className={css.issueIconColumn}>
                {data.icon}
                {data.checkStatus === CheckStatus.failure ? (
                  <Tooltip text="Some checks failed" direction="ne">
                    <PrimerLink href={data.checksUrl} className={css.checksLink}>
                      <ReviewStateIcon state={ReviewState.ChangesRequested} />
                    </PrimerLink>
                  </Tooltip>
                ) : data.checkStatus === CheckStatus.success ? (
                  <Tooltip text="All checks passed" direction="ne">
                    <PrimerLink href={data.checksUrl} className={css.checksLink}>
                      <ReviewStateIcon state={ReviewState.Approved} />
                    </PrimerLink>
                  </Tooltip>
                ) : data.checkStatus === CheckStatus.pending ? (
                  <Tooltip text="Checks are running" direction="ne">
                    <PrimerLink href={data.checksUrl} className={css.checksLink}>
                      <PendingReviewIcon inProgress={false} />
                    </PrimerLink>
                  </Tooltip>
                ) : null}
              </div>

              <div className={css.issueContent}>
                <div className={css.issueHeader}>
                  <Text as="div" className={css.issueTitle}>
                    <PrimerLink href={data.url} className={css.titleLink}>
                      <Markdown>{data.title}</Markdown>
                    </PrimerLink>
                  </Text>
                  {data.autoMerge && (
                    <Tooltip
                      text={`Auto-merge enabled by ${formatUserName({
                        style: UserNameStyle.login,
                        displayName: data.autoMerge.by.displayName,
                        username: data.autoMerge.by.username,
                      })}`}
                      direction="n">
                      <PrimerLink href={data.url} className={css.autoMergeLink}>
                        <Text as="p" className={css.autoMergeBadge}>
                          Auto-merge
                        </Text>
                      </PrimerLink>
                    </Tooltip>
                  )}
                </div>
                <Text as={P} className={css.issueMeta}>
                  {data.repository && data.repository.name !== defaultRepository && (
                    <>
                      <PrimerLink href={data.repository.url} className={css.titleLink}>
                        {data.repository.name}
                      </PrimerLink>{' '}
                    </>
                  )}
                  {!hideNumbers && <>{data.number} </>}
                  {!hideBranchNames && data.branchName && (
                    <>
                      <BranchButton>{data.branchName}</BranchButton>{' '}
                    </>
                  )}
                  opened <RelativeTime datetime={data.createdAt} /> by{' '}
                  {intersperse(
                    data.authors.map(author => <InlineUser key={author.username} {...author} />),
                    ', ',
                  )}
                </Text>
                {Boolean(labels.length) && (
                  <LabelGroup className={css.labelGroup}>
                    {labels.map(label => (
                      <IssueLabel {...label} key={label.name} />
                    ))}
                  </LabelGroup>
                )}
                {Boolean(failedChecks?.length) && (
                  <div className={css.failedChecksRow}>
                    <XIcon className={css.failedCheckIcon} />{' '}
                    <span>
                      {intersperse(
                        failedChecks!.slice(0, 3).map((check, i) => (
                          <PrimerLink key={i} href={check.url} className={css.titleLink}>
                            {check.name}
                          </PrimerLink>
                        )),
                        ', ',
                      )}
                      {failedChecks!.length > 3 && <>, and {failedChecks!.length - 3} more…</>}
                    </span>
                  </div>
                )}
                {viewerReviewWaitTimes > ONE_DAY_MS * 2 ? (
                  <p className={css.slowReviewWarning}>
                    This PR has been waiting for your review for{' '}
                    {formatDuration(viewerReviewWaitTimes, 'en', 1)}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
        rowHeader: true,
      },
      {
        header: '',
        id: 'reviews',
        width: 'auto',
        align: 'end',
        renderCell: data => {
          const reviews = data.reviews;
          const commentCount = data.commentCount;

          if (!reviews.length && !commentCount) {
            return;
          }

          const stringCompareFn = basicComparator();
          const sortedReviews = reviews.toSorted(
            composedComparator(
              (a, b) => stringCompareFn(a.state, b.state),
              (a, b) => stringCompareFn(a.reviewer.username, b.reviewer.username),
            ),
          );

          return (
            <div className={css.reviewsRow}>
              {commentCount ? (
                <Tooltip text={`${commentCount} non-review comments`} direction="w">
                  <PrimerLink href={data.url} className={css.commentCountLink}>
                    <CommentIcon />
                    {commentCount}
                  </PrimerLink>
                </Tooltip>
              ) : null}
              {sortedReviews.map(review => {
                if (
                  review.reviewer.isBot &&
                  !review.blockingCommentCount &&
                  review.state === ReviewState.Commented
                ) {
                  return null;
                }

                return <ReviewAvatar {...review} key={review.reviewer.username} />;
              })}
            </div>
          );
        },
      },
    ];
  }, [defaultRepository, hideBranchNames, hideNumbers]);

  return (
    <Table.Container>
      <Table.Title as="h2" id="repositories">
        {props.name}
      </Table.Title>
      <Table.Subtitle id="repositories-subtitle">
        {props.description && (
          <Text as="p" className={css.subtitleText}>
            {props.description}
          </Text>
        )}
        {props.subtitle}
      </Table.Subtitle>

      <Table.Actions>
        <ActionMenuIconButton icon={KebabHorizontalIcon} aria-label="More Actions">
          <ActionMenu.Overlay width="auto">
            <ActionList>{props.actions}</ActionList>
          </ActionMenu.Overlay>
        </ActionMenuIconButton>
      </Table.Actions>
      {!props.loaded ? (
        <Table.Skeleton
          aria-labelledby="repositories"
          aria-describedby="repositories-subtitle"
          columns={COLUMNS}
          rows={10}
        />
      ) : props.error ? (
        <Flash variant="danger">{String(props.error)}</Flash>
      ) : (
        <>
          {totalCount > 0 ? (
            <DataTable
              aria-labelledby="repositories"
              aria-describedby="repositories-subtitle"
              data={issues as IssueListItem[]}
              columns={COLUMNS}
            />
          ) : (
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Header>Results</Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>
                    <Table.CellPlaceholder>Empty</Table.CellPlaceholder>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          )}
          {totalCount > countPerPage && (
            <Table.Pagination
              aria-label={`Pagination for ${props.name}`}
              totalCount={totalCount}
              pageSize={countPerPage}
              onChange={paginationState => props.onPageChange(paginationState.pageIndex)}
            />
          )}
        </>
      )}
    </Table.Container>
  );
}
