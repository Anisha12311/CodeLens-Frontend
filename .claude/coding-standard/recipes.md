# Recipes

Complete, lint-clean examples that follow `SKILL.md`. Copy the shape and rename for your page.
All examples are for a page with id `sample-list`.

## 1. A page that loads and shows records

```
src/pages/sample-list/
  index.ts
  SampleListPage.tsx
  components/RecordGrid/RecordGrid.tsx
  hooks/useSampleRecords.ts
  services/sample-list.service.ts
  services/sample-list.mock.ts
  types/sample-list.types.ts
  styles/sample-list.styles.ts
```

### types/sample-list.types.ts

```ts
export type SampleRecordStatus = 'active' | 'inactive';

export interface SampleRecord {
  id: string;
  name: string;
  vesselId: string;
  vesselName: string;
  status: SampleRecordStatus;
  updatedOn?: string;
}
```

### services/sample-list.mock.ts

```ts
import { SampleRecord } from '../types/sample-list.types';

export const MOCK_SAMPLE_RECORDS: SampleRecord[] = [
  {
    id: 'SR-001',
    name: 'Ballast check',
    vesselId: '9321483',
    vesselName: 'Nordic Star',
    status: 'active',
    updatedOn: '2026-03-02',
  },
  {
    id: 'SR-002',
    name: 'Hull survey',
    vesselId: '9418224',
    vesselName: 'Ocean Pearl',
    status: 'inactive',
  },
];
```

### services/sample-list.service.ts

```ts
import { HttpClient } from '@/shared/lib/http-client/http-client';
import { SampleRecord } from '../types/sample-list.types';

const SAMPLE_RECORDS_PATH = '/api/sample-records';

/** All records for a vessel; omit vesselId for every vessel. */
export function fetchSampleRecords(
  http: HttpClient,
  vesselId?: string,
  signal?: AbortSignal,
): Promise<SampleRecord[]> {
  return http.get<SampleRecord[]>(SAMPLE_RECORDS_PATH, { query: { vesselId }, signal });
}

export function saveSampleRecord(http: HttpClient, record: SampleRecord): Promise<SampleRecord> {
  return http.put<SampleRecord>(`${SAMPLE_RECORDS_PATH}/${encodeURIComponent(record.id)}`, record);
}

export function deleteSampleRecord(http: HttpClient, recordId: string): Promise<void> {
  return http.delete(`${SAMPLE_RECORDS_PATH}/${encodeURIComponent(recordId)}`);
}
```

Services take the `HttpClient` from `useHttpClient()` as their first argument and stay free of
React. `query` drops `null`/`undefined` values, so optional filters need no `if`.

Until the API exists, keep the signature and return the mock instead. Applying the filter keeps
the mock behaving like the API. Delete `void http;` when you switch to the real call.

```ts
export function fetchSampleRecords(http: HttpClient, vesselId?: string): Promise<SampleRecord[]> {
  void http;
  const records = MOCK_SAMPLE_RECORDS.filter(record => !vesselId || record.vesselId === vesselId);
  return Promise.resolve(records);
}
```

### hooks/useSampleRecords.ts

```ts
import { useApiErrorPopup } from '@ship-ops/error-handling';
import { useEffect, useState } from 'react';
import { useHttpClient } from '@/shared/hooks/useHttpClient';
import { fetchSampleRecords } from '../services/sample-list.service';
import { SampleRecord } from '../types/sample-list.types';

interface LoadedRecords {
  requestKey: string;
  records: SampleRecord[];
}

export function useSampleRecords(vesselId?: string) {
  const http = useHttpClient();
  const { showApiError, apiErrorPopup } = useApiErrorPopup({
    showDetails: process.env.NODE_ENV !== 'production',
  });
  const [reloadCount, setReloadCount] = useState(0);
  const [loaded, setLoaded] = useState<LoadedRecords>();
  const requestKey = `${vesselId ?? ''}#${reloadCount}`;

  useEffect(() => {
    // Aborted on cleanup: a vessel change or unmount cancels the request in flight.
    const controller = new AbortController();
    // Rejects on failure: the popup's Try again awaits it and shows the new error itself.
    const requestRecords = () =>
      fetchSampleRecords(http, vesselId, controller.signal).then(records => {
        if (!controller.signal.aborted) setLoaded({ requestKey, records });
      });

    requestRecords().catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setLoaded({ requestKey, records: [] });
      showApiError(error, { onRetry: requestRecords });
    });
    return () => controller.abort();
  }, [http, vesselId, requestKey, showApiError]);

  return {
    records: loaded?.records ?? [],
    // Derived, not stored: a newer request can never be marked done by an older one.
    isLoading: loaded?.requestKey !== requestKey,
    reloadRecords: () => setReloadCount(count => count + 1),
    apiErrorPopup,
  };
}
```

`showApiError` is stable, so it is safe as a dependency. If you pass `onError` to
`useApiErrorPopup`, wrap it in `useCallback`; otherwise `loadRecords` changes every render and
the effect loops.

### hooks/useSaveSampleRecord.ts

Writes run from an event handler, so setting `isSaving` directly is fine there.

```ts
import { useApiErrorPopup } from '@ship-ops/error-handling';
import { useState } from 'react';
import { useHttpClient } from '@/shared/hooks/useHttpClient';
import { saveSampleRecord } from '../services/sample-list.service';
import { SampleRecord } from '../types/sample-list.types';

export function useSaveSampleRecord(onSaved: (record: SampleRecord) => void) {
  const http = useHttpClient();
  const { showApiError, apiErrorPopup } = useApiErrorPopup({
    showDetails: process.env.NODE_ENV !== 'production',
  });
  const [isSaving, setIsSaving] = useState(false);

  const saveRecord = (record: SampleRecord) => {
    const requestSave = () => saveSampleRecord(http, record).then(onSaved);
    setIsSaving(true);
    requestSave()
      .catch((error: unknown) => showApiError(error, { onRetry: requestSave }))
      .finally(() => setIsSaving(false));
  };

  return { saveRecord, isSaving, apiErrorPopup };
}
```

A 400/422 `HttpError` carries the server's field errors in `error.data`, and the popup lists them.

### components/RecordGrid/RecordGrid.tsx

```tsx
import { DataGridPro, GridColDef } from '@mui/x-data-grid-pro';
import { formatDate } from '@/shared/lib/formatDate/formatDate';
import { useTestId } from '@/shared/lib/test-id/test-id';
import { SampleRecord } from '../../types/sample-list.types';

const COLUMNS: GridColDef<SampleRecord>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'vesselName', headerName: 'Vessel', flex: 1 },
  { field: 'status', headerName: 'Status', width: 120 },
  {
    field: 'updatedOn',
    headerName: 'Updated',
    width: 140,
    valueFormatter: (value?: string) => formatDate(value),
  },
];

const getRecordId = (record: SampleRecord) => record.id;

// Fills its ScrollPanel and scrolls its own rows; never autoHeight (module-layout skill).
const GRID_SX = { flex: 1, minHeight: 0, border: 0 };

interface RecordGridProps {
  records: SampleRecord[];
  isLoading: boolean;
  onOpen(record: SampleRecord): void;
}

export default function RecordGrid({ records, isLoading, onOpen }: RecordGridProps) {
  const tid = useTestId();
  const dataState = isLoading ? 'loading' : records.length ? 'ready' : 'empty';

  return (
    <DataGridPro
      rows={records}
      columns={COLUMNS}
      getRowId={getRecordId}
      loading={isLoading}
      onRowClick={({ row }) => onOpen(row)}
      disableRowSelectionOnClick
      sx={GRID_SX}
      data-state={dataState}
      {...tid('records-table')}
    />
  );
}
```

### SampleListPage.tsx

```tsx
import { useModuleContext } from '@/shared/context/ModuleContextProvider';
import { useSubRoute } from '@/shared/hooks/useSubRoute';
import { TestIdScope, useTestId } from '@/shared/lib/test-id/test-id';
import RecordGrid from './components/RecordGrid/RecordGrid';
import { useSampleRecords } from './hooks/useSampleRecords';
import { PageFrame, PageHeader, ScrollPanel } from '@/shared/styled';
import { PageTitle } from './styles/sample-list.styles';

export default function SampleListPage() {
  const { page, params } = useModuleContext();
  const { navigateRelative } = useSubRoute();
  const { records, isLoading, apiErrorPopup } = useSampleRecords(params?.vessel);
  const tid = useTestId();

  return (
    <PageFrame {...tid('page-panel')}>
      {apiErrorPopup}
      <PageHeader>
        <PageTitle variant="h6" {...tid('title-label')}>
          {page}
        </PageTitle>
      </PageHeader>
      <ScrollPanel {...tid('records-panel')}>
        <TestIdScope id="records">
          <RecordGrid
            records={records}
            isLoading={isLoading}
            onOpen={record => navigateRelative(record.id)}
          />
        </TestIdScope>
      </ScrollPanel>
    </PageFrame>
  );
}
```

## 2. An edit form with unsaved-changes protection

```tsx
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges';
import { useTestId } from '@/shared/lib/test-id/test-id';
import { SampleRecord } from '../../types/sample-list.types';

interface RecordFormProps {
  record: SampleRecord;
  isSaving: boolean;
  onSave(record: SampleRecord): void;
}

export default function RecordForm({ record, isSaving, onSave }: RecordFormProps) {
  const [name, setName] = useState(record.name);
  const tid = useTestId();
  const isDirty = name !== record.name;
  const isNameValid = name.trim().length > 0;

  useUnsavedChanges(isDirty, `Changes to ${record.name} have not been saved.`);

  return (
    <Stack spacing={2} component="form" {...tid('record-form')}>
      <TextField
        label="Name"
        value={name}
        onChange={event => setName(event.target.value)}
        error={!isNameValid}
        helperText={isNameValid ? undefined : 'Enter a name.'}
        {...tid('name-input')}
      />
      <Button
        variant="contained"
        disabled={!isDirty || !isNameValid || isSaving}
        onClick={() => onSave({ ...record, name: name.trim() })}
        {...tid('save-btn')}
      >
        Save
      </Button>
    </Stack>
  );
}
```

## 3. A dialog (portal) with test ids

MUI `Dialog` renders into `document.body`, so re-establish the scope inside it:

```tsx
<Dialog open={isOpen} onClose={onClose}>
  <TestIdScope id="delete-dialog">
    <DialogTitle {...tid()}>Delete record?</DialogTitle>
    <DialogActions>
      <Button onClick={onClose} {...tid('cancel-btn')}>
        Cancel
      </Button>
      <Button color="error" onClick={onConfirm} {...tid('confirm-btn')}>
        Delete
      </Button>
    </DialogActions>
  </TestIdScope>
</Dialog>
```

Because `tid` is read from the scope at the call site, call `useTestId()` in a child component
rendered inside the `TestIdScope` (for example `DeleteDialogContent`). If you call it in the parent,
it emits the parent's scope.

## 4. Nested routes inside a page

```tsx
const { segments, navigateRelative } = useSubRoute();
const [recordId] = segments;

if (recordId) return <RecordDetails recordId={recordId} onBack={() => navigateRelative('..')} />;
return <RecordList onOpen={record => navigateRelative(record.id)} />;
```

## 5. Isolating a fragile widget

```tsx
import { UiErrorBoundary } from '@ship-ops/error-handling';

<UiErrorBoundary title="Vessel summary stopped working" resetKeys={[vesselId]}>
  <VesselSummary vesselId={vesselId} />
</UiErrorBoundary>;
```
