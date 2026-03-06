import { FormControl, Link, TextInput } from '@primer/react';
import type { ChangeEventHandler, ComponentProps } from 'react';

export interface GithubPatFormControlProps {
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  style?: ComponentProps<typeof FormControl>['style'];
  value?: string;
}

export function GithubPatFormControl({ style, ...passDown }: GithubPatFormControlProps) {
  return (
    <FormControl style={style}>
      <FormControl.Label>GitHub Personal Access Token</FormControl.Label>
      <FormControl.Caption>
        Your PAT is exclusively used to interact with the GitHub API. It is stored in your browser's
        local storage.{' '}
        <Link href="https://github.com/settings/tokens/new?description=Dashboard&scopes=repo,public_repo,read:org">
          Generate one
        </Link>
        .
      </FormControl.Caption>
      <TextInput {...passDown} block monospace type="password" name="github-pat" />
    </FormControl>
  );
}
