import { builtinRules } from 'eslint/use-at-your-own-risk';

const plugin = {
  meta: {
    name: 'eslint-selector-bridge',
  },
  rules: {
    'no-restricted-syntax': builtinRules.get('no-restricted-syntax'),
    'no-restricted-syntax-recommend': builtinRules.get('no-restricted-syntax'),
  },
};

export default plugin;
