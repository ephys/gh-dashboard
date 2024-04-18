import { KebabHorizontalIcon, PencilIcon, TrashIcon } from '@primer/octicons-react';
import { ActionList, ActionMenu, Link as PrimerLink, Text } from '@primer/react';
import type { Column } from '@primer/react/drafts';
import { DataTable, Table } from '@primer/react/drafts';
import type { Nullish } from '@sequelize/utils';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'urql';
import { ActionMenuIconButton } from './action-menu-icon-button.tsx';
import { Alert } from './alert.tsx';
import { graphql } from './gql/index.ts';
import { InlineCode } from './markdown.tsx';
import { isLoadedUrql } from './urql/urql.utils.ts';

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
        ... on PullRequest {
          title
          url
        }
        ... on Issue {
          title
          url
        }
      }
    }
  }
`);

interface SearchResult {
  id: string;
  title: string;
  url: string;
}

const columns: Array<Column<SearchResult>> = [
  {
    header: 'Results',
    id: 'main',
    renderCell: data => <PrimerLink href={data.url}>{data.title}</PrimerLink>,
    rowHeader: true,
  },
];

export interface IssueListProps {
  countPerPage?: number;
  description?: string | Nullish;
  query: string;
  title: ReactNode;
}

export function IssueList(props: IssueListProps) {
  const countPerPage = props.countPerPage ?? 10;
  const [page, setPage] = useState(0);

  const after = useMemo(() => {
    return page > 0 ? btoa(`cursor:${page * countPerPage}`) : '';
  }, [page, countPerPage]);

  const [urqlSearch] = useQuery({
    query: searchQuery,
    variables: {
      query: props.query,
      first: countPerPage,
      after,
    },
  });

  const nodes = (urqlSearch.data?.search.nodes ?? []) as SearchResult[];

  const onPageChange = useCallback((data: { pageIndex: number }) => {
    setPage(data.pageIndex);
  }, []);

  // TODO: refresh button
  return (
    <Table.Container>
      <Table.Title as="h2" id="repositories">
        {props.title}
      </Table.Title>
      <Table.Subtitle as="p" id="repositories-subtitle">
        {props.description && (
          <Text as="p" sx={{ margin: 0 }}>
            {props.description}
          </Text>
        )}
        <Text as="p" sx={{ margin: 0 }}>
          <InlineCode>{props.query}</InlineCode>
        </Text>
      </Table.Subtitle>

      <Table.Actions>
        <ActionMenuIconButton icon={KebabHorizontalIcon} aria-label="More Actions">
          <ActionMenu.Overlay width="auto">
            <ActionList>
              <ActionList.LinkItem href="/">
                Edit
                <ActionList.LeadingVisual>
                  <PencilIcon />
                </ActionList.LeadingVisual>
              </ActionList.LinkItem>
              <ActionList.Item onSelect={() => alert('Archived items clicked')} variant="danger">
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
        <Alert type="error" title="Error" description="Failed to load content" />
      ) : (
        <>
          <DataTable
            aria-labelledby="repositories"
            aria-describedby="repositories-subtitle"
            data={nodes}
            columns={columns}
          />
          <Table.Pagination
            aria-label={`Pagination for ${props.title}`}
            totalCount={urqlSearch.data.search.issueCount ?? 0}
            pageSize={countPerPage}
            // defaultPageIndex={page - 1}
            onChange={onPageChange}
          />
        </>
      )}
    </Table.Container>
  );
}
