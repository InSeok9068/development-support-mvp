/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck

import type { TypedPocketBase } from '@/api/pocketbase-types';
import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL) as TypedPocketBase;

export default pb;
