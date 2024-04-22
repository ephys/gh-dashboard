/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  fragment FormatUser on Actor {\n    login\n    ... on User {\n      name\n    }\n  }\n": types.FormatUserFragmentDoc,
    "\n  fragment InlineUser on Actor {\n    ...FormatUser\n    login\n    avatarUrl\n    ... on User {\n      name\n    }\n  }\n": types.InlineUserFragmentDoc,
    "\n  fragment IssueIcon on Node {\n    ... on Issue {\n      issueState: state\n      issueStateReason: stateReason\n    }\n    ... on PullRequest {\n      prState: state\n      isDraft\n    }\n  }\n": types.IssueIconFragmentDoc,
    "\n  query searchIssuesAndPullRequests($query: String!, $first: Int!, $after: String!) {\n    search(query: $query, type: ISSUE, first: $first, after: $after) {\n      issueCount\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n      nodes {\n        ... on Node {\n          id\n        }\n        ... on Comment {\n          author {\n            ...InlineUser\n          }\n          createdAt\n        }\n        ... on Labelable {\n          labels(first: 100) {\n            nodes {\n              id\n              name\n              color\n            }\n          }\n        }\n        ... on PullRequest {\n          id\n          prState: state\n          title\n          isReadByViewer\n          url\n          number\n          # Used to display users that have been requested for review,\n          reviewRequests(first: 10) {\n            nodes {\n              requestedReviewer {\n                ... on User {\n                  login\n                }\n                ... on Bot {\n                  login\n                }\n                ...ReviewAvatarUser\n              }\n            }\n          }\n          # Used to display reviews that block/approve\n          latestOpinionatedReviews(first: 10) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n          # Used to display whether the viewer has a review in progress\n          # Only visible to the viewer\n          pendingReviews: reviews(states: [PENDING], first: 1) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n          # We load these to be able to display whether someone commented (i.e. a review that does not request changes nor approve)\n          # We have to load latestOpinionatedReviews on top of this, because comment reviews shadow opinionated reviews\n          commentReviews: latestReviews(first: 10) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n        }\n        ... on Issue {\n          id\n          isReadByViewer\n          issueState: state\n          issueStateReason: stateReason\n          title\n          url\n          number\n        }\n        ...IssueIcon\n      }\n    }\n  }\n": types.SearchIssuesAndPullRequestsDocument,
    "\n  fragment ReviewAvatarUser on Actor {\n    ...FormatUser\n    login\n    avatarUrl\n  }\n": types.ReviewAvatarUserFragmentDoc,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FormatUser on Actor {\n    login\n    ... on User {\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment FormatUser on Actor {\n    login\n    ... on User {\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment InlineUser on Actor {\n    ...FormatUser\n    login\n    avatarUrl\n    ... on User {\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment InlineUser on Actor {\n    ...FormatUser\n    login\n    avatarUrl\n    ... on User {\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment IssueIcon on Node {\n    ... on Issue {\n      issueState: state\n      issueStateReason: stateReason\n    }\n    ... on PullRequest {\n      prState: state\n      isDraft\n    }\n  }\n"): (typeof documents)["\n  fragment IssueIcon on Node {\n    ... on Issue {\n      issueState: state\n      issueStateReason: stateReason\n    }\n    ... on PullRequest {\n      prState: state\n      isDraft\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query searchIssuesAndPullRequests($query: String!, $first: Int!, $after: String!) {\n    search(query: $query, type: ISSUE, first: $first, after: $after) {\n      issueCount\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n      nodes {\n        ... on Node {\n          id\n        }\n        ... on Comment {\n          author {\n            ...InlineUser\n          }\n          createdAt\n        }\n        ... on Labelable {\n          labels(first: 100) {\n            nodes {\n              id\n              name\n              color\n            }\n          }\n        }\n        ... on PullRequest {\n          id\n          prState: state\n          title\n          isReadByViewer\n          url\n          number\n          # Used to display users that have been requested for review,\n          reviewRequests(first: 10) {\n            nodes {\n              requestedReviewer {\n                ... on User {\n                  login\n                }\n                ... on Bot {\n                  login\n                }\n                ...ReviewAvatarUser\n              }\n            }\n          }\n          # Used to display reviews that block/approve\n          latestOpinionatedReviews(first: 10) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n          # Used to display whether the viewer has a review in progress\n          # Only visible to the viewer\n          pendingReviews: reviews(states: [PENDING], first: 1) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n          # We load these to be able to display whether someone commented (i.e. a review that does not request changes nor approve)\n          # We have to load latestOpinionatedReviews on top of this, because comment reviews shadow opinionated reviews\n          commentReviews: latestReviews(first: 10) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n        }\n        ... on Issue {\n          id\n          isReadByViewer\n          issueState: state\n          issueStateReason: stateReason\n          title\n          url\n          number\n        }\n        ...IssueIcon\n      }\n    }\n  }\n"): (typeof documents)["\n  query searchIssuesAndPullRequests($query: String!, $first: Int!, $after: String!) {\n    search(query: $query, type: ISSUE, first: $first, after: $after) {\n      issueCount\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n      nodes {\n        ... on Node {\n          id\n        }\n        ... on Comment {\n          author {\n            ...InlineUser\n          }\n          createdAt\n        }\n        ... on Labelable {\n          labels(first: 100) {\n            nodes {\n              id\n              name\n              color\n            }\n          }\n        }\n        ... on PullRequest {\n          id\n          prState: state\n          title\n          isReadByViewer\n          url\n          number\n          # Used to display users that have been requested for review,\n          reviewRequests(first: 10) {\n            nodes {\n              requestedReviewer {\n                ... on User {\n                  login\n                }\n                ... on Bot {\n                  login\n                }\n                ...ReviewAvatarUser\n              }\n            }\n          }\n          # Used to display reviews that block/approve\n          latestOpinionatedReviews(first: 10) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n          # Used to display whether the viewer has a review in progress\n          # Only visible to the viewer\n          pendingReviews: reviews(states: [PENDING], first: 1) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n          # We load these to be able to display whether someone commented (i.e. a review that does not request changes nor approve)\n          # We have to load latestOpinionatedReviews on top of this, because comment reviews shadow opinionated reviews\n          commentReviews: latestReviews(first: 10) {\n            nodes {\n              author {\n                login\n                ...ReviewAvatarUser\n              }\n              state\n            }\n          }\n        }\n        ... on Issue {\n          id\n          isReadByViewer\n          issueState: state\n          issueStateReason: stateReason\n          title\n          url\n          number\n        }\n        ...IssueIcon\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ReviewAvatarUser on Actor {\n    ...FormatUser\n    login\n    avatarUrl\n  }\n"): (typeof documents)["\n  fragment ReviewAvatarUser on Actor {\n    ...FormatUser\n    login\n    avatarUrl\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;