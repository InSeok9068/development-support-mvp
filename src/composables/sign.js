import pb from '@/api/pocketbase';
import { useModal } from '@/composables/modal';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export const useSign = () => {
  const router = useRouter();
  const { message } = useModal();
  const { isAuth } = storeToRefs(useAuthStore());

  const signinFormArgs = ref({
    email: '',
    password: '',
  });

  const signupFormArgs = ref({
    email: '',
    nickname: '',
    password: '',
  });

  const signin = async () => {
    try {
      await pb.collection('users').authWithPassword(signinFormArgs.value.email, signinFormArgs.value.password);
      router.push('/');
    } catch (err) {
      message.value = err.message;
    }
  };

  const signup = async () => {
    try {
      await pb.collection('users').create({
        name: signupFormArgs.value.nickname,
        email: signupFormArgs.value.email,
        password: signupFormArgs.value.password,
        passwordConfirm: signupFormArgs.value.password,
      });
      message.value = '회원가입이 완료되었습니다';
    } catch (err) {
      message.value = err.message;
    }
  };

  const signout = () => {
    pb.authStore.clear();
    isAuth.value = false;
    router.push('/sign');
  };

  return { signinFormArgs, signupFormArgs, signin, signup, signout, isAuth };
};
