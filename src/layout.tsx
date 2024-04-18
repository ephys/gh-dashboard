import { GearIcon, MarkGithubIcon } from '@primer/octicons-react';
import { Header, IconButton, Octicon } from '@primer/react';
import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export function Layout(props: PropsWithChildren) {
  return (
    <>
      <Header sx={{ bg: 'canvas.default', color: '#ffffff' }}>
        <Header.Item full>
          <Header.Link
            to="/"
            as={Link}
            sx={{
              fontSize: 2,
            }}>
            <Octicon
              icon={MarkGithubIcon}
              size={32}
              sx={{
                mr: 2,
              }}
            />
            <span>Dashboard</span>
          </Header.Link>
        </Header.Item>
        <Header.Item sx={{ marginRight: 0 }}>
          <IconButton as={Link} to="/settings" aria-label="Settings" icon={GearIcon} />
        </Header.Item>
      </Header>
      {props.children}
    </>
  );
}
