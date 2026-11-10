type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  query?: Record<string, QueryValue | QueryValue[]>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T = void>(path: string, options?: RequestOptions): Promise<T>;
}

/** Thrown for any non-2xx response; `data` holds the parsed error body. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly data: unknown,
    readonly url: string,
    readonly method: string,
  ) {
    super(`${method} ${url} failed with status ${status}.`);
    this.name = 'HttpError';
  }
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    values.forEach(item => {
      if (item !== null && item !== undefined) params.append(key, String(item));
    });
  });
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

function encodeBody(body: unknown) {
  if (body === undefined) return { body: undefined, contentType: undefined };
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams
  ) {
    return { body, contentType: undefined };
  }
  return { body: JSON.stringify(body), contentType: 'application/json' };
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  const isJson = (response.headers.get('content-type') ?? '').includes('application/json');
  return isJson ? JSON.parse(text) : text;
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);
  const encoded = encodeBody(body);
  const response = await fetch(url, {
    method,
    body: encoded.body,
    signal: options.signal,
    headers: {
      'X-Correlation-ID': crypto.randomUUID(),
      ...(encoded.contentType ? { 'Content-Type': encoded.contentType } : {}),
      ...options.headers,
    },
  });
  const data = await readBody(response);
  if (!response.ok) throw new HttpError(response.status, data, url, method);
  return data as T;
}

/** The single HTTP helper for the app; adds a correlation id to every call. */
export function createHttpClient(): HttpClient {
  return {
    get: (path, options) => request('GET', path, undefined, options),
    post: (path, body, options) => request('POST', path, body, options),
    put: (path, body, options) => request('PUT', path, body, options),
    patch: (path, body, options) => request('PATCH', path, body, options),
    delete: (path, options) => request('DELETE', path, undefined, options),
  };
}
