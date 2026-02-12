const AGENTS_REF = {
  pbCollectionLiteral:
    'AGENTS.md > PocketBase 가이드 > 문자열 리터럴로 컬렉션 명을 지정하는 것을 금지한다.',
  noDirectPbCall:
    'AGENTS.md > Agent 금지 사항 > Composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다.',
  queryOnlyInComposable:
    'AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다.',
  realtimePageRule:
    'AGENTS.md > Realtime subscribe 규칙 > Page는 subscribeXxxRealtime(handler?) / unsubscribeXxxRealtime()만 사용한다.',
  composableNaming:
    'AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Composable 메서드 명명 규칙.',
  noMutationReturn:
    'AGENTS.md > Agent 금지 사항 > Composable에서 Mutation 객체(useMutation 결과)를 그대로 반환하지 않는다.',
  mutateAsyncOnly:
    'AGENTS.md > Composables 가이드 > Mutation 도메인 액션 함수는 mutateAsync 기반 Promise 반환을 기본으로 한다.',
  queryKeyRule: 'AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다.',
};

const rule = (selector, message) => ({ selector, message });

const syntaxBlock = (files, restrictedSyntaxRules, ignores = []) => ({
  files,
  ...(ignores.length ? { ignores } : {}),
  rules: {
    'no-restricted-syntax': ['error', ...restrictedSyntaxRules],
  },
});

const pbCollectionLiteralRule = rule(
  "CallExpression[callee.object.name='pb'][callee.property.name='collection'][arguments.0.type='Literal']",
  `${AGENTS_REF.pbCollectionLiteral} pb.collection("...") 대신 Collections Enum을 사용하세요.`,
);

const queryKeyRules = [
  rule(
    "Property[key.name='queryKey'] MemberExpression[object.name='Collections']",
    `${AGENTS_REF.queryKeyRule} queryKey에는 Collections Enum 대신 도메인 문자열(예: 'works')을 사용하세요.`,
  ),
  rule(
    "Property[key.name='queryKey'] > ArrayExpression > :first-child:not(Literal[value=/^[a-z0-9-]+$/])",
    `${AGENTS_REF.queryKeyRule} queryKey 1st segment는 소문자 도메인 문자열이어야 합니다. 예: ['works', 'list', params]`,
  ),
];

const realtimeSubscriptionRules = [
  rule(
    "CallExpression[callee.type='Identifier'][callee.name='subscribe']",
    `${AGENTS_REF.realtimePageRule} subscribe* 직접 호출 대신 subscribeXxxRealtime을 사용하세요.`,
  ),
  rule(
    "CallExpression[callee.type='Identifier'][callee.name='unsubscribe']",
    `${AGENTS_REF.realtimePageRule} unsubscribe* 직접 호출 대신 unsubscribeXxxRealtime을 사용하세요.`,
  ),
  rule(
    "CallExpression[callee.type='MemberExpression'][callee.property.name='subscribe']",
    `${AGENTS_REF.realtimePageRule} 객체의 subscribe() 직접 호출 대신 composable의 subscribeXxxRealtime을 사용하세요.`,
  ),
  rule(
    "CallExpression[callee.type='MemberExpression'][callee.property.name='unsubscribe']",
    `${AGENTS_REF.realtimePageRule} 객체의 unsubscribe() 직접 호출 대신 composable의 unsubscribeXxxRealtime을 사용하세요.`,
  ),
];

const composableMutationRules = [
  rule(
    "ReturnStatement > Identifier[name=/Mutation$/]",
    `${AGENTS_REF.noMutationReturn} mutateAsync 기반 도메인 액션 함수로 감싸서 반환하세요.`,
  ),
  rule(
    "ReturnStatement ObjectExpression > Property[value.type='Identifier'][value.name=/Mutation$/]",
    `${AGENTS_REF.noMutationReturn} mutateAsync 기반 도메인 액션 함수로 감싸서 반환하세요.`,
  ),
  rule(
    "CallExpression[callee.object.name=/Mutation$/][callee.property.name='mutate']",
    `${AGENTS_REF.mutateAsyncOnly} mutate() 대신 mutateAsync()를 사용하세요.`,
  ),
];

const pageBoundaryRules = [
  pbCollectionLiteralRule,
  rule(
    "CallExpression[callee.object.name='pb'][callee.property.name='collection']",
    `${AGENTS_REF.noDirectPbCall} 도메인 composable 액션을 사용하세요.`,
  ),
  rule(
    "CallExpression[callee.object.name='pb'][callee.property.name='send']",
    `${AGENTS_REF.noDirectPbCall} 도메인 composable 액션을 사용하세요.`,
  ),
  rule(
    "CallExpression[callee.name='useQuery']",
    `${AGENTS_REF.queryOnlyInComposable} pages/components에서는 composable 액션을 호출하세요.`,
  ),
  rule(
    "CallExpression[callee.name='useMutation']",
    `${AGENTS_REF.queryOnlyInComposable} pages/components에서는 composable 액션을 호출하세요.`,
  ),
  rule(
    "CallExpression[callee.name='useQueryClient']",
    `${AGENTS_REF.queryOnlyInComposable} pages에서 useQueryClient()를 직접 사용하지 마세요.`,
  ),
  rule(
    "Identifier[name='queryClient']",
    `${AGENTS_REF.queryOnlyInComposable} pages에서 queryClient를 직접 사용하지 마세요.`,
  ),
  ...realtimeSubscriptionRules,
  ...queryKeyRules,
];

const componentBoundaryRules = [
  pbCollectionLiteralRule,
  rule(
    "CallExpression[callee.object.name='pb'][callee.property.name='collection']",
    `${AGENTS_REF.noDirectPbCall} 도메인 composable 액션을 사용하세요.`,
  ),
  rule(
    "CallExpression[callee.object.name='pb'][callee.property.name='send']",
    `${AGENTS_REF.noDirectPbCall} 도메인 composable 액션을 사용하세요.`,
  ),
  rule(
    "CallExpression[callee.name='useQuery']",
    `${AGENTS_REF.queryOnlyInComposable} pages/components에서는 composable 액션을 호출하세요.`,
  ),
  rule(
    "CallExpression[callee.name='useMutation']",
    `${AGENTS_REF.queryOnlyInComposable} pages/components에서는 composable 액션을 호출하세요.`,
  ),
  ...realtimeSubscriptionRules,
  ...queryKeyRules,
];

const composableRules = [
  pbCollectionLiteralRule,
  rule(
    'VariableDeclarator[id.name=/^on[A-Z].+/]',
    `${AGENTS_REF.composableNaming} composable 메서드에서 onXxx 네이밍은 금지됩니다. 도메인 액션(CRUD/구독)은 fetch/create/update/delete/subscribe/unsubscribe 동사를 사용하고, 내부 유틸은 도메인 의미가 드러나면 예외 가능합니다.`,
  ),
  rule(
    'FunctionDeclaration[id.name=/^on[A-Z].+/]',
    `${AGENTS_REF.composableNaming} composable 메서드에서 onXxx 네이밍은 금지됩니다. 도메인 액션(CRUD/구독)은 fetch/create/update/delete/subscribe/unsubscribe 동사를 사용하고, 내부 유틸은 도메인 의미가 드러나면 예외 가능합니다.`,
  ),
  ...composableMutationRules,
  ...queryKeyRules,
];

const commonRules = [pbCollectionLiteralRule, ...queryKeyRules];

const eslintCustomRuleConfig = [
  // pages 적용 규칙
  syntaxBlock(['apps/*/src/pages/**/*.{js,ts,vue}'], pageBoundaryRules),
  // components 적용 규칙
  syntaxBlock(['apps/*/src/components/**/*.{js,ts,vue}'], componentBoundaryRules),
  // composables 적용 규칙
  syntaxBlock(['apps/*/src/composables/**/*.{js,ts,vue}'], composableRules),
  // 기타 src/packages 적용 규칙
  syntaxBlock(['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}'], commonRules, [
    'apps/*/src/pages/**/*.{js,ts,vue}',
    'apps/*/src/components/**/*.{js,ts,vue}',
    'apps/*/src/composables/**/*.{js,ts,vue}',
  ]),
];

export default eslintCustomRuleConfig;
