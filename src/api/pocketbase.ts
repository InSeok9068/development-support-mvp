/* eslint-disable */

import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '@/api/pocketbase-types';

// @ts-ignore
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL) as TypedPocketBase;

export default pb;
