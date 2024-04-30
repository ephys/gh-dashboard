import { useLocalStorage } from './use-storage.ts';

export function useDevOpsPat() {
  return useLocalStorage<string>('devops:pat', '');
}
