import { Avatar, Label } from '@primer/react';
import { useAppConfiguration } from './app-configuration.tsx';
import { formatUserName } from './format-user-name.tsx';

export interface InlineUserProps {
  avatarUrl: string;
  displayName: string;
  isBot: boolean;
  username: string;
}

export function InlineUser(props: InlineUserProps) {
  const [appConfig] = useAppConfiguration();

  return (
    <>
      {props.avatarUrl && (
        <>
          <Avatar src={props.avatarUrl} size={16} sx={{ verticalAlign: 'middle' }} />{' '}
        </>
      )}
      {formatUserName({
        style: appConfig.userNameStyle,
        displayName: props.displayName,
        username: props.username,
      })}
      {props.isBot && (
        <>
          {' '}
          <Label sx={{ font: 'inherit' }}>bot</Label>
        </>
      )}
    </>
  );
}
