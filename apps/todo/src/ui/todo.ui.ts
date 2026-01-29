import type { Collections, Update } from '@/api/pocketbase-types';

export interface UiDeveloperArgs extends Update<Collections.Developers> {
  id: string;
}

export interface UiWorkList {
  id: string;
  title: string;
  developer: string;
  created: string;
  updated: string;
}
