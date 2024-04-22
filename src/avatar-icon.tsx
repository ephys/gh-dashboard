import type { ReactNode } from 'react';
import css from './avatar-icon.module.scss';

interface AvatarIconProps {
  avatar: ReactNode;
  bottomIcon: ReactNode;
  topIcon: ReactNode;
}

export function AvatarIcon({ avatar, bottomIcon, topIcon }: AvatarIconProps) {
  return (
    <div className={css.group}>
      {avatar}
      {topIcon && <div className={css.topIcon}>{topIcon}</div>}
      {bottomIcon && <div className={css.bottomIcon}>{bottomIcon}</div>}
    </div>
  );
}
