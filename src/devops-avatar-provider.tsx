import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useDevOpsPat } from './use-devops-pat.tsx';
import { getDevOpsAuthorization } from './utils/devops.ts';

type GetAvatar = (descriptor: string) => string | null;

const DevOpsAvatarContext = createContext<GetAvatar>(() => null);

export function DevopsAvatarProvider(props: PropsWithChildren) {
  const [pat] = useDevOpsPat();
  const [avatars, setAvatars] = useState(new Map<string, string>());
  const pendingRef = useRef(new Map<string, Promise<void>>());

  const getAvatar = useCallback(
    (url: string) => {
      if (!url) {
        return null;
      }

      const existing = avatars.get(url);

      if (existing) {
        return existing;
      }

      if (pendingRef.current.has(url)) {
        return null;
      }

      const promise = fetch(url, {
        headers: {
          Authorization: getDevOpsAuthorization(pat),
        },
      })
        .then(async response => {
          const body = await response.blob();
          const imageUrl = URL.createObjectURL(body);

          setAvatars(oldAvatars => {
            const map = new Map(oldAvatars);
            map.set(url, imageUrl);

            return map;
          });
        })
        .catch(console.error)
        .finally(() => {
          pendingRef.current.delete(url);
        });

      pendingRef.current.set(url, promise);

      return null;
    },
    [avatars, pat],
  );

  return (
    <DevOpsAvatarContext.Provider value={getAvatar}>{props.children}</DevOpsAvatarContext.Provider>
  );
}

export function useDevOpsAvatars() {
  return useContext(DevOpsAvatarContext);
}
