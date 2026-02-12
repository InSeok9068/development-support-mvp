const eslintCustomRuleConfig = [
  {
    files: ['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='pb'][callee.property.name='collection'][arguments.0.type='Literal']",
          message: 'pb.collection()의 문자열 리터럴 컬렉션명 사용 금지. Collections Enum을 사용하세요.',
        },
      ],
    },
  },
  {
    files: ['apps/*/src/pages/**/*.{js,ts,vue}', 'apps/*/src/components/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='pb'][callee.property.name='collection']",
          message: 'pages/components에서 pb.collection() 직접 호출 금지. 도메인 composable을 통해 호출하세요.',
        },
        {
          selector: "CallExpression[callee.object.name='pb'][callee.property.name='send']",
          message: 'pages/components에서 pb.send() 직접 호출 금지. 도메인 composable을 통해 호출하세요.',
        },
        {
          selector: "CallExpression[callee.name='useQuery']",
          message: 'pages/components에서 useQuery() 직접 사용 금지. 도메인 composable 내부에서 사용하세요.',
        },
        {
          selector: "CallExpression[callee.name='useMutation']",
          message: 'pages/components에서 useMutation() 직접 사용 금지. 도메인 composable 내부에서 사용하세요.',
        },
      ],
    },
  },
  {
    files: ['apps/*/src/composables/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "VariableDeclarator[id.name=/^on[A-Z].+/]",
          message: 'composable 메서드에서 onXxx 네이밍 금지. 도메인 액션 동사(fetch/create/update/delete/...)를 사용하세요.',
        },
        {
          selector: "FunctionDeclaration[id.name=/^on[A-Z].+/]",
          message: 'composable 메서드에서 onXxx 네이밍 금지. 도메인 액션 동사(fetch/create/update/delete/...)를 사용하세요.',
        },
      ],
    },
  },
];

export default eslintCustomRuleConfig;
