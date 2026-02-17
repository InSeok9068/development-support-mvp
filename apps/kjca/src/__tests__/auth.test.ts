import { Collections, type SuperusersResponse, type UsersResponse } from '@/api/pocketbase-types';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const authStoreOnChangeState = vi.hoisted(() => ({
  handler: undefined as undefined | (() => void),
}));

const pocketbaseMock = vi.hoisted(() => ({
  authWithPassword: vi.fn(),
  collection: vi.fn(),
  authStore: {
    isValid: false,
    record: null as SuperusersResponse | UsersResponse | null,
    clear: vi.fn(),
    onChange: vi.fn((handler: () => void, triggerImmediate?: boolean) => {
      authStoreOnChangeState.handler = handler;
      if (triggerImmediate) {
        handler();
      }
    }),
  },
}));

vi.mock('@/api/pocketbase', () => ({
  default: {
    collection: pocketbaseMock.collection,
    authStore: pocketbaseMock.authStore,
  },
}));

describe('useAuth (kjca)', () => {
  beforeEach(() => {
    vi.resetModules();

    pocketbaseMock.authWithPassword.mockReset();
    pocketbaseMock.collection.mockReset();
    pocketbaseMock.authStore.clear.mockReset();
    pocketbaseMock.authStore.onChange.mockReset();
    pocketbaseMock.authStore.isValid = false;
    pocketbaseMock.authStore.record = null;
    authStoreOnChangeState.handler = undefined;

    pocketbaseMock.collection.mockReturnValue({
      authWithPassword: pocketbaseMock.authWithPassword,
    });
  });

  test('signIn은 아이디를 kjca.local 도메인으로 정규화해서 로그인한다', async () => {
    const { useAuth } = await import('@/composables/useAuth');
    const { signIn } = useAuth();

    await signIn({
      loginId: 'leader01',
      password: ' 1234 ',
    });

    expect(pocketbaseMock.collection).toHaveBeenCalledWith(Collections.Superusers);
    expect(pocketbaseMock.authWithPassword).toHaveBeenCalledWith('leader01@kjca.local', '1234');
  });

  test('signIn은 @가 이미 포함된 loginId를 그대로 사용한다', async () => {
    const { useAuth } = await import('@/composables/useAuth');
    const { signIn } = useAuth();

    await signIn({
      loginId: 'leader01@company.com',
      password: '1234',
    });

    expect(pocketbaseMock.authWithPassword).toHaveBeenCalledWith('leader01@company.com', '1234');
  });

  test('signIn은 loginId가 비어 있으면 에러를 던진다', async () => {
    const { useAuth } = await import('@/composables/useAuth');
    const { signIn } = useAuth();

    await expect(
      signIn({
        loginId: '   ',
        password: '1234',
      }),
    ).rejects.toThrow('아이디(loginId)가 필요합니다.');
    expect(pocketbaseMock.authWithPassword).not.toHaveBeenCalled();
  });

  test('signIn은 password가 비어 있으면 에러를 던진다', async () => {
    const { useAuth } = await import('@/composables/useAuth');
    const { signIn } = useAuth();

    await expect(
      signIn({
        loginId: 'leader01',
        password: '   ',
      }),
    ).rejects.toThrow('비밀번호가 필요합니다.');
    expect(pocketbaseMock.authWithPassword).not.toHaveBeenCalled();
  });

  test('onChange 구독 결과를 기반으로 authRecord와 isSignedIn을 동기화한다', async () => {
    const { useAuth } = await import('@/composables/useAuth');
    const { authRecord, isSignedIn } = useAuth();

    expect(authRecord.value).toBeNull();
    expect(isSignedIn.value).toBe(false);

    pocketbaseMock.authStore.isValid = true;
    pocketbaseMock.authStore.record = {
      id: 'su-1',
      email: 'admin@kjca.local',
      collectionName: Collections.Superusers,
    } as SuperusersResponse;
    authStoreOnChangeState.handler?.();

    expect(authRecord.value?.id).toBe('su-1');
    expect(isSignedIn.value).toBe(true);

    pocketbaseMock.authStore.record = {
      id: 'user-1',
      email: 'user@kjca.local',
      collectionName: Collections.Users,
    } as UsersResponse;
    authStoreOnChangeState.handler?.();

    expect(authRecord.value).toBeNull();
    expect(isSignedIn.value).toBe(false);
  });

  test('useAuth를 여러 번 호출해도 authStore 구독은 한 번만 등록한다', async () => {
    const { useAuth } = await import('@/composables/useAuth');

    useAuth();
    useAuth();

    expect(pocketbaseMock.authStore.onChange).toHaveBeenCalledTimes(1);
  });

  test('signOut은 authStore를 clear한다', async () => {
    const { useAuth } = await import('@/composables/useAuth');
    const { signOut } = useAuth();

    signOut();

    expect(pocketbaseMock.authStore.clear).toHaveBeenCalledTimes(1);
  });
});
