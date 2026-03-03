import { Collections, type UsersResponse } from '@/api/pocketbase-types';
import { useAuth } from '@/composables/auth';
import { useAuthGuard } from '@/composables/auth-guard';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

const pocketbaseMock = vi.hoisted(() => ({
  authWithPassword: vi.fn(),
  create: vi.fn(),
  collection: vi.fn(),
  authStore: {
    isValid: false,
    record: null as UsersResponse | null,
    clear: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerMock.push,
  }),
}));

vi.mock('@/api/pocketbase', () => ({
  default: {
    collection: pocketbaseMock.collection,
    authStore: pocketbaseMock.authStore,
  },
}));

describe('useAuth / useAuthGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    routerMock.push.mockReset();
    pocketbaseMock.authWithPassword.mockReset();
    pocketbaseMock.create.mockReset();
    pocketbaseMock.collection.mockReset();
    pocketbaseMock.authStore.clear.mockReset();
    pocketbaseMock.authStore.isValid = false;
    pocketbaseMock.authStore.record = null;

    pocketbaseMock.collection.mockImplementation(() => ({
      authWithPassword: pocketbaseMock.authWithPassword,
      create: pocketbaseMock.create,
    }));
  });

  test('createAuthSession은 로그인 성공 후 상태를 갱신하고 홈으로 이동한다', async () => {
    pocketbaseMock.authWithPassword.mockImplementationOnce(async () => {
      pocketbaseMock.authStore.isValid = true;
      pocketbaseMock.authStore.record = {
        id: 'user-1',
      } as UsersResponse;
    });
    const { createAuthSession, isAuth, userId } = useAuth();

    await createAuthSession('member@example.com', 'password123');

    expect(pocketbaseMock.collection).toHaveBeenCalledWith(Collections.Users);
    expect(pocketbaseMock.authWithPassword).toHaveBeenCalledWith('member@example.com', 'password123');
    expect(isAuth.value).toBe(true);
    expect(userId.value).toBe('user-1');
    expect(routerMock.push).toHaveBeenCalledWith('/');
  });

  test('createUser는 Users 컬렉션에 passwordConfirm 포함 payload로 계정을 생성한다', async () => {
    const { createUser } = useAuth();

    await createUser({
      email: 'new-user@example.com',
      name: 'new-user',
      password: 'password123',
    });

    expect(pocketbaseMock.collection).toHaveBeenCalledWith(Collections.Users);
    expect(pocketbaseMock.create).toHaveBeenCalledWith({
      email: 'new-user@example.com',
      name: 'new-user',
      password: 'password123',
      passwordConfirm: 'password123',
    });
  });

  test('deleteAuthSession은 세션을 초기화하고 sign 페이지로 이동한다', async () => {
    const { deleteAuthSession, isAuth, userId } = useAuth();
    isAuth.value = true;
    userId.value = 'user-1';

    await deleteAuthSession();

    expect(pocketbaseMock.authStore.clear).toHaveBeenCalledTimes(1);
    expect(isAuth.value).toBe(false);
    expect(userId.value).toBe('');
    expect(routerMock.push).toHaveBeenCalledWith('/sign');
  });

  test('fetchAuthState는 authStore 상태를 store에 동기화한다', () => {
    pocketbaseMock.authStore.isValid = true;
    pocketbaseMock.authStore.record = {
      id: 'user-2',
      name: '  stylemate user  ',
    } as UsersResponse;
    const { fetchAuthState, fetchAuthUserName, fetchAuthUserId, isAuth, userId } = useAuth();

    const isAuthenticated = fetchAuthState();

    expect(isAuthenticated).toBe(true);
    expect(isAuth.value).toBe(true);
    expect(userId.value).toBe('user-2');
    expect(fetchAuthUserId()).toBe('user-2');
    expect(fetchAuthUserName()).toBe('stylemate user');
  });

  test('fetchAuthStateOrRedirect는 인증된 사용자면 true를 반환한다', async () => {
    pocketbaseMock.authStore.isValid = true;
    pocketbaseMock.authStore.record = {
      id: 'user-3',
    } as UsersResponse;
    const { fetchAuthStateOrRedirect } = useAuthGuard();

    const result = await fetchAuthStateOrRedirect();

    expect(result).toBe(true);
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  test('fetchAuthStateOrRedirect는 비인증 상태면 sign 페이지로 리다이렉트한다', async () => {
    const { fetchAuthStateOrRedirect } = useAuthGuard();

    const result = await fetchAuthStateOrRedirect();

    expect(result).toBe(false);
    expect(routerMock.push).toHaveBeenCalledWith('/sign');
  });
});
