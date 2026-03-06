import { PlusIcon } from '@primer/octicons-react';
import { Button, Flash, PageLayout, Link as PrimerLink, UnderlineNav } from '@primer/react';
import { Blankslate } from '@primer/react/drafts';
import { isNotNullish, upcast } from '@sequelize/utils';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppConfiguration, type GitHubSearchConfiguration } from '../app-configuration.tsx';
import { BlankPatState } from '../blank-pat-state.tsx';
import { ComponentConfigDialog } from '../component-config-dialog.tsx';
import { ComponentWrapper } from '../component-wrapper.tsx';
import { DevopsPullRequests } from '../devops-pull-requests.tsx';
import { FlashBlock } from '../flash-block.tsx';
import { GithubBranches } from '../github-branches.js';
import { GithubIssueList } from '../github-issue-list.tsx';
import { useDevOpsPat } from '../use-devops-pat.tsx';
import { useGithubPat } from '../use-github-pat.ts';
import css from './dashboard.module.scss';

export function Dashboard() {
  const [config, setConfig] = useAppConfiguration();
  const [githubPat] = useGithubPat();
  const [devOpsPat] = useDevOpsPat();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);

  const navigate = useNavigate();
  const { tabSlug } = useParams();

  useEffect(() => {
    if (!tabSlug || !config.tabs.some(t => t.slug === tabSlug)) {
      const firstTab = config.tabs[0];

      navigate(`/d/${firstTab.slug}`, { replace: true });
    }
  }, [config.tabs, tabSlug, navigate]);

  const currentPage = config.tabs.find(tab => tab.slug === tabSlug);

  const onDeleteComponent = useCallback(
    (index: number) => {
      setConfig(oldConfig => {
        return {
          ...oldConfig,
          tabs: oldConfig.tabs.map(tab => {
            if (tab.slug !== tabSlug) {
              return tab;
            }

            return {
              ...tab,
              components: tab.components.toSpliced(index, 1),
            };
          }),
        };
      });
    },
    [setConfig, tabSlug],
  );

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
    setIsAddDialogOpen(true);
  }, []);

  const onOpenAddDialog = useCallback(() => {
    setInsertPosition(null);
    setIsAddDialogOpen(true);
  }, []);

  if (!githubPat && !devOpsPat) {
    return <BlankPatState />;
  }

  let hasHiddenDevOpsComponents = upcast<boolean>(false);
  let hasHiddenGitHubComponents = upcast<boolean>(false);

  const displayedComponents = currentPage?.components
    .map((component, index) => {
      let componentElement: JSX.Element | null = null;

      if ('variant' in component) {
        componentElement = (
          <FlashBlock key={index} variant={component.variant} markdown={component.markdown} />
        );
      } else if ('organization' in component) {
        if (!devOpsPat) {
          hasHiddenDevOpsComponents = true;
          return null;
        }
        componentElement = (
          <DevopsPullRequests key={index + component.organization} config={component} />
        );
      } else if ('type' in component) {
        componentElement = <GithubBranches key={index} config={component} />;
      } else {
        if (!githubPat) {
          hasHiddenGitHubComponents = true;
          return null;
        }
        componentElement = (
          <GithubIssueList
            key={index + component.query}
            list={component}
            onDelete={() => onDeleteComponent(index)}
            onUpdate={newList => onUpdateComponent(index, newList)}
          />
        );
      }

      return (
        <ComponentWrapper
          key={index}
          canMoveUp={index > 0}
          canMoveDown={index < (currentPage?.components.length ?? 0) - 1}
          onMoveUp={() => onMoveComponent(index, index - 1)}
          onMoveDown={() => onMoveComponent(index, index + 1)}
          onInsertBefore={() => onOpenInsertDialog(index)}>
          {componentElement}
        </ComponentWrapper>
      );
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
            <Flash variant="warning" sx={{ marginBottom: 2 }}>
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
            <Flash variant="warning" sx={{ marginBottom: 2 }}>
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
                <Button
                  leadingVisual={PlusIcon}
                  onClick={onOpenAddDialog}
                  sx={{ marginTop: 3 }}>
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

          <ComponentConfigDialog
            isOpen={isAddDialogOpen}
            onClose={() => {
              setIsAddDialogOpen(false);
              setInsertPosition(null);
            }}
            onSave={onAddComponent}
          />
        </PageLayout.Content>
      </PageLayout>
    </>
  );
}
