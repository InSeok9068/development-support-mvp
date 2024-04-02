import PocketBase, { RecordService } from 'pocketbase';

interface BaseModel {
  id: string;
  created: string;
  updated: string;
}

interface Works extends BaseModel {
  userId: string;
  title: string;
  content: string;
  time: number;
  done: boolean;
  dueDate: string;
  redmine: string;
  joplin: string;
  file: string[];
  developer: string;
}

interface Developers extends BaseModel {
  name: string;
  sort: number;
  works: string[];
}

interface TypePocketBase extends PocketBase {
  collection(idOrName: string): RecordService;
  collection(idOrName: 'works'): RecordService<Works>;
  collection(idOrName: 'developers'): RecordService<Developers>;
}

const pb = new PocketBase('http://localhost:8090') as TypePocketBase;

export default pb;
