import { Box, Button, Dialog, FormControl, Text, Textarea, TextInput } from '@primer/react';
import type { MakeNonNullish } from '@sequelize/utils';
import { EMPTY_ARRAY, inspect } from '@sequelize/utils';
import { useCallback, useId, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from 'urql';
import {
  PrAuthorStyle,
  useAppConfiguration,
  type GitHubSearchConfiguration,
} from './app-configuration.tsx';
import { DeletionConfirmationDialog } from './deletion-confirmation-dialog.tsx';
import { getGitHubInlineUser } from './github-inline-user.tsx';
import { GithubIssueIcon } from './github-issue-icon.tsx';
import {
  CheckConclusionState,
  PullRequestReviewState,
  StatusState,
  type SearchIssuesAndPullRequestsQuery,
} from './gql/graphql.ts';
import { graphql } from './gql/index.ts';
import type { InlineUserProps } from './inline-user.js';
import { CheckStatus, IssueList, type FailedCheck, type IssueListItem } from './issue-list.tsx';
import { InlineCode, P } from './markdown-components.tsx';
import type { ReviewAvatarProps } from './review-avatar.tsx';
import { ReviewState } from './review-state-icon.tsx';
import { isLoadedUrql } from './urql/urql.utils.ts';
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
        ... on Assignable {
          assignees(first: 100) {
            nodes {
              ...InlineUser
            }
          }
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
        ... on RepositoryNode {
          repository {
            url
            nameWithOwner
          }
        }
        ... on PullRequest {
          id
          prState: state
          title
          headRefName
          isReadByViewer
          url
          number
          mergedAt
          autoMergeRequest {
            enabledAt
            enabledBy {
              ...InlineUser
            }
          }
          comments(first: 1) {
            totalCount
          }
          reviewThreads(first: 100) {
            nodes {
              isCollapsed
              comments(first: 1) {
                nodes {
                  author {
                    login
                  }
                }
              }
            }
          }
          statusCheckRollup {
            state
            contexts(first: 100) {
              nodes {
                __typename
                ... on CheckRun {
                  conclusion
                  name
                  detailsUrl
                }
              }
            }
          }
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
                ...InlineUser
              }
            }
          }
          # Used to display reviews that block/approve
          latestOpinionatedReviews(first: 10, writersOnly: true) {
            nodes {
              author {
                login
                ...InlineUser
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
                ...InlineUser
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
                ...InlineUser
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
          comments(first: 1) {
            totalCount
          }
        }
        ...IssueIcon
      }
    }
  }
`);

type SearchResult = MakeNonNullish<
  MakeNonNullish<SearchIssuesAndPullRequestsQuery['search']['nodes']>[number]
>;

export interface IssueListProps {
  list: GitHubSearchConfiguration;
  onDelete(this: void): void;
  onUpdate(this: void, list: GitHubSearchConfiguration): void;
}

export function GithubIssueList({ list, onDelete, onUpdate }: IssueListProps) {
  const [appConfiguration] = useAppConfiguration();

  const countPerPage = list.countPerPage;
  const [page, setPage] = useState(0);

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

  const error = urqlSearch.error;
  const nodes = (urqlSearch.data?.search.nodes ?? []) as SearchResult[];
  const totalCount = urqlSearch.data?.search.issueCount ?? 0;

  const [openModalId, setOpenModalId] = useState<'edit' | 'delete' | ''>('');

  const closeModal = useCallback(() => {
    setOpenModalId('');
  }, []);

  const issues: IssueListItem[] = useMemo(() => {
    return nodes.map(node => {
      if (node.__typename !== 'PullRequest' && node.__typename !== 'Issue') {
        throw new Error('Unexpected data returned by graphql search endpoint');
      }

      const reviews = new Map<string, ReviewAvatarProps>();

      if (node.__typename === 'PullRequest') {
        const pendingReview = node.pendingReviews?.nodes?.[0];
        const requestedReviews = node.reviewRequests?.nodes ?? EMPTY_ARRAY;

        if (node.latestOpinionatedReviews?.nodes) {
          for (const review of node.latestOpinionatedReviews.nodes) {
            if (!review?.author || review.state === PullRequestReviewState.Dismissed) {
              continue;
            }

            const author = review.author;

            reviews.set(author.login, {
              reviewer: getGitHubInlineUser(author),
              state: mapGitHubReviewState(review.state),
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

        const commentReviews = node.commentReviews?.nodes;
        if (commentReviews) {
          for (const review of commentReviews) {
            if (!review?.author || review.state === PullRequestReviewState.Dismissed) {
              continue;
            }

            if (!review.authorCanPushToRepository) {
              continue;
            }

            const reviewer = review.author;

            if (reviews.has(reviewer.login)) {
              continue;
            }

            reviews.set(reviewer.login, {
              reviewer: getGitHubInlineUser(reviewer),
              state: mapGitHubReviewState(review.state),
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

          if (reviews.has(reviewer.login)) {
            continue;
          }

          reviews.set(reviewer.login, {
            reviewer: getGitHubInlineUser(reviewer),
            state: null,
            pending: pendingReview?.author?.login === reviewer.login,
            requested: true,
          });
        }

        const pendingReviewAuthor = pendingReview?.author;
        if (pendingReviewAuthor && !reviews.has(pendingReviewAuthor.login)) {
          reviews.set(pendingReviewAuthor.login, {
            reviewer: getGitHubInlineUser(pendingReviewAuthor),
            state: null,
            pending: true,
            requested: false,
          });
        }

        const reviewThreads = node.reviewThreads.nodes;
        if (reviewThreads?.length) {
          for (const reviewThread of reviewThreads) {
            if (!reviewThread || reviewThread.isCollapsed) {
              continue;
            }

            const threadAuthor = reviewThread.comments.nodes?.[0]?.author?.login;
            if (!threadAuthor) {
              continue;
            }

            const review = reviews.get(threadAuthor);
            if (!review) {
              continue;
            }

            review.blockingCommentCount ??= 0;
            review.blockingCommentCount++;
          }
        }
      }

      const failedChecks: FailedCheck[] = [];
      const hasChecks = Boolean(
        node.__typename === 'PullRequest' && node.statusCheckRollup?.contexts.nodes?.length,
      );

      let hasPendingChecks = false;
      if (node.__typename === 'PullRequest' && node.statusCheckRollup?.contexts.nodes) {
        const checks = node.statusCheckRollup.contexts.nodes;

        for (const check of checks) {
          if (!check) {
            continue;
          }

          if (check.__typename !== 'CheckRun') {
            console.error(`Unknown check type ${check.__typename}`);
            continue;
          }

          if (!check.conclusion) {
            hasPendingChecks = true;
          }

          if (
            check.conclusion === CheckConclusionState.Failure ||
            check.conclusion === CheckConclusionState.TimedOut ||
            check.conclusion === CheckConclusionState.StartupFailure
          ) {
            failedChecks.push({
              name: check.name,
              url: check.detailsUrl,
            });
          }
        }
      }

      let authors: InlineUserProps[];

      if (
        node.__typename !== 'PullRequest' ||
        !node.assignees.nodes?.length ||
        appConfiguration.prAuthorStyle === PrAuthorStyle.creator
      ) {
        authors = [getGitHubInlineUser(node.author!)];
      } else if (appConfiguration.prAuthorStyle === PrAuthorStyle.assignees) {
        authors = node.assignees.nodes.map(getGitHubInlineUser);
      } else {
        const creator = getGitHubInlineUser(node.author!);
        authors = node.assignees.nodes.map(getGitHubInlineUser);

        if (!authors.some(author => author.username === creator.username)) {
          authors.push(creator);
        }
      }

      return {
        authors,
        autoMerge:
          node.__typename === 'PullRequest' && node.autoMergeRequest && !node.mergedAt
            ? {
                by: getGitHubInlineUser(node.autoMergeRequest.enabledBy!),
                at: node.autoMergeRequest.enabledAt,
              }
            : undefined,
        branchName: node.__typename === 'PullRequest' ? node.headRefName : undefined,
        checkStatus:
          node.__typename !== 'PullRequest' || !node.statusCheckRollup?.state || !hasChecks
            ? undefined
            : node.statusCheckRollup.state === StatusState.Pending ||
                node.statusCheckRollup.state === StatusState.Expected ||
                hasPendingChecks
              ? CheckStatus.pending
              : failedChecks.length === 0
                ? CheckStatus.success
                : CheckStatus.failure,
        commentCount: node.comments.totalCount,
        createdAt: node.createdAt,
        failedChecks,
        icon: <GithubIssueIcon issue={node} sx={{ marginTop: 1 }} />,
        id: node.id,
        labels: node.labels!.nodes!.map(label => {
          return {
            name: label!.name,
            hexColor: `#${label!.color}`,
          };
        }),
        mergedAt: node.__typename === 'PullRequest' ? node.mergedAt : undefined,
        number: `#${node.number}`,
        repository: {
          name: node.repository.nameWithOwner,
          url: node.repository.url,
        },
        reviews: [...reviews.values()],
        title: node.title,
        unread: !node.isReadByViewer,
        url: node.url,
      };
    });
  }, [appConfiguration.prAuthorStyle, nodes]);

  return (
    <>
      <IssueList
        countPerPage={countPerPage}
        error={error}
        totalCount={totalCount}
        loaded={isLoadedUrql(urqlSearch)}
        onOpenModal={setOpenModalId}
        onPageChange={setPage}
        name={list.name}
        issues={issues}
        description={list.description}
        subtitle={
          <Text as="p" sx={{ margin: 0 }}>
            <InlineCode>{list.query}</InlineCode>
          </Text>
        }
      />
      {openModalId === 'delete' ? (
        <DeleteListDialog onClose={closeModal} onDelete={onDelete} list={list} />
      ) : openModalId === 'edit' ? (
        <EditListDialog onClose={closeModal} onUpdate={onUpdate} list={list} />
      ) : null}
    </>
  );
}

function mapGitHubReviewState(state: PullRequestReviewState): ReviewState {
  switch (state) {
    case PullRequestReviewState.Approved:
      return ReviewState.Approved;

    case PullRequestReviewState.ChangesRequested:
      return ReviewState.ChangesRequested;

    case PullRequestReviewState.Commented:
      return ReviewState.Commented;

    case PullRequestReviewState.Pending:
      return ReviewState.Pending;

    case PullRequestReviewState.Dismissed:
      throw new Error('Unsupported state');
  }
}

interface DeleteListDialogProps {
  list: GitHubSearchConfiguration;
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
  list: GitHubSearchConfiguration;
  onClose(this: void): void;
  onUpdate(this: void, list: GitHubSearchConfiguration): void;
}

function EditListDialog({ list, onClose, onUpdate }: EditListDialogProps) {
  const headerId = useId();

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const data = getFormValues(event.currentTarget);

      onUpdate(data as GitHubSearchConfiguration);
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
