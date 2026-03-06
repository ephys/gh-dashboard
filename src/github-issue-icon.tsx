import {
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
  IssueClosedIcon,
  IssueOpenedIcon,
  SkipIcon,
} from '@primer/octicons-react';
import css from './github-issue-icon.module.scss';
import type { FragmentType } from './gql/fragment-masking.ts';
import { getFragmentData } from './gql/fragment-masking.ts';
import { IssueState, IssueStateReason, PullRequestState } from './gql/graphql.ts';
import { graphql } from './gql/index.ts';

export const IssueIconFragment = graphql(/* GraphQL */ `
  fragment IssueIcon on Node {
    ... on Issue {
      issueState: state
      issueStateReason: stateReason
    }
    ... on PullRequest {
      prState: state
      isDraft
    }
  }
`);

interface GithubIssueIconProps {
  issue: FragmentType<typeof IssueIconFragment>;
  className?: string;
}

export function GithubIssueIcon(props: GithubIssueIconProps) {
  const issue = getFragmentData(IssueIconFragment, props.issue);

  switch (issue.__typename) {
    case 'Issue':
      if (issue.issueState === IssueState.Open) {
        return <IssueOpenedIcon className={`${css.iconOpen} ${props.className || ''}`} />;
      }

      if (issue.issueStateReason === IssueStateReason.Completed) {
        return <IssueClosedIcon className={`${css.iconClosed} ${props.className || ''}`} />;
      }

      if (issue.issueStateReason === IssueStateReason.NotPlanned) {
        return <SkipIcon className={`${css.iconMuted} ${props.className || ''}`} />;
      }

      return null;
    case 'PullRequest':
      if (issue.prState === PullRequestState.Closed) {
        return (
          <GitPullRequestClosedIcon className={`${css.iconClosed} ${props.className || ''}`} />
        );
      }

      if (issue.prState === PullRequestState.Merged) {
        return <GitMergeIcon className={`${css.iconDone} ${props.className || ''}`} />;
      }

      if (issue.isDraft) {
        return <GitPullRequestDraftIcon className={`${css.iconMuted} ${props.className || ''}`} />;
      }

      return <GitPullRequestIcon className={`${css.iconOpen} ${props.className || ''}`} />;

    default:
      return null;
  }
}
