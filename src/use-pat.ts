import { useLocalStorage } from './use-storage.ts';

export function usePat() {
  return useLocalStorage<string>('pat', '');
}
