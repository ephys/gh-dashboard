module.exports = {
  root: true,
  extends: [
    '@ephys/eslint-config-typescript',
    '@ephys/eslint-config-typescript/react',
    '@ephys/eslint-config-typescript/browser',
  ],
  ignorePatterns: ['dist', 'src/gql/*'],
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/jsx-curly-newline': 'off',
  },
  overrides: [
    {
      files: ['vite.config.ts', 'codegen.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
      parserOptions: {
        project: './tsconfig.node.json',
      },
    },
  ],
}
