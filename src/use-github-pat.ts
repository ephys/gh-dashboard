import { useLocalStorage } from './use-storage.ts';

export function useGithubPat() {
  return useLocalStorage<string>('github:pat', '');
}
