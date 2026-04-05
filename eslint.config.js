import { basePreset } from '@ephys/eslint-config-typescript';

export default [
  {
    ignores: ['**/*.snapshot', 'dist', 'src/gql'],
  },
  ...basePreset(`${import.meta.dirname}/tsconfig.json`),
];
