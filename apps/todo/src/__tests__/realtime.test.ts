import { Collections } from '@/api/pocketbase-types';
import { useRealtime } from '@/composables/realtime';
import { effectScope } from 'vue';
import { beforeEach, describe, expect, test, vi } from 'vitest';

type PocketBaseRealtimeEvent = {
  action: 'create' | 'update' | 'delete';
  record: { id: string };
};

const pocketbaseMock = vi.hoisted(() => ({
  subscribe: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('@/api/pocketbase', () => ({
  default: {
    collection: pocketbaseMock.collection,
  },
}));

describe('useRealtime', () => {
  beforeEach(() => {
    pocketbaseMock.subscribe.mockReset();
    pocketbaseMock.collection.mockReset();
    pocketbaseMock.collection.mockReturnValue({
      subscribe: pocketbaseMock.subscribe,
    });
  });

  test('같은 topic 재구독 시 이전 구독을 먼저 해제한다', async () => {
    const unsubscribeFirst = vi.fn(async () => undefined);
    const unsubscribeSecond = vi.fn(async () => undefined);
    pocketbaseMock.subscribe.mockResolvedValueOnce(unsubscribeFirst).mockResolvedValueOnce(unsubscribeSecond);

    const { subscribeRealtime } = useRealtime<{ id: string }>(Collections.Works);
    const handler = vi.fn();

    await subscribeRealtime(handler, '*');
    await subscribeRealtime(handler, '*');

    expect(unsubscribeFirst).toHaveBeenCalledTimes(1);
    expect(unsubscribeSecond).not.toHaveBeenCalled();
  });

  test('반환된 unsubscribe는 여러 번 호출되어도 내부 unsubscribe는 1회만 실행된다', async () => {
    const unsubscribeInternal = vi.fn(async () => undefined);
    pocketbaseMock.subscribe.mockResolvedValueOnce(unsubscribeInternal);

    const { subscribeRealtime } = useRealtime<{ id: string }>(Collections.Works);
    const unsubscribe = await subscribeRealtime(() => undefined, 'todo-topic');

    await unsubscribe?.();
    await unsubscribe?.();

    expect(unsubscribeInternal).toHaveBeenCalledTimes(1);
  });

  test('scope dispose 시 활성 구독을 모두 해제한다', async () => {
    const unsubscribeTodo = vi.fn(async () => undefined);
    const unsubscribeDetail = vi.fn(async () => undefined);
    pocketbaseMock.subscribe.mockResolvedValueOnce(unsubscribeTodo).mockResolvedValueOnce(unsubscribeDetail);

    const scope = effectScope();
    await scope.run(async () => {
      const { subscribeRealtime } = useRealtime<{ id: string }>(Collections.Works);
      await subscribeRealtime(() => undefined, 'todo');
      await subscribeRealtime(() => undefined, 'detail');
    });

    scope.stop();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(unsubscribeTodo).toHaveBeenCalledTimes(1);
    expect(unsubscribeDetail).toHaveBeenCalledTimes(1);
  });

  test('PocketBase 이벤트를 도메인 이벤트 형태로 전달한다', async () => {
    let callbackFromPocketBase: ((event: PocketBaseRealtimeEvent) => void) | undefined;
    pocketbaseMock.subscribe.mockImplementationOnce(
      async (_topic: string, callback: (event: PocketBaseRealtimeEvent) => void) => {
        callbackFromPocketBase = callback;
        return async () => undefined;
      },
    );

    const { subscribeRealtime } = useRealtime<{ id: string }>(Collections.Works);
    const domainHandler = vi.fn();
    await subscribeRealtime(domainHandler, '*');

    callbackFromPocketBase?.({
      action: 'update',
      record: { id: 'w-1' },
    });

    expect(domainHandler).toHaveBeenCalledWith({
      action: 'update',
      record: { id: 'w-1' },
    });
  });
});
