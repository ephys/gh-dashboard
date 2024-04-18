import { KebabHorizontalIcon, PencilIcon, TrashIcon } from '@primer/octicons-react';
import { ActionList, ActionMenu, Link as PrimerLink, Text } from '@primer/react';
import type { Column } from '@primer/react/drafts';
import { DataTable, Table } from '@primer/react/drafts';
import { inspect } from '@sequelize/utils';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'urql';
import { ActionMenuIconButton } from './action-menu-icon-button.tsx';
import { Alert } from './alert.tsx';
import { DeletionConfirmationDialog } from './deletion-confirmation-dialog.tsx';
import { graphql } from './gql/index.ts';
import { InlineCode, P } from './markdown.tsx';
import { isLoadedUrql } from './urql/urql.utils.ts';
import type { SearchConfiguration } from './use-app-configuration.ts';

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
  list: SearchConfiguration;
  onDelete(this: void): void;
}

export function IssueList({ list, onDelete }: IssueListProps) {
  const countPerPage = list.countPerPage ?? 10;
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
      <Table.Subtitle as="p" id="repositories-subtitle">
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
            aria-label={`Pagination for ${list.name}`}
            totalCount={urqlSearch.data.search.issueCount}
            pageSize={countPerPage}
            onChange={onPageChange}
          />
        </>
      )}
      {openModalId === 'delete' && (
        <DeleteListDialog onClose={closeModal} onDelete={onDelete} list={list} />
      )}
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
