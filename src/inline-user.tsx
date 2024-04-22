import { Avatar, Label } from '@primer/react';
import { useAppConfiguration } from './app-configuration.tsx';
import { formatUserName } from './format-user-name.tsx';
import type { FragmentType } from './gql/index.ts';
import { getFragmentData, graphql } from './gql/index.ts';

export const InlineUserFragment = graphql(/* GraphQL */ `
  fragment InlineUser on Actor {
    ...FormatUser
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
  const user = getFragmentData(InlineUserFragment, props.user);

  const [appConfig] = useAppConfiguration();

  return (
    <>
      <Avatar src={user.avatarUrl} size={16} sx={{ verticalAlign: 'middle' }} />{' '}
      {formatUserName(user, appConfig.userNameStyle)}
      {user.__typename === 'Bot' && (
        <>
          {' '}
          <Label sx={{ font: 'inherit' }}>bot</Label>
        </>
      )}
    </>
  );
}
