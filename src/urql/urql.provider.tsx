import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { Client, Provider, cacheExchange, fetchExchange } from 'urql';
import { usePat } from '../use-pat.ts';

export function UrqlProvider(props: PropsWithChildren) {
  const [pat] = usePat();

  const client = useMemo(() => {
    return new Client({
      url: 'https://api.github.com/graphql',
      exchanges: [cacheExchange, fetchExchange],
      fetchOptions: () => ({
        headers: {
          Authorization: `Bearer ${pat}`,
          'User-Agent': 'ephys/gh-dashboard (app)',
        },
      }),
    });
  }, [pat]);

  return <Provider value={client}>{props.children}</Provider>;
}
