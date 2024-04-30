import { KeyIcon } from '@primer/octicons-react';
import { Box, Button } from '@primer/react';
import { Blankslate } from '@primer/react/drafts';
import { isString } from '@sequelize/utils';
import type { FormEvent } from 'react';
import { useCallback } from 'react';
import { DevOpsPatFormControl } from './devops-pat-form-control.tsx';
import { GithubPatFormControl } from './github-pat-form-control.tsx';
import { useDevOpsPat } from './use-devops-pat.tsx';
import { useGithubPat } from './use-github-pat.ts';
import { getFormValue } from './utils/get-form-values.ts';

export function BlankPatState() {
  const [, setGithubPat] = useGithubPat();
  const [, setDevOpsPat] = useDevOpsPat();

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      const githubPat = getFormValue(event.currentTarget, 'github-pat');
      const devopsPat = getFormValue(event.currentTarget, 'devops-pat');

      isString.assert(githubPat);
      isString.assert(devopsPat);

      if (githubPat.length === 0 && devopsPat.length === 0) {
        return;
      }

      if (githubPat) {
        setGithubPat(githubPat);
      }

      if (devopsPat) {
        setDevOpsPat(devopsPat);
      }
    },
    [setDevOpsPat, setGithubPat],
  );

  return (
    <Blankslate spacious narrow>
      <Blankslate.Visual>
        <KeyIcon size="medium" />
      </Blankslate.Visual>
      <Blankslate.Heading>Welcome to your Dashboard</Blankslate.Heading>
      <Blankslate.Description>
        Your dashboard is a deeply customizable place where you can keep track of your pull requests
        and issues.
        <br />
        <br />
        To get started, please enter your personal access token for the platforms you want to use.
      </Blankslate.Description>
      <Box sx={{ marginTop: 4, width: '100%' }} as="form" onSubmit={onSubmit}>
        <GithubPatFormControl />
        <DevOpsPatFormControl sx={{ marginTop: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, marginTop: 2 }}>
          <Button type="submit">Save</Button>
        </Box>
      </Box>
    </Blankslate>
  );
}
