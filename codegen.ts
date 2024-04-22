import type { CodegenConfig } from '@graphql-codegen/cli';

process.loadEnvFile('./.env.local');

const config: CodegenConfig = {
  schema: {
    'https://api.github.com/graphql': {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'ephys/gh-dashboard (graphql-codegen)',
      },
    },
  },
  documents: ['src/**/*.tsx'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
    },
  },
};

export default config;
