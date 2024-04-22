import type { ResultOf } from '@graphql-typed-document-node/core';
import { UserNameStyle } from './app-configuration.tsx';
import type { FragmentType } from './gql/index.ts';
import { getFragmentData, graphql } from './gql/index.ts';

export const FormatUserFragment = graphql(/* GraphQL */ `
  fragment FormatUser on Actor {
    login
    ... on User {
      name
    }
  }
`);

export function formatUserName(
  userFragment: FragmentType<typeof FormatUserFragment>,
  style: UserNameStyle,
) {
  const user = getFragmentData(FormatUserFragment, userFragment);

  return style === UserNameStyle.login || !('name' in user) || !user.name
    ? formatLogin(user)
    : style === UserNameStyle.name
      ? user.name
      : `${user.name} (${formatLogin(user)})`;
}

function formatLogin(user: ResultOf<typeof FormatUserFragment>) {
  return user.__typename === 'Bot' ? `app/${user.login}` : user.login;
}
