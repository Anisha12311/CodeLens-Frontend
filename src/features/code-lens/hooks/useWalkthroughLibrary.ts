import { useEffect, useState } from 'react';
import { useHttpClient } from '@/shared/hooks/useHttpClient';
import { HttpError } from '@/shared/lib/http-client/http-client';
import {
  deleteWalkthrough,
  fetchWalkthrough,
  listWalkthroughs,
} from '../services/code-lens.service';
import { LibraryItem, Walkthrough } from '../types/code-lens.types';
import { normalizeWalkthrough } from '../utils/walkthrough-normalize';

export type LibraryStatus = 'loading' | 'ready' | 'error';

function toItems(rows: unknown): LibraryItem[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap(row => {
    if (typeof row !== 'object' || row === null) return [];
    const { id, title, problem, example, canDelete } = row as Record<string, unknown>;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) return [];
    const problemText = typeof problem === 'string' ? problem : '';
    return [
      {
        id: numericId,
        title: (typeof title === 'string' && title) || problemText.slice(0, 60) || 'Untitled',
        canDelete: canDelete === true,
        problem: problemText,
        example: typeof example === 'string' ? example : '',
      },
    ];
  });
}

/** Every saved walkthrough, shared by all students and kept in Supabase by the backend. */
export function useWalkthroughLibrary() {
  const http = useHttpClient();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [status, setStatus] = useState<LibraryStatus>('loading');
  const [notice, setNotice] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listWalkthroughs(http, controller.signal)
      .then(rows => {
        setItems(toItems(rows));
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [http, version]);

  return {
    items,
    status,
    notice,
    /** Loads the list again, for example after a new walkthrough has been saved. */
    reload: () => setVersion(current => current + 1),
    /** The playable walkthrough for one item, or null with a notice when it cannot be opened. */
    async open(id: number): Promise<Walkthrough | null> {
      setNotice('');
      try {
        return normalizeWalkthrough(await fetchWalkthrough(http, id));
      } catch {
        setNotice('That problem could not be opened. Try again.');
        return null;
      }
    },
    /** Deletes a problem this browser created; false with a notice when it was refused. */
    async remove(id: number): Promise<boolean> {
      setNotice('');
      try {
        await deleteWalkthrough(http, id);
        setItems(current => current.filter(item => item.id !== id));
        return true;
      } catch (error: unknown) {
        setNotice(
          error instanceof HttpError && error.status === 403
            ? 'You can only delete problems you created.'
            : 'That problem could not be deleted. Try again.',
        );
        return false;
      }
    },
  };
}
