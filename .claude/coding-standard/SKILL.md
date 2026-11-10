---
name: coding-standards
description: How to write code in this ShipSure module - component, hook, service, type, style and util patterns; API calls with useHttpClient (get/post/put/patch/delete); API and UI error popups; module context, token and correlation id; unsaved changes; nested routes; theming; performance-by-default rules (memoization, lists, fetching, lazy loading); naming, imports, TypeScript and comment rules. Use whenever writing, editing or reviewing any .ts/.tsx under src/ - building a page or feature, adding an API call, form, dialog, grid or hook - or when asked about code style, conventions, patterns or "how should I write this". Use together with the architecture skill (where code goes) and the test-ids skill.
---

# Coding standards

The `architecture` skill decides **where** a file goes. This skill decides **how it is written**.
Both apply to every change under `src/`, plus `test-ids` for any JSX and `module-layout` for any
page or layout.

Before writing, read the nearest existing file of the same kind and copy its shape. The reference
files are `src/pages/sample-list/` and `src/shared/`. `recipes.md` has a complete worked feature
(types → mock → service → hook → components → page). Read it before building anything that loads
data.

## Non-negotiables

1. **Never call `fetch` (or axios) from module code.** Every API call goes through the
   `HttpClient` from `useHttpClient()` (`@/shared/hooks/useHttpClient`). A hook gets the client
   and passes it to a `services/` function, which calls `http.get/post/put/patch/delete`.
2. **Never handle the token or correlation id yourself.** The client adds the bearer token (the
   shell's live one when embedded) and `X-Correlation-ID`. Do not store `ctx.token` in state, refs
   or module variables, or put either value in headers by hand.
3. **Never edit the shell contract casually.** `shell-entry.tsx` (`mount`/`update`/`beforeClose`/
   `unmount`/`signalsReady`) and `shared/types/contract/contract.ts` are the agreement with the App
   Shell. Change them only when the task is explicitly about the contract.
4. **Never import `@ship-ops/auth` or `@ship-ops/application-access` outside
   `src/app/standalone/`.** The host must never load them.
5. **No hard-coded colours or fonts in pages.** Use the theme (`theme.palette.*`,
   `theme.spacing()`, `color="text.secondary"`). Everything must work in both `light` and `dark`.
6. **No new dependencies** without asking the user first, and state the gzipped size the
   dependency adds (measured as in the `bundle-performance` skill). React, MUI 7, MUI X Data Grid
   Pro (v8), emotion and `@ship-ops/*` are already available.
7. **Do not weaken tooling.** Do not add `eslint-disable`, `@ts-ignore`, `@ts-expect-error` or
   `as any` to make a check pass. Fix the code.

## File patterns

| Kind        | Export style                        | Shape                                                                                                           |
| ----------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Page        | `export default function XPage()`   | Composes components; reads context; calls page hooks; renders `apiErrorPopup`. No `fetch`, no business logic.   |
| Component   | `export default function X(props)`  | One component per file, `components/X/X.tsx`. Presentational where possible; data comes in through props/hooks. |
| Hook        | `export function useX()`            | `hooks/useX.ts`. Owns state, effects and service calls. Returns a plain object.                                 |
| Service     | `export function fetchX()` (named)  | `services/<page-id>.service.ts`. Thin wrappers over `HttpClient`. No React, no state.                           |
| Mock        | `export const MOCK_X` (named)       | `services/<page-id>.mock.ts`. Typed sample data used until the API exists.                                      |
| Types       | `export interface` / `export type`  | `types/<page-id>.types.ts`. API shapes and view models. No runtime code.                                        |
| Styles      | `export const X = styled(...)(...)` | `styles/<page-id>.styles.ts`. Theme-driven `styled()` components.                                               |
| Utils / lib | `export function x()` (named)       | Pure functions, no React, no I/O.                                                                               |
| Constants   | `export const UPPER_SNAKE`          | Page constants at the top of the file that uses them, or `constants/` when shared.                              |

- Components use **default** exports. Everything else uses **named** exports.
- Use `function` declarations for components, hooks and helpers. Use arrow functions for inline
  callbacks and small local closures.

### Components

```tsx
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTestId } from '@/shared/lib/test-id/test-id';
import { SampleRecord } from '../../types/sample-list.types';

interface RecordToolbarProps {
  selectedRecord?: SampleRecord;
  onAdd(): void;
  onEdit(record: SampleRecord): void;
}

export default function RecordToolbar({ selectedRecord, onAdd, onEdit }: RecordToolbarProps) {
  const tid = useTestId();

  return (
    <Stack direction="row" spacing={1} {...tid('toolbar-panel')}>
      <Button variant="contained" onClick={onAdd} {...tid('add-btn')}>
        Add
      </Button>
      <Button
        variant="outlined"
        disabled={!selectedRecord}
        onClick={() => selectedRecord && onEdit(selectedRecord)}
        {...tid('edit-btn')}
      >
        Edit
      </Button>
    </Stack>
  );
}
```

- Props: type them inline for one or two props (`{ size = 18 }: { size?: number }`). For more
  props, declare `interface XProps` directly above the component. Give defaults in the destructuring.
- Callback props are named `onX` and typed as methods (`onEdit(record: SampleRecord): void`).
  Handlers inside the component are named `handleX`.
- Call `const tid = useTestId();` once at the top. Spread `{...tid('name-suffix')}` last on the
  element. Wrap sections and rows in `TestIdScope` (see the `test-ids` skill).
- Render loading, empty and error states explicitly. Each one gets a test id and a `data-state`.
- `key` is a stable business id, never an array index.
- Keep components under about 150 lines. Split out a child component or move logic into a hook
  before going further.

### Hooks and data loading

Data flows **service → hook → component**. A page hook:

- gets `const http = useHttpClient();` and passes `http` to the service,
- loads inside one `useEffect` with an `AbortController`, passing `controller.signal` to the
  service and calling `controller.abort()` in the cleanup, so outdated requests are cancelled and
  their results dropped,
- calls `showApiError(error, { onRetry: requestX })` from `@ship-ops/error-handling` on failure.
  `requestX` rejects when it fails, and the popup re-shows the new error itself,
- **derives** `isLoading` instead of calling `setIsLoading(true)` in the effect,
- returns `{ data, isLoading, reloadX, apiErrorPopup }`, and the page renders `{apiErrorPopup}`.

The lint config includes the React Compiler rules. They reject calling `setState` synchronously
inside an effect (`react-hooks/set-state-in-effect`) and a `useCallback` that refers to itself
(`react-hooks/immutability`). Follow the recipe and you will not hit either.

Writes (save, delete) follow `useSaveSampleRecord` in `recipes.md`. They run from an event
handler, keep an `isSaving` flag and show failures through the same popup.

See the full `useSampleRecords` in `recipes.md`. `useAsyncData` (in `shared/hooks/`) is fine for a
read-only load that runs once on mount and needs no retry or popup. It does **not** reload when its
inputs change.

- `react-hooks/exhaustive-deps` is off in this repo, so you own the dependency arrays. List every
  value the effect reads. When an effect intentionally runs only on mount, add a one-line comment
  saying so (see `useRoutedPage.ts`).
- **Memoization is opt-in.** The React Compiler is **not** enabled here; only its lint rules are.
  Add `useMemo`/`useCallback`/`memo` only for:
  - a value used as an effect dependency, where a new identity would refetch or loop,
  - a context `value` object,
  - arrays or functions a library compares by identity (`DataGridPro` `columns`/`rows`,
    `Autocomplete` `options`),
  - a computation measured as slow.

  A `useCallback` passed to a child that is not memoized buys nothing. Speed work on existing code
  follows the `react-runtime-performance` skill: profile first, then fix.

- **Derived values are computed during render, not stored in state.** No effect that copies props
  into state (see `isDirty` in `DraftNote` and `isLoading` in the recipe).
- Lazy-initialise expensive `useState` defaults: `useState(() => buildIndex(rows))`.
- Per-instance storage (sessionStorage/localStorage keys) must include `ctx.instanceId`. Two tabs
  of this module can be open at once.

### Services

```ts
import { HttpClient } from '@/shared/lib/http-client/http-client';
import { SampleRecord } from '../types/sample-list.types';

export function fetchSampleRecords(
  http: HttpClient,
  vesselId?: string,
  signal?: AbortSignal,
): Promise<SampleRecord[]> {
  return http.get<SampleRecord[]>('/api/sample-records', { query: { vesselId }, signal });
}

export function saveSampleRecord(http: HttpClient, record: SampleRecord): Promise<SampleRecord> {
  return http.put<SampleRecord>(`/api/sample-records/${encodeURIComponent(record.id)}`, record);
}
```

The `HttpClient` API (`shared/lib/http-client/http-client.ts`):

| Call                                               | Notes                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `http.get<T>(path, { query?, signal?, headers? })` | `query` skips `null`/`undefined`; arrays repeat the key                                                |
| `http.post<T>(path, body?, options?)`              | Plain objects are sent as JSON; `FormData`, `Blob`, `URLSearchParams` and strings are sent as they are |
| `http.put<T>` / `http.patch<T>`                    | Same as `post`                                                                                         |
| `http.delete<T = void>(path, options?)`            |                                                                                                        |

- Responses: JSON is parsed, an empty body (204) gives `undefined`, and anything else comes back as
  text. A non-2xx response throws `HttpError` (`status`, `data`, `url`, `method`), which
  `showApiError` understands. Network failures and aborts reject with the browser's error.
- Paths start with `/` and never include a host. The shell's `apiOrigin` is prefixed for you.
- Escape path segments with `encodeURIComponent`. Pass filters through `query`, not string
  concatenation.
- Map API shapes to view models here or in `utils/`, not in components.
- Outside React (rare), call `request(path, { method, body, token, correlationId })` directly.
  Never write a second HTTP helper.
- While the API does not exist, return typed mock data from `<page-id>.mock.ts` behind the same
  function signature, so swapping to the real call changes only the service body.

### Types

- Prefer `interface` for object shapes and `type` for unions and aliases.
- Name API payloads after the resource (`SampleRecord`) and view models by purpose
  (`SampleRecordRow`). Optional fields use `?`, not `| undefined`.
- Do not use `any`, even though lint allows it. Use `unknown` and narrow it (`catch (error: unknown)`).
- Only `export` what other files use.
- Keep types in `.types.ts` files, which contain no runtime code. If you must take a type from a
  file that has runtime code, use `import type` so the import never pulls that code into a chunk.

### Styles

```ts
export const RecordCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));
```

- Repeated or non-trivial styles go in `styled()`. Use `sx` only for small one-offs (`sx={{ mt: 3 }}`).
- Never call `styled()` inside a component. It is recreated on every render and remounts the DOM
  node. In rows or cells rendered many times, move static `sx` objects to module scope or use
  `styled()`.
- Use theme spacing, palette and typography, never raw hex values. Use `shellTokensFor(mode)` only
  when matching App Shell chrome, as `ShellPrimaryButton` does.
- Module-wide palette or typography changes go only in `shared/styled/theme/theme.ts`.
- Do not add global CSS or `CssBaseline`. The module renders inside the shell's page.
- Page layout follows the `module-layout` skill: every page root is `PageFrame`, the module never
  grows past the screen, and only the grid/table/body inside it scrolls. No `100vh` or `autoHeight`.

## Module integration

- **Context:** read host data with `useModuleContext()`: `page`, `subPath`, `params`, `theme`,
  `token`, `correlationId`, `user`, `navigate`, `instanceId`. All of them are optional because
  standalone and older shells omit some. Handle `undefined`.
- **Nested routes:** use `useSubRoute()` (`segments`, `navigateRelative('new' | '..')`,
  `canNavigate`). Never touch `window.history` from a page.
- **Opening another page:** use `navigate(pageName, subPath | params)` from context, guarded by
  `navigate &&`.
- **Unsaved changes:** call `useUnsavedChanges(isDirty, 'Specific message.')` once per form or edit
  dialog. Compute `isDirty` by comparing the current value with the last saved value, as `DraftNote`
  does.
- **Launch readiness:** `App` calls `ctx.ready()` after the first render. Move it only if the first
  screen is useless without data, and then make sure every path, including errors, still calls it.
- **UI errors:** pages are already inside `UiErrorBoundary`. Wrap an independent region (a side
  panel, a widget) in its own `UiErrorBoundary` so a crash there leaves the rest of the page working.
- **Dates:** display them with `formatDate` from `@/shared/lib/formatDate/formatDate`, which gives `DD MMM YYYY` (`26 Mar 2026`): two-digit day, three-letter English month, four-digit year. Never format dates by hand or with `toLocaleDateString`.
- **Grids:** use `DataGridPro` from `@mui/x-data-grid-pro`, with `getRowId` set to the business id.
  Declare `columns` and `getRowId` outside the component, or in `useMemo` when they depend on
  props. `rows` must come from state or `useMemo`, never `.filter()`/`.map()` inline in JSX.

## Performance by default

Write code that does not need a later performance pass. These rules apply to all new code. When a
user reports slowness, use the `react-runtime-performance` skill (laggy once loaded) or the
`bundle-performance` skill (slow to load) instead of guessing.

- **Lists:** more than about 100 rows, or any list that can grow without limit, goes in
  `DataGridPro`, which virtualizes rows. Never `.map()` thousands of rows into MUI `Table` or `Stack`.
- **Fetch what is shown.** For large sets, use server-side paging, sorting and filtering
  (`paginationMode="server"`) instead of loading everything and slicing it in the browser.
- **Independent requests run in parallel** with `Promise.all`, followed by one `setState`. Each
  `await` between `setState` calls costs a render and a round trip.
- **Search inputs:** debounce input that triggers a request (about 300 ms, cancelling the previous
  request with its `AbortSignal`). For expensive filtering in the browser, use `useDeferredValue`.
- **Lookups:** build a `Map` once (`recordById`) instead of calling `.find()` inside `.map()`.
- **Listeners:** every `addEventListener` in an effect has a matching `removeEventListener` in the
  cleanup. Scroll and touch listeners are `{ passive: true }`. Prefer `ResizeObserver` or
  `IntersectionObserver` to measuring by hand.
- **Hidden heavy UI is not mounted.** Render a closed dialog's or inactive tab's heavy content only
  when it is open or active.
- **Heavy, interaction-only code is loaded on demand.** Load charts, editors, exporters and
  viewers with `lazy(() => import('./components/X/X'))` inside `<Suspense>`, and give them a
  loading state. They must not be imported statically elsewhere, or the split does nothing.

## Naming

- Use full, descriptive words: `containerElement`, `loadedRecords`, `selectedVesselId`. Not `el`,
  `data2` or `res`. Write `event` and `error`, not `e` or `err`.
- Booleans start with `is`, `has`, `can` or `should`: `isLoading`, `hasUnsavedChanges`, `canNavigate`.
- Name lookup maps `valueByKey`: `pageIdByName`, `recordById`.
- Constants are `UPPER_SNAKE_CASE`. Components and types are `PascalCase`. Everything else is
  `camelCase`.
- Name files as described in the `architecture` skill: `PascalCase.tsx` for components, `useX.ts`
  for hooks, `<page-id>.<concern>.ts` for the rest.

## Imports

- Import MUI components from their own path (`import Button from '@mui/material/Button'`), not
  from the `@mui/material` barrel. Import `styled` and theme types from `@mui/material/styles`.
- Order imports in three groups: packages (MUI, React, `@ship-ops/*`), then `@/` imports, then
  relative imports.
- Follow the `architecture` skill's rules for relative paths, `@/` and barrel files.

## Formatting and comments

- Prettier owns formatting: single quotes, semicolons, trailing commas, 100-character lines,
  `arrowParens: avoid` (`item => item.id`). Do not hand-format against it.
- Write at most one short line of comment, and only to explain **why**. Exported helpers get a
  one-line `/** ... */` saying what they return or guarantee. Do not comment what the code already
  says, and do not leave commented-out code or TODOs without a ticket.
- Log with a bracketed prefix (`[${MODULE_ID}]`, `[runtime-config]`) and include `correlationId`
  when you have it. Do not leave debugging `console.log` calls.
- User-facing text should be plain, sentence case and specific: "Your Sample List note has not been
  saved.", not "Error!".

## Before finishing

Run all of these and fix every failure. Do not report the work as done while any of them fails.

```bash
npm run typecheck
npm run lint
npm run format
node .claude/skills/test-ids/scripts/check-test-ids.js
```

Then re-read your diff against the **Non-negotiables** above. If you could not run something, say
so; never claim it passed.
