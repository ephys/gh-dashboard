import type { UserNameStyle } from './app-configuration.tsx';
import { formatUserName } from './format-user-name.tsx';
import type { FragmentType } from './gql/index.ts';
import { getFragmentData, graphql } from './gql/index.ts';
import type { InlineUserProps } from './inline-user.tsx';
import { InlineUser } from './inline-user.tsx';

export const InlineUserFragment = graphql(/* GraphQL */ `
  fragment InlineUser on Actor {
    login
    avatarUrl
    ... on User {
      name
    }
  }
`);

export interface GitHubInlineUserProps {
  user: FragmentType<typeof InlineUserFragment>;
}

export function GitHubInlineUser(props: GitHubInlineUserProps) {
  return <InlineUser {...getGitHubInlineUser(props.user)} />;
}

export function formatGitHubUserName(
  userFragment: FragmentType<typeof InlineUserFragment>,
  style: UserNameStyle,
) {
  return formatUserName({
    ...getGitHubInlineUser(userFragment),
    style,
  });
}

export function getGitHubInlineUser(
  userFragment: FragmentType<typeof InlineUserFragment>,
): InlineUserProps {
  const user = getFragmentData(InlineUserFragment, userFragment);

  const isBot = user.__typename === 'Bot';

  return {
    avatarUrl: user.avatarUrl,
    displayName: 'name' in user && user.name ? user.name : '',
    isBot,
    username: isBot ? `app/${user.login}` : user.login,
  };
}
