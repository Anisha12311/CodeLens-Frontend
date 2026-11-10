import { useState } from 'react';
import { createHttpClient, HttpClient } from '@/shared/lib/http-client/http-client';

/** A stable HttpClient for the lifetime of the component. */
export function useHttpClient(): HttpClient {
  const [http] = useState(createHttpClient);
  return http;
}
