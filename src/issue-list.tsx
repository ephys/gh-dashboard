import { KebabHorizontalIcon, PencilIcon, TrashIcon } from '@primer/octicons-react';
import {
  ActionList,
  ActionMenu,
  Box,
  Flash,
  LabelGroup,
  Link as PrimerLink,
  RelativeTime,
  Text,
} from '@primer/react';
import { DataTable, Table, type Column } from '@primer/react/drafts';
import { basicComparator } from '@sequelize/utils';
import type { ReactNode } from 'react';
import { ActionMenuIconButton } from './action-menu-icon-button.tsx';
import css from './github-issue-list.module.scss';
import type { InlineUserProps } from './inline-user.tsx';
import { InlineUser } from './inline-user.tsx';
import type { IssueLabelProps } from './issue-label.tsx';
import { IssueLabel } from './issue-label.tsx';
import { P } from './markdown-components.tsx';
import { Markdown } from './markdown.tsx';
import type { ReviewAvatarProps } from './review-avatar.tsx';
import { ReviewAvatar } from './review-avatar.tsx';
import { composedComparator } from './utils/composed-comparator.ts';

export interface IssueListItem {
  createdAt: string;
  createdBy: InlineUserProps;
  icon: ReactNode;
  id: string;
  labels: IssueLabelProps[];
  number: string;
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
      const labels = data.labels;

      return (
        <Box sx={{ display: 'flex', alignItems: 'start' }} data-unread={String(data.unread)}>
          {data.icon}
          <Box sx={{ marginLeft: 2 }}>
            <Text as="div" sx={{ fontSize: 'var(--text-body-size-large)' }}>
              <PrimerLink href={data.url} className={css.titleLink}>
                <Markdown>{data.title}</Markdown>
              </PrimerLink>
            </Text>
            <Text
              as={P}
              sx={{
                color: 'fg.muted',
                fontSize: 'var(--text-body-size-small)',
                fontWeight: 'var(--base-text-weight-normal)',
              }}>
              {data.number} opened {/* @ts-expect-error -- RelativeTime is badly typed */}
              <RelativeTime datetime={data.createdAt} /> by <InlineUser {...data.createdBy} />
            </Text>
            {Boolean(labels.length) && (
              <LabelGroup sx={{ mt: 1 }}>
                {labels.map(label => (
                  <IssueLabel {...label} key={label.name} />
                ))}
              </LabelGroup>
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

      const stringCompareFn = basicComparator();
      const sortedReviews = reviews.toSorted(
        composedComparator(
          (a, b) => stringCompareFn(a.state, b.state),
          (a, b) => stringCompareFn(a.reviewer.username, b.reviewer.username),
        ),
      );

      if (!reviews.length) {
        return;
      }

      return (
        <Box sx={{ display: 'flex', gap: 2 }}>
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
