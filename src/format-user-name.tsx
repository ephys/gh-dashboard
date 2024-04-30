import { UserNameStyle } from './app-configuration.tsx';

export function formatUserName(params: {
  displayName: string;
  style: UserNameStyle;
  username: string;
}) {
  const { displayName, style, username } = params;

  return style === UserNameStyle.login || !displayName
    ? username
    : style === UserNameStyle.name
      ? displayName
      : `${displayName} (${username})`;
}
