import { FormControl, TextInput } from '@primer/react';
import type { ChangeEventHandler, ComponentProps } from 'react';

export interface DevOpsPatFormControlProps {
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  sx?: ComponentProps<typeof FormControl>['sx'];
  value?: string;
}

export function DevOpsPatFormControl({ sx, ...passDown }: DevOpsPatFormControlProps) {
  return (
    <FormControl sx={sx}>
      <FormControl.Label>Azure DevOps Personal Access Token</FormControl.Label>
      <FormControl.Caption>
        Your PAT is exclusively used to interact with the Azure DevOps API. It is stored in your
        browser's local storage.
      </FormControl.Caption>
      <TextInput {...passDown} block monospace type="password" name="devops-pat" />
    </FormControl>
  );
}
