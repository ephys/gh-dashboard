import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@primer/octicons-react';
import {
  ActionList,
  Button,
  Flash,
  PageLayout,
  Link as PrimerLink,
  UnderlineNav,
} from '@primer/react';
import { Blankslate } from '@primer/react/experimental';
import { inspect, isNotNullish, upcast } from '@sequelize/utils';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppConfiguration, type GitHubSearchConfiguration } from '../app-configuration.tsx';
import { BlankPatState } from '../blank-pat-state.tsx';
import { ComponentConfigDialog } from '../component-config-dialog.tsx';
import { DeletionConfirmationDialog } from '../deletion-confirmation-dialog.tsx';
import { DevopsPullRequests } from '../devops-pull-requests.tsx';
import { FlashBlock } from '../flash-block.tsx';
import { GithubBranches } from '../github-branches.js';
import { GithubIssueList } from '../github-issue-list.tsx';
import { P } from '../markdown-components.tsx';
import { useDevOpsPat } from '../use-devops-pat.tsx';
import { useGithubPat } from '../use-github-pat.ts';
import css from './dashboard.module.scss';

export function Dashboard() {
  const [config, setConfig] = useAppConfiguration();
  const [githubPat] = useGithubPat();
  const [devOpsPat] = useDevOpsPat();
  const [componentConfigIsOpen, setComponentConfigIsOpen] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const navigate = useNavigate();
  const { tabSlug } = useParams();

  useEffect(() => {
    if (!tabSlug || !config.tabs.some(t => t.slug === tabSlug)) {
      const firstTab = config.tabs[0];

      navigate(`/d/${firstTab.slug}`, { replace: true });
    }
  }, [config.tabs, tabSlug, navigate]);

  const currentPage = config.tabs.find(tab => tab.slug === tabSlug);

  const onDeleteComponent = useCallback((index: number) => {
    setDeletingIndex(index);
  }, []);

  const onConfirmDelete = useCallback(() => {
    if (deletingIndex === null) return;

    setConfig(oldConfig => {
      return {
        ...oldConfig,
        tabs: oldConfig.tabs.map(tab => {
          if (tab.slug !== tabSlug) {
            return tab;
          }

          return {
            ...tab,
            components: tab.components.toSpliced(deletingIndex, 1),
          };
        }),
      };
    });
    setDeletingIndex(null);
  }, [setConfig, tabSlug, deletingIndex]);

  const onUpdateComponent = useCallback(
    (index: number, newList: GitHubSearchConfiguration) => {
      setConfig(oldConfig => {
        return {
          ...oldConfig,
          tabs: oldConfig.tabs.map(tab => {
            if (tab.slug !== tabSlug) {
              return tab;
            }

            return {
              ...tab,
              components: tab.components.toSpliced(index, 1, newList),
            };
          }),
        };
      });
    },
    [setConfig, tabSlug],
  );

  const onAddComponent = useCallback(
    (component: any) => {
      setConfig(oldConfig => {
        return {
          ...oldConfig,
          tabs: oldConfig.tabs.map(tab => {
            if (tab.slug !== tabSlug) {
              return tab;
            }

            const position = insertPosition ?? tab.components.length;
            return {
              ...tab,
              components: tab.components.toSpliced(position, 0, component),
            };
          }),
        };
      });
      setInsertPosition(null);
    },
    [setConfig, tabSlug, insertPosition],
  );

  const onAddOrUpdateComponent = useCallback(
    (component: any) => {
      if (editingIndex !== null) {
        // Update existing component
        onUpdateComponent(editingIndex, component);
        setEditingIndex(null);
      } else {
        // Add new component
        onAddComponent(component);
      }
    },
    [editingIndex, onUpdateComponent, onAddComponent],
  );

  const onMoveComponent = useCallback(
    (fromIndex: number, toIndex: number) => {
      setConfig(oldConfig => {
        return {
          ...oldConfig,
          tabs: oldConfig.tabs.map(tab => {
            if (tab.slug !== tabSlug) {
              return tab;
            }

            const components = [...tab.components];
            const [removed] = components.splice(fromIndex, 1);
            components.splice(toIndex, 0, removed);

            return {
              ...tab,
              components,
            };
          }),
        };
      });
    },
    [setConfig, tabSlug],
  );

  const onOpenInsertDialog = useCallback((position: number) => {
    setInsertPosition(position);
    setComponentConfigIsOpen(true);
  }, []);

  const onOpenAddDialog = useCallback(() => {
    setInsertPosition(null);
    setEditingIndex(null);
    setComponentConfigIsOpen(true);
  }, []);

  const onOpenEditDialog = useCallback((index: number) => {
    setEditingIndex(index);
    setComponentConfigIsOpen(true);
  }, []);

  const onCloseDialog = useCallback(() => {
    setComponentConfigIsOpen(false);
    setInsertPosition(null);
    setEditingIndex(null);
  }, []);

  const getComponentName = useCallback((component: any): string => {
    if ('variant' in component && 'markdown' in component) return 'Flash Message';
    if ('organization' in component) return component.name || 'DevOps Pull Requests';
    if ('type' in component && component.type === 'gh-branches')
      return component.name || 'GitHub Branches';
    if ('query' in component) return component.name || 'GitHub Search';
    return 'Component';
  }, []);

  const buildActions = useCallback(
    (index: number, canMoveUp: boolean, canMoveDown: boolean) => (
      <>
        <ActionList.Item onSelect={() => onOpenEditDialog(index)}>
          Edit
          <ActionList.LeadingVisual>
            <PencilIcon />
          </ActionList.LeadingVisual>
        </ActionList.Item>
        <ActionList.Item onSelect={() => onDeleteComponent(index)} variant="danger">
          Delete
          <ActionList.LeadingVisual>
            <TrashIcon />
          </ActionList.LeadingVisual>
        </ActionList.Item>
        <ActionList.Divider />
        <ActionList.Item onSelect={() => onOpenInsertDialog(index)}>
          Insert above
          <ActionList.LeadingVisual>
            <PlusIcon />
          </ActionList.LeadingVisual>
        </ActionList.Item>
        <ActionList.Item onSelect={() => onMoveComponent(index, index - 1)} disabled={!canMoveUp}>
          Move up
          <ActionList.LeadingVisual>
            <ChevronUpIcon />
          </ActionList.LeadingVisual>
        </ActionList.Item>
        <ActionList.Item onSelect={() => onMoveComponent(index, index + 1)} disabled={!canMoveDown}>
          Move down
          <ActionList.LeadingVisual>
            <ChevronDownIcon />
          </ActionList.LeadingVisual>
        </ActionList.Item>
      </>
    ),
    [onOpenEditDialog, onDeleteComponent, onOpenInsertDialog, onMoveComponent],
  );

  if (!githubPat && !devOpsPat) {
    return <BlankPatState />;
  }

  let hasHiddenDevOpsComponents = upcast<boolean>(false);
  let hasHiddenGitHubComponents = upcast<boolean>(false);

  const displayedComponents = currentPage?.components
    .map((component, index) => {
      const canMoveUp = index > 0;
      const canMoveDown = index < (currentPage?.components.length ?? 0) - 1;
      const actions = buildActions(index, canMoveUp, canMoveDown);

      if ('variant' in component) {
        return (
          <FlashBlock
            key={index}
            variant={component.variant}
            markdown={component.markdown}
            actions={actions}
          />
        );
      } else if ('organization' in component) {
        if (!devOpsPat) {
          hasHiddenDevOpsComponents = true;
          return null;
        }
        return (
          <DevopsPullRequests
            key={index + component.organization}
            config={component}
            actions={actions}
          />
        );
      } else if ('type' in component) {
        return <GithubBranches key={index} config={component} actions={actions} />;
      } else {
        if (!githubPat) {
          hasHiddenGitHubComponents = true;
          return null;
        }
        return <GithubIssueList key={index + component.query} list={component} actions={actions} />;
      }
    })
    .filter(isNotNullish);

  const hasContent = Boolean(displayedComponents?.length);

  const currentTab = config.tabs.find(tab => tab.slug === tabSlug);

  return (
    <>
      <title>{currentTab?.name || 'Dashboard'}</title>

      {config.tabs.length > 1 && (
        <UnderlineNav
          aria-label="Search Tabs"
          // There seems to be a bug in UnderlineNav where it does not reflect added/removed tabs
          key={config.tabs.length}>
          {config.tabs.map(tab => (
            // TODO: Add badge for unread notifications
            <UnderlineNav.Item
              key={tab.slug}
              as={Link}
              to={`/d/${tab.slug}`}
              aria-current={tab.slug === tabSlug ? 'page' : undefined}>
              {tab.name}
            </UnderlineNav.Item>
          ))}
        </UnderlineNav>
      )}

      <PageLayout containerWidth={hasContent ? 'large' : 'medium'}>
        {/* TODO: add action to remove blocks */}
        <PageLayout.Content>
          {hasHiddenGitHubComponents && (
            <Flash variant="warning" style={{ marginBottom: 8 }}>
              The GitHub blocks on this page have been hidden because you do not have a GitHub PAT.
              Go to{' '}
              <PrimerLink as={Link} to="/settings">
                the settings page
              </PrimerLink>{' '}
              to configure your GitHub PAT, or remove the GitHub blocks from this page.
            </Flash>
          )}

          {/* TODO: add action to remove blocks */}
          {hasHiddenDevOpsComponents && (
            <Flash variant="warning" style={{ marginBottom: 8 }}>
              The Azure DevOps blocks on this page have been hidden because you do not have a DevOps
              PAT. Go to{' '}
              <PrimerLink as={Link} to="/settings">
                the settings page
              </PrimerLink>{' '}
              to configure your Azure DevOps PAT, or remove the Azure DevOps blocks from this page.
            </Flash>
          )}

          {hasContent ? (
            <>
              <div className={css.lists}>{displayedComponents}</div>
              <div className={css.addButtonContainer}>
                <Button leadingVisual={PlusIcon} onClick={onOpenAddDialog} style={{ marginTop: 8 }}>
                  Add Component
                </Button>
              </div>
            </>
          ) : (
            <Blankslate>
              <Blankslate.Heading>Add your first block</Blankslate.Heading>
              <Blankslate.Description>
                This page doesn't have any content yet. Add your first block to get started.
              </Blankslate.Description>
              <Blankslate.PrimaryAction onClick={onOpenAddDialog}>
                Add a block
              </Blankslate.PrimaryAction>
            </Blankslate>
          )}

          {componentConfigIsOpen && (
            <ComponentConfigDialog
              onClose={onCloseDialog}
              onSave={onAddOrUpdateComponent}
              key={editingIndex || 'null'}
              initialConfig={
                editingIndex !== null ? currentPage?.components[editingIndex] : undefined
              }
            />
          )}

          {deletingIndex !== null && currentPage?.components[deletingIndex] && (
            <DeletionConfirmationDialog
              onDelete={onConfirmDelete}
              onCancel={() => setDeletingIndex(null)}
              title="Delete Component?"
              text={
                <P>
                  You are about to delete the{' '}
                  {inspect(getComponentName(currentPage.components[deletingIndex]))} component. This
                  action cannot be undone.
                </P>
              }
            />
          )}
        </PageLayout.Content>
      </PageLayout>
    </>
  );
}
