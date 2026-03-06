import { Button, Checkbox, Dialog, FormControl, Select, Textarea, TextInput } from '@primer/react';
import { parseSafeInteger } from '@sequelize/utils';
import { useCallback, useId, useState, type SubmitEvent } from 'react';
import css from './component-config-dialog.module.scss';
import { AlertVariant } from './flash-block.tsx';
import { getFormValues } from './utils/get-form-values.ts';

export type ComponentType = 'github-search' | 'github-branches' | 'devops-prs' | 'flash';

export interface ComponentConfigDialogProps {
  initialConfig?: any;
  initialType?: ComponentType;
  onClose(): void;
  onSave(config: any): void;
}

function detectComponentType(config: any): ComponentType {
  if (!config) return 'github-search';
  if ('variant' in config && 'markdown' in config) return 'flash';
  if ('organization' in config) return 'devops-prs';
  if ('type' in config && config.type === 'gh-branches') return 'github-branches';
  return 'github-search';
}

export function ComponentConfigDialog({
  onClose,
  onSave,
  initialConfig,
  initialType,
}: ComponentConfigDialogProps) {
  const detectedType = initialType ?? detectComponentType(initialConfig);
  const [componentType, setComponentType] = useState<ComponentType>(detectedType);
  const dialogId = useId();
  const isEditing = Boolean(initialConfig);

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = getFormValues(event.currentTarget);
      let config: any;

      console.log(formData.hideBranchNames);

      switch (componentType) {
        case 'github-search':
          config = {
            name: formData.name,
            query: formData.query,
            description: formData.description || undefined,
            countPerPage: parseSafeInteger(String(formData.countPerPage)) ?? 10,
            defaultRepository: formData.defaultRepository || undefined,
            hideBranchNames: formData.hideBranchNames,
            hidePrNumbers: formData.hidePrNumbers,
          };
          break;

        case 'github-branches':
          config = {
            type: 'gh-branches' as const,
            name: formData.name || undefined,
            repositories: String(formData.repositories ?? '')
              .split('\n')
              .map((r: string) => r.trim())
              .filter(Boolean),
            branch: formData.branch || undefined,
            onlyNoPr: formData.onlyNoPr,
          };
          break;

        case 'devops-prs':
          config = {
            name: formData.name,
            organization: formData.organization,
            description: formData.description || undefined,
          };
          break;

        case 'flash':
          config = {
            variant: formData.variant as AlertVariant,
            markdown: formData.markdown,
          };
          break;
      }

      onSave(config);
      onClose();
    },
    [componentType, onSave, onClose],
  );

  return (
    <Dialog onClose={onClose} aria-labelledby={dialogId}>
      <Dialog.Header id={dialogId}>
        {initialConfig ? 'Edit Component' : 'Add Component'}
      </Dialog.Header>
      <form onSubmit={handleSubmit}>
        <div>
          <FormControl required disabled={isEditing}>
            <FormControl.Label>Component Type</FormControl.Label>
            <Select
              value={componentType}
              onChange={e => setComponentType(e.target.value as ComponentType)}>
              <Select.Option value="github-search">GitHub Search / Issue List</Select.Option>
              <Select.Option value="github-branches">GitHub Branches</Select.Option>
              <Select.Option value="devops-prs">Azure DevOps Pull Requests</Select.Option>
              <Select.Option value="flash">Flash Message / Alert</Select.Option>
            </Select>
          </FormControl>

          {componentType === 'github-search' && <GitHubSearchForm initialConfig={initialConfig} />}
          {componentType === 'github-branches' && (
            <GitHubBranchesForm initialConfig={initialConfig} />
          )}
          {componentType === 'devops-prs' && <DevOpsPrsForm initialConfig={initialConfig} />}
          {componentType === 'flash' && <FlashForm initialConfig={initialConfig} />}
        </div>

        <div className={css.dialogActions}>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {initialConfig ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function GitHubSearchForm({ initialConfig }: { initialConfig?: any }) {
  return (
    <>
      <FormControl required className={css.sectionSpacing}>
        <FormControl.Label>Name</FormControl.Label>
        <TextInput name="name" defaultValue={initialConfig?.name ?? ''} block />
      </FormControl>

      <FormControl required className={css.sectionSpacing}>
        <FormControl.Label>Query</FormControl.Label>
        <Textarea
          name="query"
          defaultValue={initialConfig?.query ?? ''}
          placeholder="is:pr is:open review-requested:@me"
          block
          rows={3}
        />
        <FormControl.Caption>
          GitHub issue query (e.g., "is:pr is:open review-requested:@me").
        </FormControl.Caption>
      </FormControl>

      <FormControl className={css.sectionSpacing}>
        <FormControl.Label>Description</FormControl.Label>
        <Textarea
          name="description"
          defaultValue={initialConfig?.description ?? ''}
          placeholder="Optional description"
          block
          rows={2}
        />
      </FormControl>

      <FormControl className={css.sectionSpacing}>
        <FormControl.Label>Items per page</FormControl.Label>
        <TextInput
          name="countPerPage"
          type="number"
          defaultValue={initialConfig?.countPerPage ?? 10}
          min={1}
          block
        />
      </FormControl>

      <FormControl className={css.sectionSpacing}>
        <FormControl.Label>Default Repository</FormControl.Label>
        <TextInput
          name="defaultRepository"
          defaultValue={initialConfig?.defaultRepository ?? ''}
          placeholder="owner/repo"
          block
        />
        <FormControl.Caption>
          We won’t show the repo name if the PR is from the default repository
        </FormControl.Caption>
      </FormControl>

      <div className={css.sectionSpacing}>
        <FormControl>
          <Checkbox
            name="hideBranchNames"
            defaultChecked={initialConfig?.hideBranchNames ?? false}
          />
          <FormControl.Label>Hide branch names</FormControl.Label>
        </FormControl>
      </div>

      <div className={css.sectionSpacingTight}>
        <FormControl>
          <Checkbox name="hidePrNumbers" defaultChecked={initialConfig?.hidePrNumbers ?? false} />
          <FormControl.Label>Hide PR numbers</FormControl.Label>
        </FormControl>
      </div>
    </>
  );
}

function GitHubBranchesForm({ initialConfig }: { initialConfig?: any }) {
  return (
    <>
      <FormControl className={css.sectionSpacing}>
        <FormControl.Label>Name</FormControl.Label>
        <TextInput name="name" defaultValue={initialConfig?.name ?? ''} block />
        <FormControl.Caption>Optional name for this component</FormControl.Caption>
      </FormControl>

      <FormControl required className={css.sectionSpacing}>
        <FormControl.Label>Repositories</FormControl.Label>
        <Textarea
          name="repositories"
          defaultValue={initialConfig?.repositories?.join('\n') ?? ''}
          placeholder="owner/repo1&#10;owner/repo2"
          block
          rows={5}
        />
        <FormControl.Caption>One repository per line (e.g., "owner/repo")</FormControl.Caption>
      </FormControl>

      <FormControl className={css.sectionSpacing}>
        <FormControl.Label>Branch Filter</FormControl.Label>
        <TextInput
          name="branch"
          defaultValue={initialConfig?.branch ?? ''}
          placeholder="Optional branch name filter"
          block
        />
      </FormControl>

      <div className={css.sectionSpacing}>
        <FormControl>
          <Checkbox name="onlyNoPr" defaultChecked={initialConfig?.onlyNoPr ?? false} />
          <FormControl.Label>Only show branches without PRs</FormControl.Label>
        </FormControl>
      </div>
    </>
  );
}

function DevOpsPrsForm({ initialConfig }: { initialConfig?: any }) {
  return (
    <>
      <FormControl required className={css.sectionSpacing}>
        <FormControl.Label>Name</FormControl.Label>
        <TextInput name="name" defaultValue={initialConfig?.name ?? ''} block />
      </FormControl>

      <FormControl required className={css.sectionSpacing}>
        <FormControl.Label>Organization</FormControl.Label>
        <TextInput
          name="organization"
          defaultValue={initialConfig?.organization ?? ''}
          placeholder="your-organization"
          block
        />
        <FormControl.Caption>
          Azure DevOps organization name (from your DevOps URL)
        </FormControl.Caption>
      </FormControl>

      <FormControl className={css.sectionSpacing}>
        <FormControl.Label>Description</FormControl.Label>
        <Textarea
          name="description"
          defaultValue={initialConfig?.description ?? ''}
          placeholder="Optional description"
          block
          rows={2}
        />
      </FormControl>
    </>
  );
}

function FlashForm({ initialConfig }: { initialConfig?: any }) {
  return (
    <>
      <FormControl required className={css.sectionSpacing}>
        <FormControl.Label>Variant</FormControl.Label>
        <Select name="variant" defaultValue={initialConfig?.variant ?? AlertVariant.info}>
          <Select.Option value={AlertVariant.info}>Info</Select.Option>
          <Select.Option value={AlertVariant.success}>Success</Select.Option>
          <Select.Option value={AlertVariant.warning}>Warning</Select.Option>
          <Select.Option value={AlertVariant.danger}>Danger</Select.Option>
        </Select>
      </FormControl>

      <FormControl required className={css.sectionSpacing}>
        <FormControl.Label>Message</FormControl.Label>
        <Textarea
          name="markdown"
          defaultValue={initialConfig?.markdown ?? ''}
          placeholder="Markdown message content"
          block
          rows={6}
        />
        <FormControl.Caption>Supports Markdown formatting</FormControl.Caption>
      </FormControl>
    </>
  );
}
