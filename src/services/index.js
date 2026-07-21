/* Single swap point for the whole app.
   Flip USE_MOCK to false (or set VITE_USE_MOCK=false) to go live. */
import { mockApi } from './api.mock.js';
import { liveApi } from './api.live.js';

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

export const api = USE_MOCK ? mockApi : liveApi;
export const IS_MOCK = api.name === 'mock';
