import { KebabHorizontalIcon, PencilIcon, TrashIcon } from '@primer/octicons-react';
import {
  ActionList,
  ActionMenu,
  Box,
  Button,
  Dialog,
  FormControl,
  Heading,
  PageLayout,
  Link as PrimerLink,
  Select,
  TextInput,
  Textarea,
} from '@primer/react';
import { inspect, isString } from '@sequelize/utils';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionMenuIconButton } from '../action-menu-icon-button.tsx';
import type { TabConfiguration } from '../app-configuration.tsx';
import {
  AppConfigurationSchema,
  UserNameStyle,
  useAppConfiguration,
} from '../app-configuration.tsx';
import { DeletionConfirmationDialog } from '../deletion-confirmation-dialog.tsx';
import { DevOpsPatFormControl } from '../devops-pat-form-control.tsx';
import { GithubPatFormControl } from '../github-pat-form-control.tsx';
import type { ListColumn } from '../list.tsx';
import { List } from '../list.tsx';
import { InlineCode, P } from '../markdown-components.tsx';
import { useDevOpsPat } from '../use-devops-pat.tsx';
import { useGithubPat } from '../use-github-pat.ts';
import { getFormValue, getFormValues } from '../utils/get-form-values.ts';

export function Settings() {
  const [githubPat, setGithubPat] = useGithubPat();
  const [devOpsPat, setDevOpsPat] = useDevOpsPat();
  const [appConfiguration, setAppConfiguration] = useAppConfiguration();

  const onGithubPatChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setGithubPat(event.currentTarget.value);
    },
    [setGithubPat],
  );

  const onDevOpsPatChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDevOpsPat(event.currentTarget.value);
    },
    [setDevOpsPat],
  );

  const configurationAsJson = useMemo(
    () => JSON.stringify(appConfiguration, null, 2),
    [appConfiguration],
  );

  const onAppConfigurationChange = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const newConfigurationJson = getFormValue(event.currentTarget, 'app-configuration');
      isString.assert(newConfigurationJson);

      const newConfiguration = JSON.parse(newConfigurationJson);
      if (!AppConfigurationSchema.safeParse(newConfiguration).success) {
        // TODO: better error handling
        alert('Invalid configuration');

        return;
      }

      setAppConfiguration(newConfiguration);
    },
    [setAppConfiguration],
  );

  const onUserNameStyleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.currentTarget.value;

      setAppConfiguration(oldConfig => {
        return {
          ...oldConfig,
          userNameStyle: value as UserNameStyle,
        };
      });
    },
    [setAppConfiguration],
  );

  return (
    <PageLayout containerWidth="medium">
      <PageLayout.Header>
        <Heading>General Settings</Heading>
      </PageLayout.Header>
      <PageLayout.Content>
        <GithubPatFormControl value={githubPat} onChange={onGithubPatChange} />
        <DevOpsPatFormControl value={devOpsPat} onChange={onDevOpsPatChange} sx={{ mt: 3 }} />

        <FormControl sx={{ mt: 3 }}>
          <FormControl.Label>User Name Display</FormControl.Label>
          <Select block onChange={onUserNameStyleChange} value={appConfiguration.userNameStyle}>
            <Select.Option value={UserNameStyle.login}>Username</Select.Option>
            <Select.Option value={UserNameStyle.name}>Name</Select.Option>
            <Select.Option value={UserNameStyle.full}>Name + Username</Select.Option>
          </Select>
          <FormControl.Caption>
            <span role="img" aria-label="Caution">
              ⚠️
            </span>{' '}
            Names are not unique. Not displaying the username makes it possible for users to
            impersonate other users.
            <br />
            Consider only enabling this if your repositories do not accept contribution from users
            outside of your organization.
          </FormControl.Caption>
        </FormControl>

        <TabList />

        <form onSubmit={onAppConfigurationChange}>
          <FormControl sx={{ mt: 3 }}>
            <FormControl.Label>App Configuration</FormControl.Label>
            <Textarea
              block
              defaultValue={configurationAsJson}
              key={configurationAsJson}
              name="app-configuration"
            />
          </FormControl>
          <Button type="submit" sx={{ marginTop: 2, marginLeft: 'auto' }}>
            Save Configuration
          </Button>
        </form>
      </PageLayout.Content>
    </PageLayout>
  );
}

function TabList() {
  const [appConfiguration] = useAppConfiguration();
  const [openModal, setOpenModal] = useState<['delete' | 'edit', index: number] | 'new' | null>(
    null,
  );

  const onCloseModal = useCallback(() => setOpenModal(null), []);

  const tabCount = appConfiguration.tabs.length;
  const columns: Array<ListColumn<TabConfiguration>> = useMemo(() => {
    return [
      {
        id: 'name',
        renderCell: data => (
          <>
            <P>{data.name}</P>
            <P>
              <PrimerLink as={Link} to={`/d/${data.slug}`}>
                <InlineCode>/d/{data.slug}</InlineCode>
              </PrimerLink>
            </P>
          </>
        ),
      },
      {
        align: 'right',
        id: 'actions',
        renderCell: (_data, index) => {
          return (
            <ActionMenuIconButton icon={KebabHorizontalIcon} aria-label="Tab Actions">
              <ActionMenu.Overlay width="auto">
                <ActionList>
                  <ActionList.Item onClick={() => setOpenModal(['edit', index])}>
                    <ActionList.LeadingVisual>
                      <PencilIcon />
                    </ActionList.LeadingVisual>
                    Edit
                  </ActionList.Item>
                  <ActionList.Item
                    onClick={tabCount === 1 ? undefined : () => setOpenModal(['delete', index])}
                    variant="danger"
                    disabled={tabCount === 1}>
                    <ActionList.LeadingVisual>
                      <TrashIcon />
                    </ActionList.LeadingVisual>
                    Delete
                  </ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenuIconButton>
          );
        },
      },
    ];
  }, [tabCount]);

  return (
    <>
      <Heading as="h3" sx={{ marginTop: 3, fontSize: 1 }}>
        Tabs
      </Heading>
      {/* TODO: drag & drop re-order */}
      <List
        columns={columns}
        data={appConfiguration.tabs}
        getRowKey={(row, index) => {
          return row.slug + index;
        }}
      />
      <Button
        type="button"
        sx={{ marginTop: 2, marginLeft: 'auto' }}
        onClick={() => setOpenModal('new')}>
        Add Tab
      </Button>

      {openModal === 'new' ? (
        <NewTabDialog onDismiss={onCloseModal} />
      ) : openModal === null ? null : openModal[0] === 'edit' ? (
        <EditTabDialog index={openModal[1]} onDismiss={onCloseModal} />
      ) : (
        <DeleteTabDialog index={openModal[1]} onDismiss={onCloseModal} />
      )}
    </>
  );
}

interface NewTabActionProps {
  onDismiss(this: void): void;
}

function NewTabDialog({ onDismiss }: NewTabActionProps) {
  const [appConfiguration, setAppConfiguration] = useAppConfiguration();

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const values = getFormValues(event.currentTarget);

      isString.assert(values.name);
      isString.assert(values.slug);

      if (values.slug.length === 0) {
        alert('Slug is required');

        return;
      }

      if (values.name.length === 0) {
        alert('Name is required');

        return;
      }

      if (appConfiguration.tabs.some(t => t.slug === values.slug)) {
        alert('Slug is already used');

        return;
      }

      setAppConfiguration({
        ...appConfiguration,
        tabs: [
          ...appConfiguration.tabs,
          {
            name: values.name,
            slug: values.slug,
            components: [],
          },
        ],
      });

      onDismiss();
    },
    [appConfiguration, onDismiss, setAppConfiguration],
  );

  return (
    <Dialog isOpen onDismiss={onDismiss} aria-labelledby="header">
      <Dialog.Header id="header">New Tab</Dialog.Header>
      <Box p={3} as="form" onSubmit={onSubmit}>
        <FormControl required>
          <FormControl.Label>Name</FormControl.Label>
          <TextInput block name="name" minLength={1} />
        </FormControl>

        <FormControl sx={{ marginTop: 2 }}>
          <FormControl.Label>Path</FormControl.Label>
          <FormControl.Caption>
            The URL pathname that leads to this tab. Accepts only numbers, dashes and lowercase
            letters.
          </FormControl.Caption>
          <TextInput
            monospace
            block
            leadingVisual="/d/"
            name="slug"
            pattern="^[a-z0-9\-]+$"
            minLength={1}
          />
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, marginTop: 2 }}>
          <Button type="submit">Save</Button>
        </Box>
      </Box>
    </Dialog>
  );
}

interface EditTabActionProps {
  index: number;
  onDismiss(this: void): void;
}

function EditTabDialog(props: EditTabActionProps) {
  const [appConfiguration, setAppConfiguration] = useAppConfiguration();
  const { index, onDismiss } = props;
  const tab = appConfiguration.tabs[index];

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const values = getFormValues(event.currentTarget);

      isString.assert(values.name);
      isString.assert(values.slug);

      if (values.slug.length === 0) {
        alert('Slug is required');

        return;
      }

      if (values.name.length === 0) {
        alert('Name is required');

        return;
      }

      if (appConfiguration.tabs.some((t, i) => i !== index && t.slug === values.slug)) {
        alert('Slug is already used');

        return;
      }

      setAppConfiguration({
        ...appConfiguration,
        tabs: appConfiguration.tabs.toSpliced(index, 1, {
          ...tab,
          name: values.name,
          slug: values.slug,
        }),
      });

      onDismiss();
    },
    [appConfiguration, index, onDismiss, setAppConfiguration, tab],
  );

  return (
    <Dialog isOpen onDismiss={onDismiss} aria-labelledby="header">
      <Dialog.Header id="header">Edit: {tab.name}</Dialog.Header>
      <Box p={3} as="form" onSubmit={onSubmit}>
        <FormControl required>
          <FormControl.Label>Name</FormControl.Label>
          <TextInput block defaultValue={tab.name} name="name" minLength={1} />
        </FormControl>

        <FormControl sx={{ marginTop: 2 }} required>
          <FormControl.Label>Path</FormControl.Label>
          <FormControl.Caption>
            The URL pathname that leads to this tab. Accepts only numbers, dashes and lowercase
            letters.
          </FormControl.Caption>
          <TextInput
            monospace
            block
            defaultValue={tab.slug}
            leadingVisual="/d/"
            name="slug"
            pattern="^[a-z0-9\-]+$"
            minLength={1}
          />
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, marginTop: 2 }}>
          <Button type="submit">Save</Button>
        </Box>
      </Box>
    </Dialog>
  );
}

function DeleteTabDialog(props: EditTabActionProps) {
  const [appConfiguration, setAppConfiguration] = useAppConfiguration();
  const { index, onDismiss } = props;
  const tab = appConfiguration.tabs[index];

  const onDelete = useCallback(() => {
    setAppConfiguration({
      ...appConfiguration,
      tabs: appConfiguration.tabs.toSpliced(index, 1),
    });

    onDismiss();
  }, [appConfiguration, onDismiss, index, setAppConfiguration]);

  return (
    <DeletionConfirmationDialog
      onDelete={onDelete}
      onCancel={onDismiss}
      title="Delete Tab?"
      text={
        <P>You are about to delete the {inspect(tab.name)} tab. This action cannot be undone.</P>
      }
    />
  );
}
