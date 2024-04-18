import { FormControl, TextInput } from '@primer/react';
import type { ChangeEventHandler, ComponentProps } from 'react';

export interface PatFormControlProps {
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  sx?: ComponentProps<typeof FormControl>['sx'];
  value?: string;
}

export function PatFormControl({ sx, ...passDown }: PatFormControlProps) {
  return (
    <FormControl sx={sx}>
      <FormControl.Label>Personal Access Token</FormControl.Label>
      <FormControl.Caption>
        Your PAT is exclusively used to interact with the GitHub API. It is stored in your browser's
        local storage.
      </FormControl.Caption>
      <TextInput {...passDown} block monospace type="password" name="pat" required />
    </FormControl>
  );
}
