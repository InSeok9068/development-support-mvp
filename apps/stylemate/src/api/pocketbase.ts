/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck

import type { TypedPocketBase } from '@/api/pocketbase-types';
import PocketBase from 'pocketbase';

const pocketbaseUrl = String(import.meta.env.VITE_POCKETBASE_URL ?? '').trim();

if (!pocketbaseUrl) {
  throw new Error('VITE_POCKETBASE_URL 환경변수가 설정되지 않았습니다.');
}

const pb = new PocketBase(pocketbaseUrl) as TypedPocketBase;

export default pb;
