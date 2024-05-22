import type { DevelopersRecord } from '@/api/pocketbase-types';

export interface UiDeveloperArgs extends DevelopersRecord {
  id: string;
}
