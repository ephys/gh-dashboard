import {
  CommentIcon,
  KebabHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from '@primer/octicons-react';
import {
  ActionList,
  ActionMenu,
  Box,
  Flash,
  LabelGroup,
  Octicon,
  Link as PrimerLink,
  RelativeTime,
  Text,
  Tooltip,
} from '@primer/react';
import { DataTable, Table, type Column } from '@primer/react/drafts';
import { basicComparator } from '@sequelize/utils';
import type { ReactNode } from 'react';
import { ActionMenuIconButton } from './action-menu-icon-button.tsx';
import { UserNameStyle } from './app-configuration.js';
import { BranchButton } from './branch-button.js';
import { formatUserName } from './format-user-name.js';
import css from './github-issue-list.module.scss';
import type { InlineUserProps } from './inline-user.tsx';
import { InlineUser } from './inline-user.tsx';
import type { IssueLabelProps } from './issue-label.tsx';
import { IssueLabel } from './issue-label.tsx';
import { P } from './markdown-components.tsx';
import { Markdown } from './markdown.tsx';
import { PendingReviewIcon } from './pending-review-icon.js';
import type { ReviewAvatarProps } from './review-avatar.tsx';
import { ReviewAvatar } from './review-avatar.tsx';
import { ReviewState, ReviewStateIcon } from './review-state-icon.js';
import { composedComparator } from './utils/composed-comparator.ts';
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
}

const COLUMNS: Array<Column<IssueListItem>> = [
  {
    header: 'Results',
    id: 'main',
    width: 'auto',
    renderCell: data => {
      const { labels, failedChecks } = data;

      return (
        <Box sx={{ display: 'flex', alignItems: 'start' }} data-unread={String(data.unread)}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '6px',
            }}>
            {data.icon}
            {data.checkStatus === CheckStatus.failure ? (
              <Tooltip text="Some checks failed" direction="ne">
                <ReviewStateIcon state={ReviewState.ChangesRequested} />
              </Tooltip>
            ) : data.checkStatus === CheckStatus.success ? (
              <Tooltip text="All checks passed" direction="ne">
                <ReviewStateIcon state={ReviewState.Approved} />
              </Tooltip>
            ) : data.checkStatus === CheckStatus.pending ? (
              <Tooltip text="Checks are running" direction="ne">
                <Box sx={{ height: '16px', alignItems: 'center', display: 'flex' }}>
                  <PendingReviewIcon inProgress={false} />
                </Box>
              </Tooltip>
            ) : null}
          </Box>

          <Box sx={{ marginLeft: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Text as="div" sx={{ fontSize: 'var(--text-body-size-large)' }}>
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
                  <Text
                    as="p"
                    sx={{
                      margin: 0,
                      borderColor: 'done.fg',
                      borderStyle: 'solid',
                      borderWidth: 1,
                      color: 'done.fg',
                      borderRadius: 1,
                      padding: '0 4px',
                      wordBreak: 'keep-all',
                    }}>
                    Auto-merge
                  </Text>
                </Tooltip>
              )}
            </Box>
            <Text
              as={P}
              sx={{
                color: 'fg.muted',
                fontSize: 'var(--text-body-size-small)',
                fontWeight: 'var(--base-text-weight-normal)',
              }}>
              <span>
                {data.repository && (
                  <>
                    <PrimerLink href={data.repository.url} className={css.titleLink}>
                      {data.repository.name}
                    </PrimerLink>{' '}
                  </>
                )}
                {data.number}
              </span>{' '}
              {data.branchName && (
                <>
                  <BranchButton>{data.branchName}</BranchButton>{' '}
                </>
              )}
              opened {/* @ts-expect-error -- RelativeTime is badly typed */}
              <RelativeTime datetime={data.createdAt} /> by{' '}
              {intersperse(
                data.authors.map(author => <InlineUser key={author.username} {...author} />),
                ', ',
              )}
            </Text>
            {Boolean(labels.length) && (
              <LabelGroup sx={{ mt: 1 }}>
                {labels.map(label => (
                  <IssueLabel {...label} key={label.name} />
                ))}
              </LabelGroup>
            )}
            {Boolean(failedChecks?.length) && (
              <Box sx={{ mt: 2, alignItems: 'center', display: 'flex' }}>
                <Octicon icon={XIcon} sx={{ color: 'danger.emphasis' }} />{' '}
                <span>
                  {intersperse(
                    failedChecks!.map((check, i) => (
                      <PrimerLink key={i} href={check.url} className={css.titleLink}>
                        {check.name}
                      </PrimerLink>
                    )),
                    ', ',
                  )}
                </span>
              </Box>
            )}
          </Box>
        </Box>
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {commentCount ? (
            <Tooltip text={`${commentCount} non-review comments`}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'fg.muted',
                  marginRight: 2,
                }}>
                <Octicon icon={CommentIcon} />
                {commentCount}
              </Box>
            </Tooltip>
          ) : null}
          {sortedReviews.map(review => {
            return <ReviewAvatar {...review} key={review.reviewer.username} />;
          })}
        </Box>
      );
    },
  },
];

interface IssueListProps {
  countPerPage: number;
  description: ReactNode;
  error: unknown;
  issues: readonly IssueListItem[];
  loaded: boolean;
  name: ReactNode;

  onOpenModal(this: void, id: 'edit' | 'delete'): void;

  onPageChange(pageIndex: number): void;

  subtitle?: ReactNode;
  totalCount: number;
}

export function IssueList(props: IssueListProps) {
  const { onOpenModal, totalCount, countPerPage, issues } = props;

  return (
    <Table.Container>
      <Table.Title as="h2" id="repositories">
        {props.name}
      </Table.Title>
      <Table.Subtitle id="repositories-subtitle">
        {props.description && (
          <Text as="p" sx={{ margin: 0 }}>
            {props.description}
          </Text>
        )}
        {props.subtitle}
      </Table.Subtitle>

      <Table.Actions>
        <ActionMenuIconButton icon={KebabHorizontalIcon} aria-label="More Actions">
          <ActionMenu.Overlay width="auto">
            <ActionList>
              <ActionList.Item onClick={() => onOpenModal('edit')}>
                Edit
                <ActionList.LeadingVisual>
                  <PencilIcon />
                </ActionList.LeadingVisual>
              </ActionList.Item>
              <ActionList.Item onSelect={() => onOpenModal('delete')} variant="danger">
                Delete List
                <ActionList.LeadingVisual>
                  <TrashIcon />
                </ActionList.LeadingVisual>
              </ActionList.Item>
            </ActionList>
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
        <Flash variant="danger">Failed to load content</Flash>
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
