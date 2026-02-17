import { Collections, type SuperusersResponse } from '@/api/pocketbase-types';
import { useAuth } from '@/composables/useAuth';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const pocketbaseMock = vi.hoisted(() => ({
  authWithPassword: vi.fn(),
  create: vi.fn(),
  collection: vi.fn(),
  authStore: {
    isValid: false,
    model: null as SuperusersResponse | null,
    clear: vi.fn(),
  },
}));

vi.mock('@/api/pocketbase', () => ({
  default: {
    collection: pocketbaseMock.collection,
    authStore: pocketbaseMock.authStore,
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    pocketbaseMock.authWithPassword.mockReset();
    pocketbaseMock.create.mockReset();
    pocketbaseMock.collection.mockReset();
    pocketbaseMock.authStore.clear.mockReset();
    pocketbaseMock.authStore.isValid = false;
    pocketbaseMock.authStore.model = null;

    pocketbaseMock.authStore.clear.mockImplementation(() => {
      pocketbaseMock.authStore.isValid = false;
      pocketbaseMock.authStore.model = null;
    });

    pocketbaseMock.collection.mockImplementation(() => ({
      authWithPassword: pocketbaseMock.authWithPassword,
      create: pocketbaseMock.create,
    }));
  });

  test('fetchAuthState는 인증 상태와 관리자 여부를 동기화한다', () => {
    pocketbaseMock.authStore.isValid = true;
    pocketbaseMock.authStore.model = {
      id: 'su-1',
      email: 'admin@example.com',
      collectionName: Collections.Superusers,
    } as SuperusersResponse;

    const { fetchAuthState, isAuth, isSuperuser, authEmail } = useAuth();
    const result = fetchAuthState();

    expect(result).toBe(true);
    expect(isAuth.value).toBe(true);
    expect(isSuperuser.value).toBe(true);
    expect(authEmail.value).toBe('admin@example.com');
  });

  test('fetchAuthState는 비관리자 계정일 때 isSuperuser를 false로 유지한다', () => {
    pocketbaseMock.authStore.isValid = true;
    pocketbaseMock.authStore.model = {
      id: 'user-1',
      email: 'user@example.com',
      collectionName: Collections.Users,
    } as SuperusersResponse;

    const { fetchAuthState, isAuth, isSuperuser, authEmail } = useAuth();
    fetchAuthState();

    expect(isAuth.value).toBe(true);
    expect(isSuperuser.value).toBe(false);
    expect(authEmail.value).toBe('user@example.com');
  });

  test('createAuthSession은 로그인 후 상태를 갱신한다', async () => {
    pocketbaseMock.authWithPassword.mockImplementationOnce(async () => {
      pocketbaseMock.authStore.isValid = true;
      pocketbaseMock.authStore.model = {
        id: 'su-2',
        email: 'owner@example.com',
        collectionName: Collections.Superusers,
      } as SuperusersResponse;
    });

    const { createAuthSession, isAuth, isSuperuser, authEmail } = useAuth();
    await createAuthSession('owner@example.com', 'password123');

    expect(pocketbaseMock.collection).toHaveBeenCalledWith(Collections.Superusers);
    expect(pocketbaseMock.authWithPassword).toHaveBeenCalledWith('owner@example.com', 'password123');
    expect(isAuth.value).toBe(true);
    expect(isSuperuser.value).toBe(true);
    expect(authEmail.value).toBe('owner@example.com');
  });

  test('createAuthSession 실패 시 기존 인증 상태를 덮어쓰지 않는다', async () => {
    pocketbaseMock.authStore.isValid = true;
    pocketbaseMock.authStore.model = {
      id: 'su-1',
      email: 'keep@example.com',
      collectionName: Collections.Superusers,
    } as SuperusersResponse;
    pocketbaseMock.authWithPassword.mockRejectedValueOnce(new Error('invalid credential'));

    const { fetchAuthState, createAuthSession, isAuth, isSuperuser, authEmail } = useAuth();
    fetchAuthState();

    await expect(createAuthSession('owner@example.com', 'wrong')).rejects.toThrow('invalid credential');
    expect(isAuth.value).toBe(true);
    expect(isSuperuser.value).toBe(true);
    expect(authEmail.value).toBe('keep@example.com');
  });

  test('createUserAccount는 Users 컬렉션에 계정을 생성한다', async () => {
    const { createUserAccount } = useAuth();
    const payload = {
      email: 'member@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
      name: 'member',
      tokenKey: 'token-key',
    };

    await createUserAccount(payload);

    expect(pocketbaseMock.collection).toHaveBeenCalledWith(Collections.Users);
    expect(pocketbaseMock.create).toHaveBeenCalledWith(payload);
  });

  test('deleteAuthSession은 인증 상태를 초기화한다', async () => {
    const { deleteAuthSession, isAuth, isSuperuser, authEmail } = useAuth();
    isAuth.value = true;
    isSuperuser.value = true;
    authEmail.value = 'admin@example.com';

    await deleteAuthSession();

    expect(pocketbaseMock.authStore.clear).toHaveBeenCalledTimes(1);
    expect(isAuth.value).toBe(false);
    expect(isSuperuser.value).toBe(false);
    expect(authEmail.value).toBe('');
  });
});
