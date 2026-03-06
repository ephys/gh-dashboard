import { GearIcon, MarkGithubIcon } from '@primer/octicons-react';
import { Header, IconButton } from '@primer/react';
import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import css from './layout.module.scss';

export function Layout(props: PropsWithChildren) {
  return (
    <>
      <Header className={css.header}>
        <Header.Item full>
          <Header.Link to="/" as={Link}>
            <MarkGithubIcon size={32} className={css.brandIcon} />
            <span>Dashboard</span>
          </Header.Link>
        </Header.Item>
        <Header.Item className={css.settingsItem}>
          <IconButton as={Link} to="/settings" aria-label="Settings" icon={GearIcon} />
        </Header.Item>
      </Header>
      {props.children}
    </>
  );
}
