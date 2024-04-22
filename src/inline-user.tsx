import { Avatar, Label } from '@primer/react';
import type { FragmentType } from './gql/index.ts';
import { graphql, useFragment } from './gql/index.ts';
import { useAppConfiguration } from './use-app-configuration.ts';

export const InlineUserFragment = graphql(/* GraphQL */ `
  fragment InlineUser on Actor {
    login
    avatarUrl
    ... on User {
      name
    }
  }
`);

export interface InlineUserProps {
  user: FragmentType<typeof InlineUserFragment>;
}

export function InlineUser(props: InlineUserProps) {
  const user = useFragment(InlineUserFragment, props.user);

  const [appConfig] = useAppConfiguration();

  return (
    <>
      <Avatar src={user.avatarUrl} size={16} sx={{ verticalAlign: 'middle' }} />{' '}
      {appConfig.userNameStyle === 'login' || !('name' in user) || !user.name
        ? user.login
        : appConfig.userNameStyle === 'name'
          ? user.name
          : `${user.name} (${user.login})`}
      {user.__typename === 'Bot' && (
        <>
          {' '}
          <Label sx={{ font: 'inherit' }}>bot</Label>
        </>
      )}
    </>
  );
}
