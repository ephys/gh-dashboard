import { Text } from '@primer/react';
import type { MakeNonNullish } from '@sequelize/utils';
import { EMPTY_ARRAY, isNotNullish } from '@sequelize/utils';
import { type ReactNode, useMemo, useState } from 'react';
import { useQuery } from 'urql';
import {
  type GitHubSearchConfiguration,
  PrAuthorStyle,
  useAppConfiguration,
} from './app-configuration.tsx';
import { getGitHubInlineUser } from './github-inline-user.tsx';
import { GithubIssueIcon } from './github-issue-icon.tsx';
import css from './github-issue-list.module.scss';
import {
  CheckConclusionState,
  PullRequestReviewState,
  type SearchIssuesAndPullRequestsQuery,
  StatusState,
} from './gql/graphql.ts';
import { graphql } from './gql/index.ts';
import type { InlineUserProps } from './inline-user.js';
import { CheckStatus, type FailedCheck, IssueList, type IssueListItem } from './issue-list.tsx';
import { InlineCode } from './markdown-components.js';
import type { ReviewAvatarProps } from './review-avatar.tsx';
import { ReviewState } from './review-state-icon.tsx';
import { isLoadedUrql } from './urql/urql.utils.js';

const searchQuery = graphql(/* GraphQL */ `
  query searchIssuesAndPullRequests($query: String!, $first: Int!, $after: String!) {
    viewer {
      id
      login
    }
    search(query: $query, type: ISSUE_ADVANCED, first: $first, after: $after) {
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
            defaultBranchRef {
              name
            }
          }
        }
        ... on PullRequest {
          viewerDidAuthor
          id
          isDraft
          prState: state
          title
          baseRefName
          headRefName
          headRepository {
            nameWithOwner
          }
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
                    ...InlineUser
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
              asCodeOwner
              requestedReviewer {
                ... on User {
                  id
                  login
                }
                ... on Bot {
                  id
                  login
                }
                ...InlineUser
              }
            }
          }
          timelineItems(
            itemTypes: [
              REVIEW_REQUESTED_EVENT
              REVIEW_REQUEST_REMOVED_EVENT
              READY_FOR_REVIEW_EVENT
            ]
            last: 100
          ) {
            nodes {
              ... on ReadyForReviewEvent {
                createdAt
              }
              ... on ReviewRequestedEvent {
                createdAt
                requestedReviewer {
                  ... on User {
                    id
                    login
                  }
                  ... on Team {
                    id
                  }
                }
              }
              ... on ReviewRequestRemovedEvent {
                createdAt
                requestedReviewer {
                  ... on Team {
                    id
                  }
                }
              }
            }
          }
          viewerLatestReviewRequest {
            asCodeOwner
            requestedReviewer {
              ... on User {
                id
              }
              ... on Team {
                id
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

type PullRequestNode = Extract<SearchResult, { __typename?: 'PullRequest' }>;
type PullRequestTimelineNode = MakeNonNullish<
  MakeNonNullish<PullRequestNode['timelineItems']['nodes']>[number]
>;

export interface IssueListProps {
  actions?: ReactNode;
  list: GitHubSearchConfiguration;
}

export function GithubIssueList({ list, actions }: IssueListProps) {
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

  const error = urqlSearch.error?.graphQLErrors[0];
  const viewerId = urqlSearch.data?.viewer.id;
  const viewerLogin = urqlSearch.data?.viewer.login;
  const nodes = (urqlSearch.data?.search.nodes ?? []) as SearchResult[];
  const totalCount = urqlSearch.data?.search.issueCount ?? 0;

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

            if (
              // This is a proxy for knowing whether the author's reviews have an impact
              !review.authorCanPushToRepository &&
              // bots typically cannot push to repository
              review.author.__typename !== 'Bot'
            ) {
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

            const threadAuthor = reviewThread.comments.nodes?.[0]?.author;
            if (!threadAuthor || threadAuthor.login === node.author?.login) {
              continue;
            }

            let review = reviews.get(threadAuthor.login);
            if (!review) {
              review = {
                reviewer: getGitHubInlineUser(threadAuthor),
                state: ReviewState.Commented,
                pending: false,
                requested: false,
                blockingCommentCount: 1,
              };

              // add reviewer
              reviews.set(threadAuthor.login, review);
            }

            review.state ??= ReviewState.Commented;
            review.blockingCommentCount ??= 0;
            review.blockingCommentCount++;
          }
        }
      }

      const seenCheckNames = new Set();
      const failedChecks: FailedCheck[] = [];
      const hasChecks = Boolean(
        node.__typename === 'PullRequest' && node.statusCheckRollup?.contexts.nodes?.length,
      );

      let hasPendingChecks = false;
      if (node.__typename === 'PullRequest' && node.statusCheckRollup?.contexts.nodes) {
        const checks = node.statusCheckRollup.contexts.nodes;

        // process checks from last to first, as we only want to check the latest run of a given check.
        for (const check of checks.toReversed()) {
          if (!check) {
            continue;
          }

          if (check.__typename !== 'CheckRun') {
            console.error(`Unknown check type ${check.__typename}`);
            continue;
          }

          if (seenCheckNames.has(check.name)) {
            continue;
          }

          seenCheckNames.add(check.name);

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
        authors = node.assignees.nodes.filter(isNotNullish).map(getGitHubInlineUser);
      } else {
        const creator = getGitHubInlineUser(node.author!);
        authors = node.assignees.nodes.filter(isNotNullish).map(getGitHubInlineUser);

        if (!authors.some(author => author.username === creator.username)) {
          authors.push(creator);
        }
      }

      const viewerReview = viewerLogin != null ? reviews.get(viewerLogin) : undefined;
      let viewerReviewWaitTimes = 0;

      const timelineNodes =
        node.__typename === 'PullRequest'
          ? (node.timelineItems.nodes?.filter(isNotNullish) as PullRequestTimelineNode[])
          : [];

      // Build a set of reviewer logins that were ever requested as code owner
      const codeOwnerLogins = new Set<string>();
      if (node.__typename === 'PullRequest') {
        // Direct code-owner review requests still present
        for (const reviewRequest of node.reviewRequests?.nodes ?? []) {
          if (!reviewRequest?.asCodeOwner) continue;
          const reviewer = reviewRequest.requestedReviewer;
          if (reviewer && 'login' in reviewer) {
            codeOwnerLogins.add(reviewer.login);
          }
        }

        // Viewer's latest request may have been a code-owner request
        if (node.viewerLatestReviewRequest?.asCodeOwner && viewerLogin != null) {
          codeOwnerLogins.add(viewerLogin);
        }

        // Users assigned from a code-owner team (team request removed, user request added at same timestamp)
        const usersFromCodeOwnerTeam = getUsersRequestedFromCodeOwnerTeam(timelineNodes);
        for (const login of usersFromCodeOwnerTeam) {
          codeOwnerLogins.add(login);
        }
      }

      // Annotate reviews map with code-owner flag
      for (const [login, review] of reviews) {
        if (codeOwnerLogins.has(login)) {
          review.codeOwner = true;
        }
      }

      const wasViewerEverRequestedAsCodeOwner =
        viewerLogin != null && codeOwnerLogins.has(viewerLogin);

      if (
        (!viewerReview || viewerReview.requested) &&
        node.__typename === 'PullRequest' &&
        node.prState === 'OPEN' &&
        !node.isDraft &&
        // TODO: remove if assignee
        !node.viewerDidAuthor &&
        (node.viewerLatestReviewRequest || wasViewerEverRequestedAsCodeOwner)
      ) {
        const latestReadyForReviewEvent = timelineNodes.findLast(
          item => item.__typename === 'ReadyForReviewEvent',
        );

        if (
          latestReadyForReviewEvent &&
          latestReadyForReviewEvent.__typename !== 'ReadyForReviewEvent'
        ) {
          throw new Error('Should not happen');
        }

        // eslint-disable-next-line no-restricted-syntax -- API not yet available
        const readyForReviewAtMs = Date.parse(
          latestReadyForReviewEvent?.createdAt ?? node.createdAt,
        );

        const requestedReviewer = node.viewerLatestReviewRequest?.requestedReviewer;
        const latestReviewRequestId =
          viewerId ??
          (requestedReviewer && 'id' in requestedReviewer ? requestedReviewer.id : undefined);

        const latestReviewRequestEvent = timelineNodes.findLast(item => {
          if (item.__typename !== 'ReviewRequestedEvent') {
            return false;
          }

          const itemRequestedReviewer = item.requestedReviewer;
          if (
            !itemRequestedReviewer ||
            (itemRequestedReviewer.__typename !== 'User' &&
              itemRequestedReviewer.__typename !== 'Team')
          ) {
            return false;
          }

          return itemRequestedReviewer.id === latestReviewRequestId;
        });

        if (
          latestReviewRequestEvent &&
          latestReviewRequestEvent.__typename !== 'ReviewRequestedEvent'
        ) {
          throw new Error('Should not happen');
        }

        // eslint-disable-next-line no-restricted-syntax -- API not yet available
        const reviewRequestedAt = Date.parse(latestReviewRequestEvent?.createdAt ?? node.createdAt);

        viewerReviewWaitTimes = Date.now() - Math.min(readyForReviewAtMs, reviewRequestedAt);
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
        targetBranch:
          node.__typename === 'PullRequest' &&
          node.baseRefName !== node.repository.defaultBranchRef?.name
            ? node.baseRefName
            : undefined,
        headRepositoryName:
          node.__typename === 'PullRequest' &&
          node.headRepository &&
          node.headRepository.nameWithOwner !== node.repository.nameWithOwner
            ? node.headRepository.nameWithOwner
            : undefined,
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
        icon: <GithubIssueIcon issue={node} className={css.iconWithMargin} />,
        id: node.id,
        labels: node.labels!.nodes!.map(label => {
          return {
            name: label!.name,
            hexColor: `#${label!.color}`,
          };
        }),
        mergedAt: node.__typename === 'PullRequest' ? node.mergedAt : undefined,
        isPullRequest: node.__typename === 'PullRequest',
        number: `#${node.number}`,
        repository: {
          name: node.repository.nameWithOwner,
          url: node.repository.url,
        },
        reviews: [...reviews.values()],
        title: node.title,
        unread: !node.isReadByViewer,
        viewerReviewWaitTimes,
        url: node.url,
        checksUrl: node.__typename !== 'PullRequest' ? node.url : `${node.url}/checks`,
      };
    });
  }, [appConfiguration.prAuthorStyle, nodes, viewerId, viewerLogin]);

  return (
    <IssueList
      countPerPage={countPerPage}
      error={error}
      totalCount={totalCount}
      loaded={isLoadedUrql(urqlSearch)}
      onPageChange={setPage}
      name={list.name}
      subtitle={
        <Text as="p" style={{ margin: 0 }}>
          <InlineCode>{list.query}</InlineCode>
        </Text>
      }
      issues={issues}
      description={list.description}
      hideBranchNames={list.hideBranchNames}
      hideNumbers={list.hidePrNumbers}
      defaultRepository={list.defaultRepository}
      actions={actions}
    />
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

function getUsersRequestedFromCodeOwnerTeam(
  timelineNodes: readonly PullRequestTimelineNode[],
): Set<string> {
  // When a team is removed as a reviewer and individual users are added at the same timestamp,
  // those users were assigned from a code-owner team.
  const removedTeamReviewRequestTimes = new Set(
    timelineNodes
      .filter(
        (
          item,
        ): item is Extract<PullRequestTimelineNode, { __typename?: 'ReviewRequestRemovedEvent' }> =>
          item.__typename === 'ReviewRequestRemovedEvent',
      )
      .filter(item => item.requestedReviewer?.__typename === 'Team')
      .map(item => item.createdAt),
  );

  const codeOwnerLogins = new Set<string>();

  for (const item of timelineNodes) {
    if (item.__typename !== 'ReviewRequestedEvent') continue;
    if (!removedTeamReviewRequestTimes.has(item.createdAt)) continue;
    const requestedReviewer = item.requestedReviewer;
    if (requestedReviewer?.__typename === 'User' && 'login' in requestedReviewer) {
      codeOwnerLogins.add(requestedReviewer.login);
    }
  }

  return codeOwnerLogins;
}
