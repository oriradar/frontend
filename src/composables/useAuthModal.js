import { ref } from 'vue';
import { setAuthIntent } from './useAuthIntent.js';

const visible = ref(false);
const view = ref('signin');

export function useAuthModal() {
  function open(source = 'default', plan = null) {
    setAuthIntent(source, plan);
    view.value = 'signin';
    visible.value = true;
  }

  function close() {
    visible.value = false;
    view.value = 'signin';
  }

  function showSignUp() {
    view.value = 'signup';
  }

  function showSignIn() {
    view.value = 'signin';
  }

  return {
    visible,
    view,
    open,
    close,
    showSignUp,
    showSignIn
  };
}
