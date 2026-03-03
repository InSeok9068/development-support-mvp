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
  shoelaceNativeFormException:
    'AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙(네이티브 폼 태그 예외: input[type=file], input[type=text][hidden]만 허용).',
  shoelaceChangeParsing:
    'AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace @sl-change 이벤트 값 파싱은 readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked를 기본값으로 사용한다.',
  sfcMethodNaming: 'AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Vue SFC 메서드 명명 규칙.',
  pbHooksRuntime:
    'AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지.',
  pbHooksModuleLoad:
    'AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > pb_hooks 내부 파일 로드는 __hooks 절대경로를 기본으로 사용한다.',
  pbHooksCjs:
    'AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > 모듈 로딩은 CommonJS(require/module.exports)만 사용한다.',
};

/* ======================= 공통 유틸 ======================= */
const rule = (selector, message) => ({ selector, message });
const forbid = (selector, message) => rule(selector, `[금지] ${message}`);
const recommend = (selector, message) => rule(selector, `[권장] ${message}`);
const pbHooksForbid = (selector, message) => rule(selector, `[PB_HOOKS 전용][금지] ${message}`);
const pbHooksRecommend = (selector, message) => rule(selector, `[PB_HOOKS 전용][권장] ${message}`);

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

const nativeFormTagRestrictionRules = [
  forbid(
    "VElement[name='button']",
    `${AGENTS_REF.shoelaceNativeFormException} 네이티브 <button> 대신 <sl-button>을 사용하세요.`,
  ),
  forbid(
    "VElement[name='select']",
    `${AGENTS_REF.shoelaceNativeFormException} 네이티브 <select> 대신 <sl-select>를 사용하세요.`,
  ),
  forbid(
    "VElement[name='textarea']",
    `${AGENTS_REF.shoelaceNativeFormException} 네이티브 <textarea> 대신 <sl-textarea>를 사용하세요.`,
  ),
  forbid(
    "VElement[name='input']:not(:has(VAttribute[key.name='type'][value.value='file'])):not(:has(VAttribute[key.name='type'][value.value='text']):has(VAttribute[key.name='hidden']))",
    `${AGENTS_REF.shoelaceNativeFormException} 네이티브 <input>은 type='file' 또는 type='text' hidden 예외 외 사용을 금지합니다.`,
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

/* ======================= PB_HOOKS 전용 규칙 ======================= */
const pbHooksRuntimeRules = [
  pbHooksForbid('ImportDeclaration', `${AGENTS_REF.pbHooksCjs} ESM import를 사용하지 마세요.`),
  pbHooksForbid('ExportNamedDeclaration', `${AGENTS_REF.pbHooksCjs} ESM export를 사용하지 마세요.`),
  pbHooksForbid('ExportDefaultDeclaration', `${AGENTS_REF.pbHooksCjs} ESM export default를 사용하지 마세요.`),
  pbHooksForbid('ExportAllDeclaration', `${AGENTS_REF.pbHooksCjs} ESM export * 를 사용하지 마세요.`),
  pbHooksForbid('ImportExpression', `${AGENTS_REF.pbHooksCjs} dynamic import()를 사용하지 마세요.`),
  pbHooksForbid(
    "CallExpression[callee.name='require'][arguments.0.type='Literal'][arguments.0.value=/^(\\.\\.?\\/)/]",
    `${AGENTS_REF.pbHooksModuleLoad} require('__hooks/...') 절대경로를 사용하세요.`,
  ),
  pbHooksForbid(
    "CallExpression[callee.name='require'][arguments.0.type='Literal'][arguments.0.value=/^(fs|path|buffer|crypto|child_process|stream|http|https)$/]",
    `${AGENTS_REF.pbHooksRuntime} Node 내장 모듈 require를 사용하지 마세요.`,
  ),
  pbHooksForbid("CallExpression[callee.name='fetch']", `${AGENTS_REF.pbHooksRuntime} fetch를 사용하지 마세요.`),
  pbHooksForbid(
    "CallExpression[callee.name='setTimeout']",
    `${AGENTS_REF.pbHooksRuntime} setTimeout 대신 PocketBase hook 흐름으로 제어하세요.`,
  ),
  pbHooksForbid(
    "CallExpression[callee.name='setInterval']",
    `${AGENTS_REF.pbHooksRuntime} setInterval 대신 cronAdd를 사용하세요.`,
  ),
  pbHooksForbid("Identifier[name='window']", `${AGENTS_REF.pbHooksRuntime} window를 사용하지 마세요.`),
  pbHooksForbid("Identifier[name='document']", `${AGENTS_REF.pbHooksRuntime} document를 사용하지 마세요.`),
  pbHooksForbid("Identifier[name='navigator']", `${AGENTS_REF.pbHooksRuntime} navigator를 사용하지 마세요.`),
  pbHooksForbid("Identifier[name='localStorage']", `${AGENTS_REF.pbHooksRuntime} localStorage를 사용하지 마세요.`),
  pbHooksForbid("Identifier[name='sessionStorage']", `${AGENTS_REF.pbHooksRuntime} sessionStorage를 사용하지 마세요.`),
  pbHooksForbid("Identifier[name='Buffer']", `${AGENTS_REF.pbHooksRuntime} Buffer를 사용하지 마세요.`),
];

const pbHooksDataSafetyRules = [
  pbHooksForbid(
    "CallExpression[callee.type='MemberExpression'][callee.property.name='newQuery'][arguments.0.type='TemplateLiteral']",
    'newQuery SQL 문자열에 템플릿 리터럴 보간을 사용하지 마세요. 바인딩 파라미터를 사용하세요.',
  ),
  pbHooksForbid(
    "CallExpression[callee.type='MemberExpression'][callee.property.name='findRecordsByFilter'][arguments.1.type='TemplateLiteral']",
    'findRecordsByFilter filter 문자열에 템플릿 리터럴 보간을 사용하지 마세요. {:param} + params를 사용하세요.',
  ),
  pbHooksForbid(
    "CallExpression[callee.type='MemberExpression'][callee.property.name='findFirstRecordByFilter'][arguments.1.type='TemplateLiteral']",
    'findFirstRecordByFilter filter 문자열에 템플릿 리터럴 보간을 사용하지 마세요. {:param} + params를 사용하세요.',
  ),
];

const pbHooksRoutingRecommendationRules = [
  pbHooksRecommend(
    "CallExpression[callee.name='routerAdd'][arguments.0.type='Literal'][arguments.0.value=/^(get|post|put|patch|delete|options|head)$/]",
    'routerAdd HTTP method는 대문자(GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD)를 권장합니다.',
  ),
  pbHooksRecommend(
    "CallExpression[callee.name='routerAdd'][arguments.1.type='Literal']:not([arguments.1.value=/^\\/api\\//])",
    '커스텀 라우트 path는 /api/... prefix를 권장합니다.',
  ),
];

const pbHooksRoutingSafetyRules = [
  pbHooksForbid(
    "CallExpression[callee.name='routerAdd']:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\//]):not(:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\/public\\//])):not(:has(CallExpression[callee.type='MemberExpression'][callee.object.name='$apis'][callee.property.name=/^(requireAuth|requireSuperuserAuth)$/]))",
    '인증/내부 API(/api/*, /api/public/* 제외)는 $apis.requireAuth() 또는 $apis.requireSuperuserAuth()를 사용하세요.',
  ),
  pbHooksForbid(
    "CallExpression[callee.name='routerAdd']:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\/public\\//]):has(CallExpression[callee.type='MemberExpression'][callee.object.name='$apis'][callee.property.name=/^(requireAuth|requireSuperuserAuth)$/])",
    '공개 API(/api/public/*)에는 $apis.requireAuth()/requireSuperuserAuth()를 사용하지 마세요.',
  ),
];

const pbHooksHttpRecommendationRules = [
  pbHooksRecommend(
    "CallExpression[callee.object.name='$http'][callee.property.name='send'][arguments.0.type='ObjectExpression']:not(:has(Property[key.name='timeout']))",
    '$http.send 요청에는 timeout 명시를 권장합니다.',
  ),
];

const pbHooksRules = [...pbHooksRuntimeRules, ...pbHooksDataSafetyRules, ...pbHooksRoutingSafetyRules];
const pbHooksRecommendationRules = [...pbHooksRoutingRecommendationRules, ...pbHooksHttpRecommendationRules];
/* ======================= PB_HOOKS 전용 규칙 ======================= */

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

const componentOnlyBoundaryRules = [
  forbid(
    "CallExpression[callee.name='useQueryClient']",
    `${AGENTS_REF.queryOnlyInComposable} components에서 useQueryClient()를 직접 사용하지 마세요.`,
  ),
  forbid(
    "Identifier[name='queryClient']",
    `${AGENTS_REF.queryOnlyInComposable} components에서 queryClient를 직접 사용하지 마세요.`,
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
  ...componentOnlyBoundaryRules,
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
  // PB_HOOKS 전용 규칙
  syntaxBlock(['apps/*/pb_hooks/**/*.pb.ts'], pbHooksRules),
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
      'vue/no-restricted-syntax': ['error', ...shoelaceFormVModelRules, ...nativeFormTagRestrictionRules],
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
  // PB_HOOKS 전용 권장 규칙 (warning)
  {
    files: ['apps/*/pb_hooks/**/*.pb.ts'],
    rules: {
      '@/no-restricted-syntax': ['warn', ...pbHooksRecommendationRules],
    },
  },
];
/* ======================= 최종 적용 블록 ======================= */

export default eslintCustomRuleConfig;
