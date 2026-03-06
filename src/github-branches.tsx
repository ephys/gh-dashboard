import { KebabHorizontalIcon } from '@primer/octicons-react';
import {
  ActionList,
  ActionMenu,
  Button,
  Flash,
  Link as PrimerLink,
  RelativeTime,
  Text,
} from '@primer/react';
import { DataTable, Table } from '@primer/react/drafts';
import type { Column } from '@primer/react/lib-esm/DataTable/column.js';
import type { UniqueRow } from '@primer/react/lib/DataTable/row.js';
import type { MakeNonNullish } from '@sequelize/utils';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { ActionMenuIconButton } from './action-menu-icon-button.js';
import type { GitHubBranchesConfiguration } from './app-configuration.js';
import { GitHubInlineUser } from './github-inline-user.js';
import { GithubIssueIcon } from './github-issue-icon.js';
import type { RefFragment, SearchBranchesQuery } from './gql/graphql.js';
import { getFragmentData, graphql } from './gql/index.js';
import { useUrqlQuery } from './utils/custom-use-query.js';
import { useOnGlobalRefresh } from './utils/use-on-global-refresh.js';

const RefFragmentSchema = graphql(/* GraphQL */ `
  fragment Ref on Ref {
    name
    target {
      ... on Commit {
        committedDate
        author {
          user {
            ...InlineUser
          }
        }
      }
    }
    associatedPullRequests(states: OPEN, first: 1) {
      nodes {
        ...IssueIcon
        url
        number
      }
    }
  }
`);

const searchQuery = graphql(/* GraphQL */ `
  query searchBranches($repo: String!, $branch: String!, $repoCount: Int!) {
    search(query: $repo, type: REPOSITORY, first: $repoCount) {
      nodes {
        __typename
        ... on Repository {
          nameWithOwner
          url
          defaultBranchRef {
            name
          }
          refs(refPrefix: "refs/heads/", first: 100, query: $branch) {
            nodes {
              ...Ref
            }
          }
        }
      }
    }
  }
`);

type SearchResult = MakeNonNullish<MakeNonNullish<SearchBranchesQuery['search']['nodes']>[number]>;

type RefRow = RefFragment &
  UniqueRow & {
    createPrUrl: string;
    url: string;
  };

const COLUMNS: Array<Column<RefRow>> = [
  {
    id: 'branch',
    header: 'Branch',
    renderCell(data: RefRow) {
      return <PrimerLink href={data.url}>{data.name}</PrimerLink>;
    },
  },
  {
    id: 'updated',
    header: 'Updated',
    renderCell(data: RefRow) {
      if (data.target?.__typename !== 'Commit') {
        return null;
      }

      return (
        <span>
          <RelativeTime datetime={data.target.committedDate} />
          {data.target.author?.user && (
            <>
              {' '}
              by <GitHubInlineUser user={data.target.author?.user} />
            </>
          )}
        </span>
      );
    },
  },
  {
    id: 'pr',
    header: 'Pull Request',
    renderCell(ref: RefRow) {
      const associatedPr = ref.associatedPullRequests?.nodes?.[0];

      if (!associatedPr) {
        if (!ref.createPrUrl) {
          return null;
        }

        return (
          <Button as="a" href={ref.createPrUrl}>
            Open PR
          </Button>
        );
      }

      return (
        <PrimerLink href={associatedPr.url}>
          <GithubIssueIcon issue={associatedPr} sx={{ marginTop: 1 }} /> #{associatedPr.number}
        </PrimerLink>
      );
    },
  },
];

export function GithubBranches({
  config,
  actions,
}: {
  config: GitHubBranchesConfiguration;
  actions?: ReactNode;
}) {
  const [urqlSearch, refresh] = useUrqlQuery({
    query: searchQuery,
    variables: {
      repoCount: config.repositories.length,
      repo: config.repositories.map(repo => `repo:${repo}`).join(' '),
      branch: config.branch ?? '',
    },
  });

  useOnGlobalRefresh(refresh);

  const error = urqlSearch.error;
  const nodes = (urqlSearch.data?.search.nodes ?? []) as SearchResult[];

  const id = useId();

  if (error) {
    return <Flash variant="danger">Failed to load content</Flash>;
  }

  const repoEntries = nodes.flatMap(repo => {
    if (repo.__typename !== 'Repository' || !repo.refs?.nodes) {
      return [];
    }

    const refs = repo.refs.nodes
      .filter(wrappedRefFragment => {
        const ref = getFragmentData(RefFragmentSchema, wrappedRefFragment);

        if (!ref) {
          return false;
        }

        if (config.onlyNoPr && ref.associatedPullRequests.nodes?.length) {
          return false;
        }

        return true;
      })
      .map(wrappedRefFragment => {
        const ref = getFragmentData(RefFragmentSchema, wrappedRefFragment)!;

        return {
          ...ref,
          id: ref.name,
          url: `${repo.url}/tree/${ref.name}`,
          createPrUrl: repo.defaultBranchRef
            ? `https://github.com/gsk-tech/cdw/compare/${repo.defaultBranchRef.name}...${ref.name}?expand=1`
            : '',
        };
      }) as RefRow[];

    return [
      {
        repo,
        refs,
      },
    ];
  });

  if (repoEntries.length === 0) {
    return (
      <Table.Container>
        <Table.Title as="h2" id={`${id}-empty`}>
          {config.name || 'Unnamed'}
        </Table.Title>
        <Table.Subtitle id={`${id}-empty-subtitle`}>
          <Text as="p" sx={{ margin: 0 }}>
            No repositories found
          </Text>
        </Table.Subtitle>
        <Table.Actions>
          <ActionMenuIconButton icon={KebabHorizontalIcon} aria-label="More Actions">
            <ActionMenu.Overlay width="auto">
              <ActionList>{actions}</ActionList>
            </ActionMenu.Overlay>
          </ActionMenuIconButton>
        </Table.Actions>
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
      </Table.Container>
    );
  }

  let renderedNodes = 0;

  return repoEntries.map(({ repo, refs }) => {
    const isFirstNode = renderedNodes === 0;

    renderedNodes++;

    return (
      <Table.Container key={repo.nameWithOwner}>
        <>
          {isFirstNode ? (
            <Table.Title as="h2" id={`${id}-${repo.nameWithOwner}`}>
              {config.name || 'Unnamed'}
            </Table.Title>
          ) : null}
          <Table.Subtitle id={`${id}-${repo.nameWithOwner}-subtitle`}>
            <Text as="p" sx={{ margin: 0 }}>
              <PrimerLink href={repo.url}>{repo.nameWithOwner}</PrimerLink>
            </Text>
          </Table.Subtitle>
        </>

        {isFirstNode && (
          <Table.Actions>
            <ActionMenuIconButton icon={KebabHorizontalIcon} aria-label="More Actions">
              <ActionMenu.Overlay width="auto">
                <ActionList>{actions}</ActionList>
              </ActionMenu.Overlay>
            </ActionMenuIconButton>
          </Table.Actions>
        )}

        <DataTable aria-labelledby={`${id}-${repo.nameWithOwner}`} data={refs} columns={COLUMNS} />
      </Table.Container>
    );
  });
}
