import { Avatar, Label, Link } from '@primer/react';
import { useAppConfiguration } from './app-configuration.tsx';
import { formatUserName } from './format-user-name.tsx';
import css from './inline-user.module.scss';

export interface InlineUserProps {
  avatarUrl: string;
  displayName: string;
  isBot: boolean;
  profileUrl?: string;
  username: string;
}

export function InlineUser(props: InlineUserProps) {
  const [appConfig] = useAppConfiguration();

  const name = formatUserName({
    style: appConfig.userNameStyle,
    displayName: props.displayName,
    username: props.username,
  });

  const avatar = props.avatarUrl && (
    <Avatar src={props.avatarUrl} size={16} style={{ verticalAlign: 'middle' }} />
  );

  return (
    <>
      {avatar && (
        <>
          {props.profileUrl ? (
            <Link href={props.profileUrl} className={css.avatarLink}>
              {avatar}
            </Link>
          ) : (
            avatar
          )}{' '}
        </>
      )}
      {props.profileUrl ? (
        <Link href={props.profileUrl} className={css.textLink}>
          {name}
        </Link>
      ) : (
        name
      )}
      {props.isBot && (
        <>
          {' '}
          <Label style={{ font: 'inherit' }}>bot</Label>
        </>
      )}
    </>
  );
}
