import type { DevelopersRecord } from '@/api/pocketbase-types';

export interface UiDeveloperArgs extends DevelopersRecord {
  id: string;
}

export interface UiWorkList {
  id: string;
  title: string;
  developer: string;
  created: string;
  updated: string;
}
