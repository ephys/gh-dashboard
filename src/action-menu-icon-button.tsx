import { ActionMenu, IconButton } from '@primer/react';
import type { ComponentProps } from 'react';
import { useCallback, useRef, useState } from 'react';

type IconButtonProps = ComponentProps<typeof IconButton>;

export interface ActionMenuIconButtonProps
  extends Pick<IconButtonProps, 'icon' | 'aria-label' | 'aria-labelledby'>,
    Pick<ComponentProps<typeof ActionMenu>, 'children'> {}

export function ActionMenuIconButton({ children, ...passDown }: ActionMenuIconButtonProps) {
  const moreActionsRef = useRef<HTMLButtonElement>(null);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const onOpenMoreMenu = useCallback(() => {
    setMoreMenuOpen(true);
  }, []);

  return (
    <>
      <IconButton
        {...(passDown as IconButtonProps)}
        ref={moreActionsRef}
        onClick={onOpenMoreMenu}
      />
      <ActionMenu anchorRef={moreActionsRef} open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        {children}
      </ActionMenu>
    </>
  );
}
