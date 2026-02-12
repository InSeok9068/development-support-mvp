const pbCollectionLiteralSelector =
  "CallExpression[callee.object.name='pb'][callee.property.name='collection'][arguments.0.type='Literal']";

const pbCollectionLiteralRule = {
  selector: pbCollectionLiteralSelector,
  message:
    'AGENTS.md > PocketBase 가이드 > 문자열 리터럴로 컬렉션 명을 지정하는 것을 금지한다. pb.collection("...") 대신 Collections Enum을 사용하세요.',
};

const queryKeyRules = [
  {
    selector: "Property[key.name='queryKey'] MemberExpression[object.name='Collections']",
    message:
      "AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다. queryKey에는 Collections Enum 대신 도메인 문자열(예: 'works')을 사용하세요.",
  },
  {
    selector: "Property[key.name='queryKey'] > ArrayExpression > :first-child:not(Literal[value=/^[a-z0-9-]+$/])",
    message:
      "AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다. queryKey 1st segment는 소문자 도메인 문자열이어야 합니다. 예: ['works', 'list', params]",
  },
];

const eslintCustomRuleConfig = [
  // [레이어 경계 규칙: pages -> composables]
  // - pages에서 PocketBase 직접 호출 금지
  // - pages에서 TanStack Query/useQueryClient/queryClient 직접 사용 금지
  // - queryKey/PocketBase 공통 규칙도 함께 적용
  {
    files: ['apps/*/src/pages/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        pbCollectionLiteralRule,
        {
          selector: "CallExpression[callee.object.name='pb'][callee.property.name='collection']",
          message:
            'AGENTS.md > Agent 금지 사항 > Composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다. 도메인 composable 액션을 사용하세요.',
        },
        {
          selector: "CallExpression[callee.object.name='pb'][callee.property.name='send']",
          message:
            'AGENTS.md > Agent 금지 사항 > Composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다. 도메인 composable 액션을 사용하세요.',
        },
        {
          selector: "CallExpression[callee.name='useQuery']",
          message:
            'AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages/components에서는 composable 액션을 호출하세요.',
        },
        {
          selector: "CallExpression[callee.name='useMutation']",
          message:
            'AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages/components에서는 composable 액션을 호출하세요.',
        },
        {
          selector: "CallExpression[callee.name='useQueryClient']",
          message:
            'AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages에서 useQueryClient()를 직접 사용하지 마세요.',
        },
        {
          selector: "Identifier[name='queryClient']",
          message:
            'AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages에서 queryClient를 직접 사용하지 마세요.',
        },
        ...queryKeyRules,
      ],
    },
  },
  // [레이어 경계 규칙: components -> composables]
  // - components에서 PocketBase 직접 호출 금지
  // - components에서 TanStack Query 직접 사용 금지
  // - queryKey/PocketBase 공통 규칙도 함께 적용
  {
    files: ['apps/*/src/components/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        pbCollectionLiteralRule,
        {
          selector: "CallExpression[callee.object.name='pb'][callee.property.name='collection']",
          message:
            'AGENTS.md > Agent 금지 사항 > Composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다. 도메인 composable 액션을 사용하세요.',
        },
        {
          selector: "CallExpression[callee.object.name='pb'][callee.property.name='send']",
          message:
            'AGENTS.md > Agent 금지 사항 > Composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다. 도메인 composable 액션을 사용하세요.',
        },
        {
          selector: "CallExpression[callee.name='useQuery']",
          message:
            'AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages/components에서는 composable 액션을 호출하세요.',
        },
        {
          selector: "CallExpression[callee.name='useMutation']",
          message:
            'AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages/components에서는 composable 액션을 호출하세요.',
        },
        ...queryKeyRules,
      ],
    },
  },
  // [Composable 네이밍 규칙]
  // - composable 내부 메서드에서 onXxx 네이밍 금지
  // - queryKey/PocketBase 공통 규칙도 함께 적용
  {
    files: ['apps/*/src/composables/**/*.{js,ts,vue}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        pbCollectionLiteralRule,
        {
          selector: 'VariableDeclarator[id.name=/^on[A-Z].+/]',
          message:
            'AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Composable 메서드 명명 규칙. composable 메서드에서 onXxx 네이밍은 금지됩니다. 도메인 액션(CRUD/구독)은 fetch/create/update/delete/subscribe/unsubscribe 동사를 사용하고, 내부 유틸은 도메인 의미가 드러나면 예외 가능합니다.',
        },
        {
          selector: 'FunctionDeclaration[id.name=/^on[A-Z].+/]',
          message:
            'AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Composable 메서드 명명 규칙. composable 메서드에서 onXxx 네이밍은 금지됩니다. 도메인 액션(CRUD/구독)은 fetch/create/update/delete/subscribe/unsubscribe 동사를 사용하고, 내부 유틸은 도메인 의미가 드러나면 예외 가능합니다.',
        },
        ...queryKeyRules,
      ],
    },
  },
  // [공통 규칙: 기타 src/packages 파일]
  // - pages/components/composables 외 영역에도 queryKey/PocketBase 규칙 적용
  {
    files: ['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}'],
    ignores: [
      'apps/*/src/pages/**/*.{js,ts,vue}',
      'apps/*/src/components/**/*.{js,ts,vue}',
      'apps/*/src/composables/**/*.{js,ts,vue}',
    ],
    rules: {
      'no-restricted-syntax': ['error', pbCollectionLiteralRule, ...queryKeyRules],
    },
  },
];

export default eslintCustomRuleConfig;
