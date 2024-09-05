import { EMPTY_ARRAY } from '@sequelize/utils';
import { useEffect, useMemo, useState } from 'react';
import type { DevOpsPullRequestsConfiguration } from './app-configuration.tsx';
import { useDevOpsAvatars } from './devops-avatar-provider.tsx';
import { DevopsPrIcon } from './devops-pr-icon.tsx';
import type { IssueListItem } from './issue-list.tsx';
import { IssueList } from './issue-list.tsx';
import { ReviewState } from './review-state-icon.tsx';
import { useDevOpsPat } from './use-devops-pat.tsx';
import { getDevOpsAuthorization } from './utils/devops.ts';

interface DevOpsUser {
  _links: {
    avatar: { href: string };
  };
  descriptor: string;
  displayName: string;
  id: string;
  imageUrl: string;
  uniqueName: string;
  url: string;
}

enum DevOpsVote {
  Approved = 10,
  ApprovedWithSuggestions = 5,
  NoVote = 0,
  WaitingForAuthor = -5,
  Rejected = -10,
}

interface DevOpsReviewer extends DevOpsUser {
  hasDeclined: boolean;
  isContainer?: boolean;
  isFlagged: boolean;
  reviewerUrl: string;
  vote: DevOpsVote;
  votedFor: unknown;
}

interface DevOpsPullRequestData {
  codeReviewId: number;
  createdBy: DevOpsUser;
  creationDate: string;
  description: string;
  isDraft: false;
  pullRequestId: number;
  repository: {
    id: string;
    name: string;
    project: unknown;
    url: string;
  };
  reviewers: DevOpsReviewer[];
  sourceRefName: string;
  // TODO
  status: 'active' | 'abandoned' | 'completed';
  supportsIterations: string;
  targetRefName: string;
  title: string;
  url: string;
}

interface DevOpsPullRequestResponse {
  count: number;
  value: readonly DevOpsPullRequestData[];
}

interface DevOpsPullRequestsProps {
  config: DevOpsPullRequestsConfiguration;
}

export function DevopsPullRequests({ config }: DevOpsPullRequestsProps) {
  const countPerPage = 100;

  const getDevOpsAvatar = useDevOpsAvatars();
  const [pat] = useDevOpsPat();
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<DevOpsPullRequestResponse | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch(
      `https://dev.azure.com/${config.organization}/_apis/git/pullrequests?api-version=7.1-preview.1`,
      {
        headers: {
          Authorization: getDevOpsAuthorization(pat),
        },
      },
    )
      .then(async response => {
        const body = await response.json();

        setData(body);
      })
      .catch(setError);
  }, [config.organization, pat]);

  const pullRequests: readonly IssueListItem[] = useMemo(() => {
    if (!data?.value) {
      return EMPTY_ARRAY;
    }

    return data.value.map(pullRequest => {
      return {
        authors: [
          {
            displayName: pullRequest.createdBy.displayName,
            username: pullRequest.createdBy.uniqueName,
            isBot: false,
            avatarUrl:
              getDevOpsAvatar(pullRequest.createdBy.imageUrl) ?? pullRequest.createdBy.imageUrl,
          },
        ],
        url: getWebPrUrl(pullRequest.url),
        id: String(pullRequest.pullRequestId),
        createdAt: pullRequest.creationDate,
        icon: (
          <DevopsPrIcon
            isDraft={pullRequest.isDraft}
            status={pullRequest.status}
            sx={{ marginTop: 1 }}
          />
        ),
        reviews: pullRequest.reviewers
          .filter(reviewer => {
            return !reviewer.isContainer;
          })
          .map(reviewer => {
            return {
              reviewer: {
                username: reviewer.uniqueName,
                isBot: false,
                avatarUrl: getDevOpsAvatar(reviewer.imageUrl) ?? reviewer.imageUrl,
                displayName: reviewer.displayName,
              },
              requested: reviewer.vote === DevOpsVote.NoVote,
              state: mapDevOpsReviewState(reviewer.vote),
              pending: false,
            };
          }),
        number: `!${pullRequest.pullRequestId}`,
        title: pullRequest.title,
        labels: [],
        unread: false,
      } satisfies IssueListItem;
    });
  }, [data?.value, getDevOpsAvatar]);

  return (
    <IssueList
      countPerPage={countPerPage}
      error={error}
      totalCount={data?.count ?? 0}
      loaded={Boolean(error || data)}
      onOpenModal={() => alert('NYI')}
      onPageChange={setPage}
      name={config.name}
      issues={pullRequests}
      description={config.description}
    />
  );
}

function mapDevOpsReviewState(vote: DevOpsVote): ReviewState | null {
  switch (vote) {
    case DevOpsVote.NoVote:
      return null;

    case DevOpsVote.Approved:
    case DevOpsVote.ApprovedWithSuggestions:
      return ReviewState.Approved;

    case DevOpsVote.Rejected:
      return ReviewState.Rejected;

    case DevOpsVote.WaitingForAuthor:
      return ReviewState.ChangesRequested;
  }
}

function getWebPrUrl(url: string): string {
  return url
    .replace('/_apis/git/repositories/', '/_git/')
    .replace('/pullRequests/', '/pullrequest/');
}
