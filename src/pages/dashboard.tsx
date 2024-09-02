import { Flash, PageLayout, Link as PrimerLink, UnderlineNav } from '@primer/react';
import { Blankslate } from '@primer/react/drafts';
import { isNotNullish, upcast } from '@sequelize/utils';
import { useCallback, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppConfiguration, type GitHubSearchConfiguration } from '../app-configuration.tsx';
import { BlankPatState } from '../blank-pat-state.tsx';
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

  if (!githubPat && !devOpsPat) {
    return <BlankPatState />;
  }

  let hasHiddenDevOpsComponents = upcast<boolean>(false);
  let hasHiddenGitHubComponents = upcast<boolean>(false);

  const displayedComponents = currentPage?.components
    .map((component, index) => {
      if ('variant' in component) {
        return <FlashBlock key={index} variant={component.variant} markdown={component.markdown} />;
      }

      if ('organization' in component) {
        if (!devOpsPat) {
          hasHiddenDevOpsComponents = true;

          return null;
        }

        return <DevopsPullRequests key={index + component.organization} config={component} />;
      }

      if ('type' in component) {
        return <GithubBranches key={index} config={component} />;
      }

      if (!githubPat) {
        hasHiddenGitHubComponents = true;

        return null;
      }

      return (
        <GithubIssueList
          key={index + component.query}
          list={component}
          onDelete={() => onDeleteComponent(index)}
          onUpdate={newList => onUpdateComponent(index, newList)}
        />
      );
    })
    .filter(isNotNullish);

  const hasContent = Boolean(displayedComponents?.length);

  return (
    <>
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
            <div className={css.lists}>{displayedComponents}</div>
          ) : (
            <Blankslate>
              <Blankslate.Heading>Add your first block</Blankslate.Heading>
              <Blankslate.Description>
                This page doesn't have any content yet. Add your first block to get started.
              </Blankslate.Description>
              <Blankslate.PrimaryAction href="#">Add a block</Blankslate.PrimaryAction>
            </Blankslate>
          )}
        </PageLayout.Content>
      </PageLayout>
    </>
  );
}
