import { useRef, useState } from 'react';
import { useHttpClient } from '@/shared/hooks/useHttpClient';
import { HttpError } from '@/shared/lib/http-client/http-client';
import { requestWalkthrough } from '../services/code-lens.service';
import { RawWalkthrough, Walkthrough, WalkthroughRequest } from '../types/code-lens.types';
import { normalizeWalkthrough } from '../utils/walkthrough-normalize';

export type StatusKind = 'idle' | 'busy' | 'error';

export interface GeneratorStatus {
  text: string;
  kind: StatusKind;
}

const IDLE: GeneratorStatus = { text: '', kind: 'idle' };
const OFF_MESSAGE =
  'Making new animations is not set up on the backend yet. Problems already in the library still open.';

const MESSAGE_BY_CODE: Record<string, string> = {
  rate_limited: 'The animation service is busy right now. Try again in a minute.',
  too_many_requests: "You've reached 5 new walkthroughs this hour. Please try again later.",
  timeout: 'This took too long. Please try again.',
  upstream: 'The animation service could not be reached. Try again in a minute.',
  invalid_json:
    'The answer could not be turned into an animation. Try again, or shorten the problem.',
  too_large: 'The problem is too long. Paste only the statement and one example.',
  bad_request: 'Paste a problem or type its name first.',
};

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function errorCodeOf(error: unknown) {
  if (!(error instanceof HttpError)) return undefined;
  const data = error.data;
  return typeof data === 'object' && data !== null && 'code' in data
    ? String(data.code)
    : undefined;
}

interface GeneratorOptions {
  onReady(walkthrough: Walkthrough, raw: RawWalkthrough, request: WalkthroughRequest): void;
}

/** Sends a pasted problem to the server and reports progress for the status line. */
export function useWalkthroughGenerator({ onReady }: GeneratorOptions) {
  const http = useHttpClient();
  const controllerRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<GeneratorStatus>(IDLE);
  const [isAvailable, setIsAvailable] = useState(true);
  const isBusy = status.kind === 'busy';

  const handleFailure = (error: unknown) => {
    const code = errorCodeOf(error);
    if (isAbort(error) || code === 'cancelled')
      return setStatus({ text: 'Stopped.', kind: 'idle' });
    if (code === 'not_configured') {
      setIsAvailable(false);
      return setStatus({ text: OFF_MESSAGE, kind: 'error' });
    }
    if (code && MESSAGE_BY_CODE[code])
      return setStatus({ text: MESSAGE_BY_CODE[code], kind: 'error' });
    if (error instanceof HttpError || error instanceof TypeError) {
      return setStatus({
        text: 'The connection dropped before the animation was ready. Try again.',
        kind: 'error',
      });
    }
    const text =
      error instanceof Error && error.message ? error.message : 'Something went wrong. Try again.';
    setStatus({ text, kind: 'error' });
  };

  const generate = (request: WalkthroughRequest) => {
    const problem = request.problem.trim();
    if (problem.length < 3) return setStatus({ text: MESSAGE_BY_CODE.bad_request, kind: 'error' });
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus({
      text: 'Thinking through the solution. This usually takes 30 to 90 seconds.',
      kind: 'busy',
    });
    const cleaned = { ...request, problem, example: request.example.trim() };
    requestWalkthrough(http, cleaned, controller.signal)
      .then(raw => {
        const walkthrough = normalizeWalkthrough(raw);
        setStatus({ text: `Ready: ${walkthrough.steps.length} steps. Press Play.`, kind: 'idle' });
        onReady(walkthrough, raw, cleaned);
      })
      .catch(handleFailure)
      .finally(() => {
        if (controllerRef.current === controller) controllerRef.current = null;
      });
  };

  return {
    status,
    isBusy,
    isAvailable,
    generate,
    stop: () => controllerRef.current?.abort(),
    /** Shows a neutral message in the status line, such as why nothing new was made. */
    notify: (text: string) => setStatus({ text, kind: 'idle' }),
    clearStatus: () => setStatus(IDLE),
  };
}
