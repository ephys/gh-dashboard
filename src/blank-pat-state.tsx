import { KeyIcon } from '@primer/octicons-react';
import { Box, Button } from '@primer/react';
import { Blankslate } from '@primer/react/drafts';
import { isString } from '@sequelize/utils';
import type { FormEvent } from 'react';
import { useCallback } from 'react';
import { PatFormControl } from './pat-form-control.tsx';
import { usePat } from './use-pat.ts';
import { getFormValue } from './utils/get-form-values.ts';

export function BlankPatState() {
  const [, setPat] = usePat();

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      const pat = getFormValue(event.currentTarget, 'pat');

      isString.assert(pat);
      if (pat.length === 0) {
        return;
      }

      setPat(pat);
    },
    [setPat],
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
        To get started, please enter your personal access token.
      </Blankslate.Description>
      <Box sx={{ marginTop: 4, width: '100%' }} as="form" onSubmit={onSubmit}>
        <PatFormControl />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, marginTop: 2 }}>
          <Button type="submit">Save</Button>
        </Box>
      </Box>
    </Blankslate>
  );
}
