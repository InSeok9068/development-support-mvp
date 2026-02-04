import pb from '@/api/pocketbase';
import type { Collections } from '@/api/pocketbase-types';
import { tryOnScopeDispose } from '@vueuse/core';
import type { RecordSubscribeOptions } from 'pocketbase';

type RealtimeEvent<TRecord> = {
  action: string;
  record: TRecord;
};

export const useRealtime = <TRecord = Record<string, unknown>>(collection: Collections) => {
  /* ======================= 변수 ======================= */
  const topics = new Set<string>();
  /* ======================= 변수 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  tryOnScopeDispose(async () => {
    await pb.collection(collection).unsubscribe();
    topics.clear();
  });
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const subscribeRealtime = async (
    callback: (event: RealtimeEvent<TRecord>) => void,
    topic: string = '*',
    options: RecordSubscribeOptions = {},
  ) => {
    const unsubscribe = await pb.collection(collection).subscribe(
      topic,
      (event) => {
        callback({
          action: event.action,
          record: event.record as TRecord,
        });
      },
      options,
    );
    topics.add(topic);

    return async () => {
      await unsubscribe();
    };
  };

  const unsubscribeRealtime = async (topic: string = '*') => {
    await pb.collection(collection).unsubscribe(topic);
    topics.delete(topic);
  };
  /* ======================= 메서드 ======================= */

  return {
    subscribeRealtime,
    unsubscribeRealtime,
  };
};
