import { HttpClient } from '@/shared/lib/http-client/http-client';
import { RawWalkthrough, WalkthroughRequest } from '../types/code-lens.types';
import { creatorHeaders } from '../utils/creator-id';

const GENERATE_PATH = '/api/generate';
const LIBRARY_PATH = '/api/walkthroughs';

/** Asks the backend for a walkthrough; resolves with the model's raw JSON. */
export function requestWalkthrough(
  http: HttpClient,
  request: WalkthroughRequest,
  signal?: AbortSignal,
): Promise<RawWalkthrough> {
  return http.post<RawWalkthrough>(GENERATE_PATH, request, { signal, headers: creatorHeaders() });
}

/** The saved walkthroughs as unchecked rows (id, title, problem, example, canDelete), newest first. */
export function listWalkthroughs(http: HttpClient, signal?: AbortSignal): Promise<unknown> {
  return http.get<unknown>(LIBRARY_PATH, { signal, headers: creatorHeaders() });
}

/** One saved walkthrough's full raw JSON. */
export function fetchWalkthrough(http: HttpClient, id: number): Promise<RawWalkthrough> {
  return http.get<RawWalkthrough>(`${LIBRARY_PATH}/${id}`);
}

/** Deletes a walkthrough; the backend refuses unless this browser created it. */
export function deleteWalkthrough(http: HttpClient, id: number): Promise<void> {
  return http.delete(`${LIBRARY_PATH}/${id}`, { headers: creatorHeaders() });
}
