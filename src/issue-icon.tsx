import {
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
  IssueClosedIcon,
  IssueOpenedIcon,
  SkipIcon,
} from '@primer/octicons-react';
import type { OcticonProps } from '@primer/react';
import { Octicon } from '@primer/react';
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

interface IssueIconProps {
  issue: FragmentType<typeof IssueIconFragment>;
  sx: OcticonProps['sx'];
}

export function IssueIcon(props: IssueIconProps) {
  const issue = getFragmentData(IssueIconFragment, props.issue);

  switch (issue.__typename) {
    case 'Issue':
      if (issue.issueState === IssueState.Open) {
        return <Octicon icon={IssueOpenedIcon} color="open.fg" sx={props.sx} />;
      }

      if (issue.issueStateReason === IssueStateReason.Completed) {
        return <Octicon icon={IssueClosedIcon} color="closed.fg" sx={props.sx} />;
      }

      if (issue.issueStateReason === IssueStateReason.NotPlanned) {
        return <Octicon icon={SkipIcon} color="fg.muted" sx={props.sx} />;
      }

      return null;
    case 'PullRequest':
      if (issue.prState === PullRequestState.Closed) {
        return <Octicon icon={GitPullRequestClosedIcon} color="closed.fg" sx={props.sx} />;
      }

      if (issue.prState === PullRequestState.Merged) {
        return <Octicon icon={GitMergeIcon} color="done.fg" sx={props.sx} />;
      }

      if (issue.isDraft) {
        return <Octicon icon={GitPullRequestDraftIcon} color="fg.muted" sx={props.sx} />;
      }

      return <Octicon icon={GitPullRequestIcon} color="open.fg" sx={props.sx} />;

    default:
      return null;
  }
}
