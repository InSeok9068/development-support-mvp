import { Collections, type UsersResponse } from '@/api/pocketbase-types';
import { useSign } from '@/composables/user/sign';
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

describe('useSign', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    routerMock.push.mockReset();
    pocketbaseMock.authWithPassword.mockReset();
    pocketbaseMock.create.mockReset();
    pocketbaseMock.collection.mockReset();
    pocketbaseMock.authStore.clear.mockReset();
    pocketbaseMock.authStore.isValid = false;
    pocketbaseMock.authStore.record = null;
    pocketbaseMock.collection.mockReturnValue({
      authWithPassword: pocketbaseMock.authWithPassword,
      create: pocketbaseMock.create,
    });
  });

  test('signin은 사용자 인증 후 메인 페이지로 이동한다', async () => {
    const { signin, isAuth } = useSign();

    await signin('dev@example.com', 'password123');

    expect(pocketbaseMock.collection).toHaveBeenCalledWith(Collections.Users);
    expect(pocketbaseMock.authWithPassword).toHaveBeenCalledWith('dev@example.com', 'password123');
    expect(isAuth.value).toBe(true);
    expect(routerMock.push).toHaveBeenCalledWith('/');
  });

  test('signin 실패 시 인증 상태와 라우팅을 변경하지 않는다', async () => {
    const error = new Error('로그인 실패');
    pocketbaseMock.authWithPassword.mockRejectedValueOnce(error);
    const { signin, isAuth } = useSign();

    await expect(signin('dev@example.com', 'wrong-password')).rejects.toThrow('로그인 실패');

    expect(isAuth.value).toBe(false);
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  test('signup은 Users 컬렉션에 계정을 생성한다', async () => {
    const { signup } = useSign();
    const payload = {
      email: 'new-user@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
      name: 'new-user',
      username: 'new-user',
      tokenKey: 'token-key',
    };

    await signup(payload);

    expect(pocketbaseMock.collection).toHaveBeenCalledWith(Collections.Users);
    expect(pocketbaseMock.create).toHaveBeenCalledWith(payload);
  });

  test('signout은 세션을 비우고 로그인 페이지로 이동한다', async () => {
    const { signout, isAuth } = useSign();
    isAuth.value = true;

    await signout();

    expect(pocketbaseMock.authStore.clear).toHaveBeenCalledTimes(1);
    expect(isAuth.value).toBe(false);
    expect(routerMock.push).toHaveBeenCalledWith('/sign');
  });

  test('getUserId는 authStore record id를 반환하고 없으면 빈 문자열을 반환한다', () => {
    const { getUserId } = useSign();

    expect(getUserId()).toBe('');

    pocketbaseMock.authStore.record = {
      id: 'u-100',
    } as UsersResponse;
    expect(getUserId()).toBe('u-100');
  });

  test('checkAuth는 PocketBase authStore 상태를 반영한다', () => {
    const { checkAuth, isAuth } = useSign();

    pocketbaseMock.authStore.isValid = true;
    expect(checkAuth()).toBe(true);
    expect(isAuth.value).toBe(true);

    pocketbaseMock.authStore.isValid = false;
    expect(checkAuth()).toBe(false);
    expect(isAuth.value).toBe(false);
  });
});
