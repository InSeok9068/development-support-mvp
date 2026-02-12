const AGENTS_REF = {
  pbCollectionLiteral: 'AGENTS.md > PocketBase 가이드 > 문자열 리터럴로 컬렉션 명을 지정하는 것을 금지한다.',
  noDirectPbCall:
    'AGENTS.md > Agent 금지 사항 > Composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다.',
  queryOnlyInComposable: 'AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다.',
  realtimePageRule:
    'AGENTS.md > Realtime subscribe 규칙 > Page는 subscribeXxxRealtime(handler?) / unsubscribeXxxRealtime()만 사용한다.',
  composableNaming: 'AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Composable 메서드 명명 규칙.',
  noMutationReturn:
    'AGENTS.md > Agent 금지 사항 > Composable에서 Mutation 객체(useMutation 결과)를 그대로 반환하지 않는다.',
  mutateAsyncOnly:
    'AGENTS.md > Composables 가이드 > Mutation 도메인 액션 함수는 mutateAsync 기반 Promise 반환을 기본으로 한다.',
  queryKeyRule: 'AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다.',
  shoelaceFirstPrinciple: 'AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙.',
  shoelaceChangeParsing:
    'AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace @sl-change 이벤트 값 파싱은 readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked를 기본값으로 사용한다.',
  sfcMethodNaming: 'AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Vue SFC 메서드 명명 규칙.',
};

/* ======================= 공통 유틸 ======================= */
const rule = (selector, message) => ({ selector, message });
const forbid = (selector, message) => rule(selector, `[금지] ${message}`);
const recommend = (selector, message) => rule(selector, `[권장] ${message}`);

const syntaxBlock = (files, restrictedSyntaxRules, ignores = []) => ({
  files,
  ...(ignores.length ? { ignores } : {}),
  rules: {
    'no-restricted-syntax': ['error', ...restrictedSyntaxRules],
  },
});
/* ======================= 공통 유틸 ======================= */

/* ======================= Query 규칙 ======================= */
const pbCollectionLiteralRule = forbid(
  "CallExpression[callee.object.name='pb'][callee.property.name='collection'][arguments.0.type='Literal']",
  `${AGENTS_REF.pbCollectionLiteral} pb.collection("...") 대신 Collections Enum을 사용하세요.`,
);

const queryKeyRules = [
  forbid(
    "Property[key.name='queryKey'] MemberExpression[object.name='Collections']",
    `${AGENTS_REF.queryKeyRule} queryKey에는 Collections Enum 대신 도메인 문자열(예: 'works')을 사용하세요.`,
  ),
  forbid(
    "Property[key.name='queryKey'] > ArrayExpression > :first-child:not(Literal[value=/^[a-z0-9-]+$/])",
    `${AGENTS_REF.queryKeyRule} queryKey 1st segment는 소문자 도메인 문자열이어야 합니다. 예: ['works', 'list', params]`,
  ),
];

const queryKeyRecommendationRules = [
  recommend(
    "CallExpression[callee.name='useQuery'] Property[key.name='queryKey'] > ArrayExpression:not(:has(> :nth-child(2)))",
    `${AGENTS_REF.queryKeyRule} useQuery queryKey는 2nd segment(list/detail 등)를 권장합니다. 단, invalidateQueries/removeQueries의 1세그 도메인 키는 예외로 허용됩니다.`,
  ),
];

const invalidationRecommendationRules = [
  recommend(
    "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(invalidateQueries|removeQueries)$/] Property[key.name='queryKey'] > ArrayExpression:has(> :nth-child(2)):has(> :nth-child(2)[type='Identifier']):not(:has(> Literal:nth-child(2)[value='detail']))",
    `${AGENTS_REF.queryKeyRule} 상세 무효화라면 ['domain', 'detail', id] 형태를 권장합니다. 도메인 전체 무효화(['domain'])는 허용됩니다.`,
  ),
  recommend(
    "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(invalidateQueries|removeQueries)$/] Property[key.name='queryKey'] > ArrayExpression:has(> :nth-child(2)[type='TemplateLiteral']):not(:has(> Literal:nth-child(2)[value='detail']))",
    `${AGENTS_REF.queryKeyRule} 상세 무효화라면 ['domain', 'detail', id] 형태를 권장합니다. 도메인 전체 무효화(['domain'])는 허용됩니다.`,
  ),
];
/* ======================= Query 규칙 ======================= */

/* ======================= Realtime 규칙 ======================= */
const realtimeSubscriptionRules = [
  forbid(
    "CallExpression[callee.type='Identifier'][callee.name='subscribe']",
    `${AGENTS_REF.realtimePageRule} subscribe* 직접 호출 대신 subscribeXxxRealtime을 사용하세요.`,
  ),
  forbid(
    "CallExpression[callee.type='Identifier'][callee.name='unsubscribe']",
    `${AGENTS_REF.realtimePageRule} unsubscribe* 직접 호출 대신 unsubscribeXxxRealtime을 사용하세요.`,
  ),
  forbid(
    "CallExpression[callee.type='MemberExpression'][callee.property.name='subscribe']",
    `${AGENTS_REF.realtimePageRule} 객체의 subscribe() 직접 호출 대신 composable의 subscribeXxxRealtime을 사용하세요.`,
  ),
  forbid(
    "CallExpression[callee.type='MemberExpression'][callee.property.name='unsubscribe']",
    `${AGENTS_REF.realtimePageRule} 객체의 unsubscribe() 직접 호출 대신 composable의 unsubscribeXxxRealtime을 사용하세요.`,
  ),
];
/* ======================= Realtime 규칙 ======================= */

/* ======================= Composable 규칙 ======================= */
const composableMutationRules = [
  forbid(
    'ReturnStatement > Identifier[name=/[Mm]utation/]',
    `${AGENTS_REF.noMutationReturn} mutateAsync 기반 도메인 액션 함수로 감싸서 반환하세요.`,
  ),
  forbid(
    "ReturnStatement ObjectExpression > Property[value.type='Identifier'][value.name=/[Mm]utation/]",
    `${AGENTS_REF.noMutationReturn} mutateAsync 기반 도메인 액션 함수로 감싸서 반환하세요.`,
  ),
  forbid(
    "CallExpression[callee.object.name=/[Mm]utation/][callee.property.name='mutate']",
    `${AGENTS_REF.mutateAsyncOnly} mutate() 대신 mutateAsync()를 사용하세요.`,
  ),
  forbid(
    "VariableDeclarator[id.type='ObjectPattern'][init.type='CallExpression'][init.callee.name='useMutation']",
    `${AGENTS_REF.noMutationReturn} useMutation 결과 구조분해를 금지합니다. mutation 객체는 내부에서만 사용하고 mutateAsync 기반 도메인 액션으로 노출하세요.`,
  ),
  forbid(
    "CallExpression[callee.type='Identifier'][callee.name='mutate']",
    `${AGENTS_REF.mutateAsyncOnly} mutate() 대신 mutateAsync()를 사용하세요.`,
  ),
];
/* ======================= Composable 규칙 ======================= */

/* ======================= Shoelace 규칙 ======================= */
const shoelaceFormVModelRules = [
  forbid(
    "VElement[name='sl-select'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    `${AGENTS_REF.shoelaceFirstPrinciple} sl-select에서는 v-model 대신 :value + @sl-change를 사용하세요.`,
  ),
  forbid(
    "VElement[name='sl-checkbox'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    `${AGENTS_REF.shoelaceFirstPrinciple} sl-checkbox에서는 v-model 대신 :checked/@sl-change를 사용하세요.`,
  ),
  forbid(
    "VElement[name='sl-switch'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    `${AGENTS_REF.shoelaceFirstPrinciple} sl-switch에서는 v-model 대신 :checked/@sl-change를 사용하세요.`,
  ),
  forbid(
    "VElement[name='sl-radio-group'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    `${AGENTS_REF.shoelaceFirstPrinciple} sl-radio-group에서는 v-model 대신 :value + @sl-change를 사용하세요.`,
  ),
];

const shoelaceValueParsingRules = [
  forbid(
    "FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='value']",
    `${AGENTS_REF.shoelaceChangeParsing} event.target.value 직접 접근을 피하세요.`,
  ),
  forbid(
    "FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='checked']",
    `${AGENTS_REF.shoelaceChangeParsing} event.target.checked 직접 접근을 피하세요.`,
  ),
  forbid(
    "VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='value']",
    `${AGENTS_REF.shoelaceChangeParsing} event.target.value 직접 접근을 피하세요.`,
  ),
  forbid(
    "VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='checked']",
    `${AGENTS_REF.shoelaceChangeParsing} event.target.checked 직접 접근을 피하세요.`,
  ),
];

const shoelaceHelperRecommendationRules = [
  recommend(
    'FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/]:not(:has(Identifier[name=/^readShoelace(SingleValue|MultiValue|Checked)$/]))',
    `${AGENTS_REF.shoelaceChangeParsing} readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked 사용을 권장합니다.`,
  ),
  recommend(
    'VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/][init.type=/ArrowFunctionExpression|FunctionExpression/]:not(:has(Identifier[name=/^readShoelace(SingleValue|MultiValue|Checked)$/]))',
    `${AGENTS_REF.shoelaceChangeParsing} readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked 사용을 권장합니다.`,
  ),
];
const shoelaceChangeHandlerNamingRecommendationRules = [
  recommend(
    "VAttribute[directive=true][key.name.name='on'][key.argument.name='sl-change'] > VExpressionContainer > Identifier:not([name=/^onChange[A-Z].+/])",
    `${AGENTS_REF.sfcMethodNaming} @sl-change 핸들러명은 onChangeXxx 형태를 권장합니다.`,
  ),
  recommend(
    "VAttribute[directive=true][key.name.name='on'][key.argument.name='sl-change'] > VExpressionContainer > MemberExpression[property.name]:not(:has(Identifier[name=/^onChange[A-Z].+/]))",
    `${AGENTS_REF.sfcMethodNaming} @sl-change 핸들러명은 onChangeXxx 형태를 권장합니다.`,
  ),
];
/* ======================= Shoelace 규칙 ======================= */

/* ======================= 레이어 경계 규칙 ======================= */
const boundaryBaseRules = [
  pbCollectionLiteralRule,
  forbid(
    "CallExpression[callee.object.name='pb'][callee.property.name='collection']",
    `${AGENTS_REF.noDirectPbCall} 도메인 composable 액션을 사용하세요.`,
  ),
  forbid(
    "CallExpression[callee.object.name='pb'][callee.property.name='send']",
    `${AGENTS_REF.noDirectPbCall} 도메인 composable 액션을 사용하세요.`,
  ),
  forbid(
    "CallExpression[callee.name='useQuery']",
    `${AGENTS_REF.queryOnlyInComposable} pages/components에서는 composable 액션을 호출하세요.`,
  ),
  forbid(
    "CallExpression[callee.name='useMutation']",
    `${AGENTS_REF.queryOnlyInComposable} pages/components에서는 composable 액션을 호출하세요.`,
  ),
];

const pageOnlyBoundaryRules = [
  forbid(
    "CallExpression[callee.name='useQueryClient']",
    `${AGENTS_REF.queryOnlyInComposable} pages에서 useQueryClient()를 직접 사용하지 마세요.`,
  ),
  forbid(
    "Identifier[name='queryClient']",
    `${AGENTS_REF.queryOnlyInComposable} pages에서 queryClient를 직접 사용하지 마세요.`,
  ),
];

const pageBoundaryRules = [
  ...boundaryBaseRules,
  ...pageOnlyBoundaryRules,
  ...realtimeSubscriptionRules,
  ...queryKeyRules,
  ...shoelaceFormVModelRules,
  ...shoelaceValueParsingRules,
];

const componentBoundaryRules = [
  ...boundaryBaseRules,
  ...realtimeSubscriptionRules,
  ...queryKeyRules,
  ...shoelaceFormVModelRules,
  ...shoelaceValueParsingRules,
];

const composableRules = [
  pbCollectionLiteralRule,
  forbid(
    'VariableDeclarator[id.name=/^on[A-Z].+/]',
    `${AGENTS_REF.composableNaming} composable 메서드에서 onXxx 네이밍은 금지됩니다. 도메인 액션(CRUD/구독)은 fetch/create/update/delete/subscribe/unsubscribe 동사를 사용하고, 내부 유틸은 도메인 의미가 드러나면 예외 가능합니다.`,
  ),
  forbid(
    'FunctionDeclaration[id.name=/^on[A-Z].+/]',
    `${AGENTS_REF.composableNaming} composable 메서드에서 onXxx 네이밍은 금지됩니다. 도메인 액션(CRUD/구독)은 fetch/create/update/delete/subscribe/unsubscribe 동사를 사용하고, 내부 유틸은 도메인 의미가 드러나면 예외 가능합니다.`,
  ),
  ...composableMutationRules,
  ...queryKeyRules,
];

const commonRules = [pbCollectionLiteralRule, ...queryKeyRules, ...shoelaceFormVModelRules];
/* ======================= 레이어 경계 규칙 ======================= */

/* ======================= 최종 적용 블록 ======================= */
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
  // Shoelace form 컴포넌트의 v-model 금지 규칙 (template AST 전용)
  {
    files: ['apps/*/src/**/*.vue', 'packages/src/**/*.vue'],
    rules: {
      'vue/no-restricted-syntax': ['error', ...shoelaceFormVModelRules],
    },
  },
  // useQuery queryKey 2nd segment / readShoelace 헬퍼 권장 규칙 (warning)
  {
    files: ['apps/*/src/**/*.{js,ts,vue}', 'packages/src/**/*.{js,ts,vue}'],
    rules: {
      '@/no-restricted-syntax': [
        'warn',
        ...queryKeyRecommendationRules,
        ...invalidationRecommendationRules,
        ...shoelaceHelperRecommendationRules,
        ...shoelaceChangeHandlerNamingRecommendationRules,
      ],
    },
  },
];
/* ======================= 최종 적용 블록 ======================= */

export default eslintCustomRuleConfig;
