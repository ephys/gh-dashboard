import { freezeDeep } from '@sequelize/utils';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { z } from 'zod';
import { AlertVariant } from './flash-block.tsx';
import type { StorageSetValue } from './use-storage.ts';
import { useLocalStorage } from './use-storage.ts';

const FlashSchema = z
  .object({
    markdown: z.string(),
    variant: z.nativeEnum(AlertVariant),
  })
  .strict();

export type Alert = z.infer<typeof FlashSchema>;

const SearchConfigurationSchema = z
  .object({
    countPerPage: z.number().default(10),
    description: z.string().min(1).optional(),
    name: z.string(),
    query: z.string(),
  })
  .strict();

export type SearchConfiguration = z.infer<typeof SearchConfigurationSchema>;

const TabConfigurationSchema = z
  .object({
    components: z
      .array(z.union([SearchConfigurationSchema, FlashSchema]))
      .default([])
      .optional(),
    name: z.string().min(1),
    slug: z.string().min(1),
  })
  .strict();

export type TabConfiguration = z.infer<typeof TabConfigurationSchema>;

export enum UserNameStyle {
  login = 'login',
  name = 'name',
  full = 'full',
}

export const AppConfigurationSchema = z
  .object({
    userNameStyle: z.nativeEnum(UserNameStyle).default(UserNameStyle.login),
    tabs: z.array(TabConfigurationSchema).min(1),
  })
  .strict();

export type AppConfiguration = z.infer<typeof AppConfigurationSchema>;

const DEFAULT_CONFIGURATION: AppConfiguration = freezeDeep({
  userNameStyle: UserNameStyle.login,
  tabs: [
    {
      components: [
        {
          countPerPage: 10,
          description: 'PRs that you already reviewed and are waiting for a re-review',
          name: '🔁✅ To Re-review',
          query:
            'is:pr is:open draft:false user-review-requested:@me reviewed-by:@me sort:created-asc',
        },
        {
          countPerPage: 10,
          name: '✅ To Review',
          query:
            'is:pr is:open draft:false review-requested:@me -reviewed-by:@me sort:created-asc -author:@me',
        },
      ],
      name: '✅ Reviews',
      slug: 'reviews',
    },
    {
      name: '🔀 Pull Requests',
      slug: 'pull-requests',
      components: [
        {
          countPerPage: 10,
          name: 'My PRs',
          query: 'is:open is:pr author:@me archived:false sort:created-asc',
        },
        {
          variant: AlertVariant.info,
          markdown: `Consider adding the following queries to this tab:

- Available PRs: \`is:open is:pr -author:@me draft:false archived:false sort:created-asc\`
- Draft PRs: \`is:open draft:true archived:false sort:created-asc\`

These queries require specifying the list of repositories you want to search in using the \`repo:\`, \`user:\` or \`org:\` filters,
or they will include pull requests from all repositories you have access to.`,
        } satisfies Alert,
      ],
    },
    {
      name: '📝 Issues',
      slug: 'issues',
      components: [
        {
          countPerPage: 10,
          name: 'Assigned Issues',
          query: 'is:open is:issue assignee:@me archived:false sort:reactions-+1-desc',
        },
        {
          markdown: `Consider adding the following queries to this tab:

- Popular Issues: \`is:open is:issue archived:false sort:reactions-+1-desc\`  
  _Lists all open issues sorted by the 👍 reaction to indicate popularity._
- Open Issues: \`is:open is:issue archived:false sort:created-desc\`  
  _Lists all open issues you have not interacted with yet, sorted by newest._

These queries require specifying the list of repositories you want to search in using the \`repo:\`, \`user:\` or \`org:\` filters,
or they will include issues from all repositories you have access to.`,
          variant: AlertVariant.info,
        },
      ],
    },
  ],
});

type AppConfigContextValue = readonly [AppConfiguration, StorageSetValue<AppConfiguration>];

const AppConfigurationContext = createContext<AppConfigContextValue>([
  DEFAULT_CONFIGURATION,
  () => {},
] as const);

export function AppConfigurationProvider({ children }: { children: ReactNode }) {
  const out = useLocalStorage<AppConfiguration>('app-configuration', DEFAULT_CONFIGURATION);

  const context = useMemo(() => {
    const parsed = AppConfigurationSchema.safeParse(out[0]);

    if (!parsed.success) {
      return [DEFAULT_CONFIGURATION, out[1]] as const;
    }

    return [parsed.data, out[1]] as const;
  }, [out]);

  return (
    <AppConfigurationContext.Provider value={context}>{children}</AppConfigurationContext.Provider>
  );
}

export function useAppConfiguration(): AppConfigContextValue {
  return useContext(AppConfigurationContext);
}
