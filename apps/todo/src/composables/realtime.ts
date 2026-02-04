import pb from '@/api/pocketbase';
import type { Collections } from '@/api/pocketbase-types';
import { tryOnScopeDispose } from '@vueuse/core';
import type { RecordSubscribeOptions } from 'pocketbase';

type RealtimeEvent<TRecord> = {
  action: 'create' | 'update' | 'delete';
  record: TRecord;
};

type RealtimeUnsubscribe = () => Promise<void>;

export const useRealtime = <TRecord = Record<string, unknown>>(collection: Collections) => {
  /* ======================= 변수 ======================= */
  const unsubscribeMap = new Map<string, RealtimeUnsubscribe>();
  /* ======================= 변수 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  tryOnScopeDispose(async () => {
    const unsubscribeList = [...unsubscribeMap.values()];
    await Promise.all(unsubscribeList.map((unsubscribe) => unsubscribe()));
    unsubscribeMap.clear();
  });
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const subscribeRealtime = async (
    callback: (event: RealtimeEvent<TRecord>) => void,
    topic: string = '*',
    options: RecordSubscribeOptions = {},
  ) => {
    const currentUnsubscribe = unsubscribeMap.get(topic);
    if (currentUnsubscribe) {
      await currentUnsubscribe();
    }

    const unsubscribeInternal = await pb.collection(collection).subscribe(
      topic,
      (event) => {
        callback({
          action: event.action as RealtimeEvent<TRecord>['action'],
          record: event.record as TRecord,
        });
      },
      options,
    );
    let isUnsubscribed = false;
    const unsubscribe: RealtimeUnsubscribe = async () => {
      if (isUnsubscribed) {
        return;
      }
      isUnsubscribed = true;
      unsubscribeMap.delete(topic);
      await unsubscribeInternal();
    };
    unsubscribeMap.set(topic, unsubscribe);

    return unsubscribe;
  };

  const unsubscribeRealtime = async (topic: string = '*') => {
    const unsubscribe = unsubscribeMap.get(topic);
    if (!unsubscribe) {
      return;
    }

    await unsubscribe();
  };
  /* ======================= 메서드 ======================= */

  return {
    subscribeRealtime,
    unsubscribeRealtime,
  };
};
