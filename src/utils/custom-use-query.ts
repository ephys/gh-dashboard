import { useCallback } from 'react';
import type { UseQueryArgs, UseQueryExecute, UseQueryResponse } from 'urql';
import { useQuery as baseUseQuery } from 'urql';

type AnyVariables =
  | {
      [prop: string]: any;
    }
  | void
  | undefined;

export function useUrqlQuery<Data = any, Variables extends AnyVariables = AnyVariables>(
  args: UseQueryArgs<Variables, Data>,
): UseQueryResponse<Data, Variables> {
  const [response, execute] = baseUseQuery<Data, Variables>(args);

  const retry: UseQueryExecute = useCallback(
    opts => {
      return execute({
        requestPolicy: 'network-only',
        ...opts,
      });
    },
    [execute],
  );

  return [response, retry];
}
