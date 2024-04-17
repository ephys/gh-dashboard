import type { MakeNonNullish, NonUndefined } from '@sequelize/utils';
import type { UseQueryState } from 'urql';

type AnyVariables =
  | {
      [prop: string]: any;
    }
  | void
  | undefined;

export function isLoadedUrql<Data, Vars extends AnyVariables>(
  state: UseQueryState<Data, Vars>,
): state is Omit<UseQueryState<Data, Vars>, 'data' | 'error'> &
  (
    | { data: NonUndefined<UseQueryState<Data, Error>['data']>; error: undefined }
    | { data: undefined; error: MakeNonNullish<UseQueryState<Data, Error>['error']> }
  ) {
  return state.data !== undefined || state.error != null;
}
