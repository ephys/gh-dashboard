import { PageLayout, UnderlineNav } from '@primer/react';
import { Blankslate } from '@primer/react/drafts';
import { useCallback, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../alert.tsx';
import { useAppConfiguration } from '../app-configuration.tsx';
import { BlankPatState } from '../blank-pat-state.tsx';
import { IssueList } from '../issue-list.tsx';
import { usePat } from '../use-pat.ts';
import css from './dashboard.module.scss';

export function Dashboard() {
  const [config, setConfig] = useAppConfiguration();
  const [pat] = usePat();

  const navigate = useNavigate();
  const { tabSlug } = useParams();

  useEffect(() => {
    if (!tabSlug || !config.tabs.some(t => t.slug === tabSlug)) {
      const firstTab = config.tabs[0];

      navigate(`/d/${firstTab.slug}`, { replace: true });
    }
  }, [config.tabs, tabSlug, navigate]);

  const currentPage = config.tabs.find(tab => tab.slug === tabSlug);
  const hasContent = Boolean(currentPage?.components?.length);

  const onDeleteComponent = useCallback(
    (index: number) => {
      setConfig(oldConfig => {
        return {
          ...oldConfig,
          tabs: oldConfig.tabs.map(tab => {
            if (!(tab.slug === tabSlug && tab.components)) {
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

  if (!pat) {
    return <BlankPatState />;
  }

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
        <PageLayout.Content>
          {hasContent ? (
            <div className={css.lists}>
              {currentPage?.components?.map((component, index) => {
                if ('type' in component) {
                  return (
                    <Alert key={index} type={component.type} description={component.description} />
                  );
                }

                return (
                  <IssueList
                    key={index + component.query}
                    list={component}
                    onDelete={() => onDeleteComponent(index)}
                  />
                );
              })}
            </div>
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
