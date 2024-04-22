import { KebabHorizontalIcon, PencilIcon, TrashIcon } from '@primer/octicons-react';
import {
  ActionList,
  ActionMenu,
  Box,
  Button,
  Dialog,
  Flash,
  FormControl,
  LabelGroup,
  Link as PrimerLink,
  RelativeTime,
  Text,
  TextInput,
  Textarea,
} from '@primer/react';
import type { Column } from '@primer/react/drafts';
import { DataTable, Table } from '@primer/react/drafts';
import type { MakeNonNullish } from '@sequelize/utils';
import { EMPTY_ARRAY, basicComparator, inspect } from '@sequelize/utils';
import type { FormEvent } from 'react';
import { useCallback, useId, useMemo, useState } from 'react';
import { useQuery } from 'urql';
import { ActionMenuIconButton } from './action-menu-icon-button.tsx';
import type { SearchConfiguration } from './app-configuration.tsx';
import { DeletionConfirmationDialog } from './deletion-confirmation-dialog.tsx';
import type { SearchIssuesAndPullRequestsQuery } from './gql/graphql.ts';
import { PullRequestReviewState } from './gql/graphql.ts';
import { graphql } from './gql/index.ts';
import { InlineUser } from './inline-user.tsx';
import { IssueIcon } from './issue-icon.tsx';
import { IssueLabel } from './issue-label.tsx';
import css from './issue-list.module.scss';
import { InlineCode, P } from './markdown-components.tsx';
import { Markdown } from './markdown.tsx';
import type { ReviewAvatarProps } from './review-avatar.tsx';
import { ReviewAvatar } from './review-avatar.tsx';
import { isLoadedUrql } from './urql/urql.utils.ts';
import { composedComparator } from './utils/composed-comparator.ts';
import { getFormValues } from './utils/get-form-values.ts';

const searchQuery = graphql(/* GraphQL */ `
  query searchIssuesAndPullRequests($query: String!, $first: Int!, $after: String!) {
    search(query: $query, type: ISSUE, first: $first, after: $after) {
      issueCount
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        ... on Node {
          id
        }
        ... on Comment {
          author {
            ...InlineUser
          }
          createdAt
        }
        ... on Labelable {
          labels(first: 100) {
            nodes {
              id
              name
              color
            }
          }
        }
        ... on PullRequest {
          id
          prState: state
          title
          isReadByViewer
          url
          number
          # Used to display users that have been requested for review,
          reviewRequests(first: 10) {
            nodes {
              requestedReviewer {
                ... on User {
                  login
                }
                ... on Bot {
                  login
                }
                ...ReviewAvatarUser
              }
            }
          }
          # Used to display reviews that block/approve
          latestOpinionatedReviews(first: 10, writersOnly: true) {
            nodes {
              author {
                login
                ...ReviewAvatarUser
              }
              state
            }
          }
          # Used to display whether the viewer has a review in progress
          # Only visible to the viewer
          pendingReviews: reviews(states: [PENDING], first: 1) {
            nodes {
              author {
                login
                ...ReviewAvatarUser
              }
              state
            }
          }
          # We load these to be able to display whether someone commented (i.e. a review that does not request changes nor approve)
          # We have to load latestOpinionatedReviews on top of this, because comment reviews shadow opinionated reviews
          commentReviews: latestReviews(first: 10) {
            nodes {
              authorCanPushToRepository
              author {
                login
                ...ReviewAvatarUser
              }
              state
            }
          }
        }
        ... on Issue {
          id
          isReadByViewer
          issueState: state
          issueStateReason: stateReason
          title
          url
          number
        }
        ...IssueIcon
      }
    }
  }
`);

type SearchResult = MakeNonNullish<
  MakeNonNullish<SearchIssuesAndPullRequestsQuery['search']['nodes']>[number]
>;

const columns: Array<Column<SearchResult>> = [
  {
    header: 'Results',
    id: 'main',
    width: 'auto',
    renderCell: data => {
      if (data.__typename !== 'PullRequest' && data.__typename !== 'Issue') {
        throw new Error('Unexpected data returned by graphql search endpoint');
      }

      const labels = data.labels?.nodes;

      return (
        <Box
          sx={{ display: 'flex', alignItems: 'start' }}
          data-unread={String(!data.isReadByViewer)}>
          <IssueIcon issue={data} sx={{ marginTop: 1 }} />
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
              #{data.number} opened
              {/* @ts-expect-error -- RelativeTime is badly typed */}
              <RelativeTime datetime={data.createdAt} /> by <InlineUser user={data.author!} />
            </Text>
            {Boolean(labels?.length) && (
              <LabelGroup sx={{ mt: 1 }}>
                {labels!.map(label => (
                  <IssueLabel key={label!.id} hexColor={`#${label!.color}`} name={label!.name} />
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
      if (data.__typename !== 'PullRequest') {
        return null;
      }

      const reviews: Array<ReviewAvatarProps & { key: string }> = [];

      const pendingReview = data.pendingReviews?.nodes?.[0];
      const requestedReviews = data.reviewRequests?.nodes ?? EMPTY_ARRAY;

      if (data.latestOpinionatedReviews?.nodes) {
        for (const review of data.latestOpinionatedReviews.nodes) {
          if (!review?.author || review.state === PullRequestReviewState.Dismissed) {
            continue;
          }

          const author = review.author;

          reviews.push({
            key: author.login,
            reviewer: author,
            state: review.state,
            pending: pendingReview?.author?.login === author.login,
            requested: requestedReviews.some(requestedReview => {
              const requestedReviewer = requestedReview?.requestedReviewer;

              return (
                requestedReviewer &&
                'login' in requestedReviewer &&
                requestedReviewer.login === author.login
              );
            }),
          });
        }
      }

      const commentReviews = data.commentReviews?.nodes;
      if (commentReviews) {
        for (const review of commentReviews) {
          if (!review?.author || review.state === PullRequestReviewState.Dismissed) {
            continue;
          }

          if (!review.authorCanPushToRepository) {
            continue;
          }

          const reviewer = review.author;

          if (reviews.some(existingReview => reviewer.login === existingReview.key)) {
            continue;
          }

          reviews.push({
            key: reviewer.login,
            reviewer,
            state: review.state,
            pending: pendingReview?.author?.login === reviewer.login,
            requested: requestedReviews.some(requestedReview => {
              const requestedReviewer = requestedReview?.requestedReviewer;

              return (
                requestedReviewer &&
                'login' in requestedReviewer &&
                requestedReviewer.login === reviewer.login
              );
            }),
          });
        }
      }

      for (const requestedReview of requestedReviews) {
        const reviewer = requestedReview?.requestedReviewer;
        if (!reviewer || !('login' in reviewer)) {
          continue;
        }

        if (reviews.some(review => review.key === reviewer.login)) {
          continue;
        }

        reviews.push({
          key: reviewer.login,
          reviewer,
          state: null,
          pending: pendingReview?.author?.login === reviewer.login,
          requested: true,
        });
      }

      if (pendingReview && !reviews.some(review => review.key === pendingReview.author!.login)) {
        reviews.push({
          key: pendingReview.author!.login,
          reviewer: pendingReview.author!,
          state: null,
          pending: true,
          requested: false,
        });
      }

      const stringCompareFn = basicComparator();
      reviews.sort(
        composedComparator(
          (a, b) => stringCompareFn(a.state, b.state),
          (a, b) => stringCompareFn(a.key, b.key),
        ),
      );

      if (!reviews.length) {
        return;
      }

      return (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {reviews.map(review => {
            return <ReviewAvatar {...review} key={review.key} />;
          })}
        </Box>
      );
    },
  },
];

export interface IssueListProps {
  list: SearchConfiguration;
  onDelete(this: void): void;
  onUpdate(this: void, list: SearchConfiguration): void;
}

export function IssueList({ list, onDelete, onUpdate }: IssueListProps) {
  const countPerPage = list.countPerPage;
  const [page, setPage] = useState(0);
  const [openModalId, setOpenModalId] = useState<'edit' | 'delete' | ''>('');

  const after = useMemo(() => {
    return page > 0 ? btoa(`cursor:${page * countPerPage}`) : '';
  }, [page, countPerPage]);

  const [urqlSearch] = useQuery({
    query: searchQuery,
    variables: {
      query: list.query,
      first: countPerPage,
      after,
    },
  });

  const nodes = (urqlSearch.data?.search.nodes ?? []) as SearchResult[];

  const onPageChange = useCallback((data: { pageIndex: number }) => {
    setPage(data.pageIndex);
  }, []);

  const closeModal = useCallback(() => {
    setOpenModalId('');
  }, []);

  return (
    <Table.Container>
      <Table.Title as="h2" id="repositories">
        {list.name}
      </Table.Title>
      <Table.Subtitle id="repositories-subtitle">
        {list.description && (
          <Text as="p" sx={{ margin: 0 }}>
            {list.description}
          </Text>
        )}
        <Text as="p" sx={{ margin: 0 }}>
          <InlineCode>{list.query}</InlineCode>
        </Text>
      </Table.Subtitle>

      <Table.Actions>
        <ActionMenuIconButton icon={KebabHorizontalIcon} aria-label="More Actions">
          <ActionMenu.Overlay width="auto">
            <ActionList>
              <ActionList.Item onClick={() => setOpenModalId('edit')}>
                Edit
                <ActionList.LeadingVisual>
                  <PencilIcon />
                </ActionList.LeadingVisual>
              </ActionList.Item>
              <ActionList.Item onSelect={() => setOpenModalId('delete')} variant="danger">
                Delete List
                <ActionList.LeadingVisual>
                  <TrashIcon />
                </ActionList.LeadingVisual>
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenuIconButton>
      </Table.Actions>
      {!isLoadedUrql(urqlSearch) ? (
        <Table.Skeleton
          aria-labelledby="repositories"
          aria-describedby="repositories-subtitle"
          columns={columns}
          rows={10}
        />
      ) : urqlSearch.error ? (
        <Flash variant="danger">Failed to load content</Flash>
      ) : (
        <>
          {urqlSearch.data.search.issueCount > 0 ? (
            <DataTable
              aria-labelledby="repositories"
              aria-describedby="repositories-subtitle"
              data={nodes}
              columns={columns}
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
          {urqlSearch.data.search.issueCount > countPerPage && (
            <Table.Pagination
              aria-label={`Pagination for ${list.name}`}
              totalCount={urqlSearch.data.search.issueCount}
              pageSize={countPerPage}
              onChange={onPageChange}
            />
          )}
        </>
      )}
      {openModalId === 'delete' ? (
        <DeleteListDialog onClose={closeModal} onDelete={onDelete} list={list} />
      ) : openModalId === 'edit' ? (
        <EditListDialog onClose={closeModal} onUpdate={onUpdate} list={list} />
      ) : null}
    </Table.Container>
  );
}

interface DeleteListDialogProps {
  list: SearchConfiguration;
  onClose(this: void): void;
  onDelete(this: void): void;
}

function DeleteListDialog({ list, onClose, onDelete: propsOnDelete }: DeleteListDialogProps) {
  const onDelete = useCallback(() => {
    propsOnDelete();
    onClose();
  }, [propsOnDelete, onClose]);

  return (
    <DeletionConfirmationDialog
      onDelete={onDelete}
      onCancel={onClose}
      title="Delete List?"
      text={
        <P>You are about to delete the {inspect(list.name)} list. This action cannot be undone.</P>
      }
    />
  );
}

interface EditListDialogProps {
  list: SearchConfiguration;
  onClose(this: void): void;
  onUpdate(this: void, list: SearchConfiguration): void;
}

function EditListDialog({ list, onClose, onUpdate }: EditListDialogProps) {
  const headerId = useId();

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const data = getFormValues(event.currentTarget);

      onUpdate(data as SearchConfiguration);
      onClose();
    },
    [onClose, onUpdate],
  );

  return (
    <Dialog isOpen onDismiss={onClose} aria-labelledby={headerId}>
      <Dialog.Header id={headerId}>Edit List</Dialog.Header>
      <Box p={3} as="form" onSubmit={onSubmit}>
        <FormControl required>
          <FormControl.Label>Name</FormControl.Label>
          <TextInput block type="text" name="name" defaultValue={list.name} />
        </FormControl>

        <FormControl required sx={{ marginTop: 2 }}>
          <FormControl.Label>Description</FormControl.Label>
          <TextInput block type="text" name="description" defaultValue={list.description} />
        </FormControl>

        <FormControl required sx={{ marginTop: 2 }}>
          <FormControl.Label>Query</FormControl.Label>
          <Textarea block name="query" defaultValue={list.query} />
        </FormControl>

        <FormControl required sx={{ marginTop: 2 }}>
          <FormControl.Label>Results per page</FormControl.Label>
          <TextInput
            block
            type="number"
            step="1"
            name="countPerPage"
            defaultValue={list.countPerPage}
            min="1"
          />
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, marginTop: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
