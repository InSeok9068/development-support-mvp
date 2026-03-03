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

/* ===== 공통 유틸 ===== */
const rule = (selector, message) => ({ selector, message });
const buildRulePayload = (level, policy, violation, remediation, example = '') => ({
  event: 'eslint.custom.rule.violation',
  level,
  policy,
  violation,
  remediation,
  example,
  source: 'eslint.custom.rule.js',
});
const normalizeRuleArgs = (level, isPbHooks, args) => {
  if (typeof args[0] === 'object' && args[0] !== null && typeof args[0].selector === 'string') {
    const { selector, policy, violation, remediation, example = '' } = args[0];
    return {
      selector,
      message: JSON.stringify({
        ...buildRulePayload(level, policy, violation, remediation, example),
        ...(isPbHooks ? { scope: 'pb_hooks' } : {}),
      }),
    };
  }

  const [selector, policy, violation, remediation, example = ''] = args;
  return {
    selector,
    message: JSON.stringify({
      ...buildRulePayload(level, policy, violation, remediation, example),
      ...(isPbHooks ? { scope: 'pb_hooks' } : {}),
    }),
  };
};
const errorRule = (...args) => {
  const { selector, message } = normalizeRuleArgs('error', false, args);
  return rule(selector, message);
};
const warnRule = (...args) => {
  const { selector, message } = normalizeRuleArgs('warn', false, args);
  return rule(selector, message);
};
const pbHooksErrorRule = (...args) => {
  const { selector, message } = normalizeRuleArgs('error', true, args);
  return rule(selector, message);
};
const pbHooksWarnRule = (...args) => {
  const { selector, message } = normalizeRuleArgs('warn', true, args);
  return rule(selector, message);
};

const restrictedSyntaxBlock = (
  files,
  severity,
  restrictedSyntaxRules,
  ignores = [],
  ruleName = 'no-restricted-syntax',
) => ({
  files,
  ...(ignores.length ? { ignores } : {}),
  rules: {
    [ruleName]: [severity, ...restrictedSyntaxRules],
  },
});

const restrictedSyntaxErrorBlock = (files, restrictedSyntaxRules, ignores = [], ruleName = 'no-restricted-syntax') =>
  restrictedSyntaxBlock(files, 'error', restrictedSyntaxRules, ignores, ruleName);

const restrictedSyntaxWarnBlock = (files, restrictedSyntaxRules, ignores = [], ruleName = '@/no-restricted-syntax') =>
  restrictedSyntaxBlock(files, 'warn', restrictedSyntaxRules, ignores, ruleName);

const FILE_GLOB = {
  pages: 'apps/*/src/pages/**/*.{js,ts,vue}',
  components: 'apps/*/src/components/**/*.{js,ts,vue}',
  composables: 'apps/*/src/composables/**/*.{js,ts,vue}',
  appSrc: 'apps/*/src/**/*.{js,ts,vue}',
  packageSrc: 'packages/src/**/*.{js,ts,vue}',
  appVue: 'apps/*/src/**/*.vue',
  packageVue: 'packages/src/**/*.vue',
  pbHooksTs: 'apps/*/pb_hooks/**/*.ts',
};

/* ===== 쿼리 규칙 ===== */
const pbCollectionLiteralErrorRules = [
  errorRule({
    selector: "CallExpression[callee.object.name='pb'][callee.property.name='collection'][arguments.0.type='Literal']",
    policy: AGENTS_REF.pbCollectionLiteral,
    violation: 'pb.collection() 첫 인자로 문자열 리터럴 전달',
    remediation: 'Collections Enum을 사용하도록 변경',
    example: `pb.collection("works") → pb.collection(Collections.Works)`,
  }),
];

const queryKeyErrorRules = [
  errorRule({
    selector: "Property[key.name='queryKey'] MemberExpression[object.name='Collections']",
    policy: AGENTS_REF.queryKeyRule,
    violation: 'queryKey 1번째 세그먼트에 Collections Enum 사용',
    remediation: '쿼리 키는 도메인 문자열로 통일',
    example: "queryKey: [Collections.Works] → queryKey: ['works']",
  }),
  errorRule({
    selector: "Property[key.name='queryKey'] > ArrayExpression > :first-child:not(Literal[value=/^[a-z0-9-]+$/])",
    policy: AGENTS_REF.queryKeyRule,
    violation: 'queryKey 1번째 세그먼트가 소문자 도메인 문자열이 아님',
    remediation: '도메인 문자열(소문자 + 하이픈)로 맞춤',
    example: "queryKey: ['Works', 'list'] → queryKey: ['works', 'list']",
  }),
];

const queryKeyWarnRules = [
  warnRule({
    selector: "CallExpression[callee.name='useQuery'] Property[key.name='queryKey'] > ArrayExpression:not(:has(> :nth-child(2)))",
    policy: AGENTS_REF.queryKeyRule,
    violation: 'useQuery 쿼리 키에 2번째 세그먼트 없음',
    remediation: '목적을 표현하는 2번째 세그먼트 추가',
    example: "queryKey: ['works'] → queryKey: ['works', 'list', params]",
  }),
];

const invalidationWarnRules = [
  warnRule({
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(invalidateQueries|removeQueries)$/] Property[key.name='queryKey'] > ArrayExpression:has(> :nth-child(2)):has(> :nth-child(2)[type='Identifier']):not(:has(> Literal:nth-child(2)[value='detail']))",
    policy: AGENTS_REF.queryKeyRule,
    violation: 'invalidate/removeQueries에서 detail 대상 캐시를 detail 세그먼트 없이 사용',
    remediation: "상세 캐시는 ['domain', 'detail', id] 패턴으로 작성",
    example: "invalidateQueries({ queryKey: ['works', id] }) → invalidateQueries({ queryKey: ['works', 'detail', id] })",
  }),
  warnRule({
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(invalidateQueries|removeQueries)$/] Property[key.name='queryKey'] > ArrayExpression:has(> :nth-child(2)[type='TemplateLiteral']):not(:has(> Literal:nth-child(2)[value='detail']))",
    policy: AGENTS_REF.queryKeyRule,
    violation: 'invalidate/removeQueries에서 detail 세그먼트가 템플릿으로 혼재',
    remediation: '상세 무효화는 detail Literal 문자열로 고정',
    example: "invalidateQueries({ queryKey: ['works', `${'detail'}Id`] }) → invalidateQueries({ queryKey: ['works', 'detail', id] })",
  }),
];

/* ===== 리얼타임 규칙 ===== */
const realtimeSubscriptionErrorRules = [
  errorRule({
    selector: "CallExpression[callee.type='Identifier'][callee.name='subscribe']",
    policy: AGENTS_REF.realtimePageRule,
    violation: '페이지/컴포넌트에서 subscribe() 직접 호출',
    remediation: 'composable의 subscribeXxxRealtime()로 대체',
    example: 'subscribe(...) → subscribeTodosRealtime(...)',
  }),
  errorRule({
    selector: "CallExpression[callee.type='Identifier'][callee.name='unsubscribe']",
    policy: AGENTS_REF.realtimePageRule,
    violation: '페이지/컴포넌트에서 unsubscribe() 직접 호출',
    remediation: 'composable의 unsubscribeXxxRealtime()로 대체',
    example: 'unsubscribe(...) → unsubscribeTodosRealtime()',
  }),
  errorRule({
    selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='subscribe']",
    policy: AGENTS_REF.realtimePageRule,
    violation: '객체.subscribe() 호출',
    remediation: '도메인 composable의 subscribeXxxRealtime() 사용',
    example: 'someRef.subscribe(...) → subscribeTodosRealtime(...)',
  }),
  errorRule({
    selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='unsubscribe']",
    policy: AGENTS_REF.realtimePageRule,
    violation: '객체.unsubscribe() 호출',
    remediation: '도메인 composable의 unsubscribeXxxRealtime() 사용',
    example: 'someRef.unsubscribe() → unsubscribeTodosRealtime()',
  }),
];

/* ===== 컴포저블 규칙 ===== */
const composableMutationErrorRules = [
  errorRule({
    selector: 'ReturnStatement > Identifier[name=/[Mm]utation/]',
    policy: AGENTS_REF.noMutationReturn,
    violation: 'composable 반환값에 mutation 객체가 직접 노출',
    remediation: '도메인 액션 함수로 감싸 반환',
    example: 'return { createTodoMutation } → return { createTodo: async (payload) => createTodoMutation.mutateAsync(payload) }',
  }),
  errorRule({
    selector: "ReturnStatement ObjectExpression > Property[value.type='Identifier'][value.name=/[Mm]utation/]",
    policy: AGENTS_REF.noMutationReturn,
    violation: 'return 객체에 mutation 식별자 노출',
    remediation: 'mutation 객체는 내부 처리 후 액션 함수만 노출',
    example: 'return { updateTodoMutation } → return { updateTodo }',
  }),
  errorRule({
    selector: "CallExpression[callee.object.name=/[Mm]utation/][callee.property.name='mutate']",
    policy: AGENTS_REF.mutateAsyncOnly,
    violation: 'mutate() 호출',
    remediation: 'mutateAsync()로 변경해 Promise 흐름 사용',
    example: 'mutation.mutate(payload) → mutation.mutateAsync(payload)',
  }),
  errorRule({
    selector: "VariableDeclarator[id.type='ObjectPattern'][init.type='CallExpression'][init.callee.name='useMutation']",
    policy: AGENTS_REF.noMutationReturn,
    violation: 'useMutation() 결과를 구조분해해서 노출',
    remediation: '내부에서만 처리하고 액션 함수를 노출',
    example: `const { mutate, data } = useMutation(...) → const createTodo = async (payload) => mutation.mutateAsync(payload)`,
  }),
  errorRule({
    selector: "CallExpression[callee.type='Identifier'][callee.name='mutate']",
    policy: AGENTS_REF.mutateAsyncOnly,
    violation: 'mutation mutate 호출',
    remediation: 'mutateAsync()로 변경',
    example: 'mutate(payload) → mutateAsync(payload)',
  }),
];

/* ===== Shoelace 규칙 ===== */
const shoelaceFormVModelErrorRules = [
  errorRule({
    selector: "VElement[name='sl-select'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    policy: AGENTS_REF.shoelaceFirstPrinciple,
    violation: 'sl-select에서 v-model 사용',
    remediation: ':value와 @sl-change 조합으로 변경',
    example: '<sl-select v-model="value" /> → <sl-select :value="value" @sl-change="onChangeValue" />',
  }),
  errorRule({
    selector: "VElement[name='sl-checkbox'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    policy: AGENTS_REF.shoelaceFirstPrinciple,
    violation: 'sl-checkbox에서 v-model 사용',
    remediation: ':checked와 @sl-change 조합으로 변경',
    example: '<sl-checkbox v-model="checked" /> → <sl-checkbox :checked="checked" @sl-change="onChangeChecked" />',
  }),
  errorRule({
    selector: "VElement[name='sl-switch'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    policy: AGENTS_REF.shoelaceFirstPrinciple,
    violation: 'sl-switch에서 v-model 사용',
    remediation: ':checked와 @sl-change 조합으로 변경',
    example: '<sl-switch v-model="value" /> → <sl-switch :checked="value" @sl-change="onChangeSwitch" />',
  }),
  errorRule({
    selector: "VElement[name='sl-radio-group'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    policy: AGENTS_REF.shoelaceFirstPrinciple,
    violation: 'sl-radio-group에서 v-model 사용',
    remediation: ':value와 @sl-change 조합으로 변경',
    example: '<sl-radio-group v-model="value" /> → <sl-radio-group :value="value" @sl-change="onChangeValue" />',
  }),
];

const nativeFormTagRestrictionErrorRules = [
  errorRule({
    selector: "VElement[name='button']",
    policy: AGENTS_REF.shoelaceNativeFormException,
    violation: '네이티브 <button> 직접 사용',
    remediation: 'Shoelace <sl-button>으로 변경',
    example: '<button>저장</button> → <sl-button>저장</sl-button>',
  }),
  errorRule({
    selector: "VElement[name='select']",
    policy: AGENTS_REF.shoelaceNativeFormException,
    violation: '네이티브 <select> 직접 사용',
    remediation: 'Shoelace <sl-select>으로 변경',
    example: '<select>...</select> → <sl-select>...</sl-select>',
  }),
  errorRule({
    selector: "VElement[name='textarea']",
    policy: AGENTS_REF.shoelaceNativeFormException,
    violation: '네이티브 <textarea> 직접 사용',
    remediation: 'Shoelace <sl-textarea>으로 변경',
    example: '<textarea></textarea> → <sl-textarea></sl-textarea>',
  }),
  errorRule({
    selector:
      "VElement[name='input']:not(:has(VAttribute[key.name='type'][value.value='file'])):not(:has(VAttribute[key.name='type'][value.value='text']):has(VAttribute[key.name='hidden']))",
    policy: AGENTS_REF.shoelaceNativeFormException,
    violation: '허용 예외 외에 네이티브 <input> 사용',
    remediation: 'Shoelace 컴포넌트 또는 파일/hidden 예외만 사용',
    example: '<input type="text" /> → <sl-input :value="v" @sl-change="onChangeValue" />',
  }),
];

const shoelaceValueParsingErrorRules = [
  errorRule({
    selector:
      "FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='value']",
    policy: AGENTS_REF.shoelaceChangeParsing,
    violation: 'onChange 함수에서 event.target.value 접근',
    remediation: 'readShoelaceSingleValue / readShoelaceMultiValue 사용',
    example: 'event.target.value → readShoelaceSingleValue(event)',
  }),
  errorRule({
    selector:
      "FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='checked']",
    policy: AGENTS_REF.shoelaceChangeParsing,
    violation: 'onChange 함수에서 event.target.checked 접근',
    remediation: 'readShoelaceChecked 사용',
    example: 'event.target.checked → readShoelaceChecked(event)',
  }),
  errorRule({
    selector:
      "VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='value']",
    policy: AGENTS_REF.shoelaceChangeParsing,
    violation: 'onChange 변수/람다에서 event.target.value 접근',
    remediation: 'readShoelaceSingleValue / readShoelaceMultiValue 사용',
    example: 'event.target.value → readShoelaceSingleValue(event)',
  }),
  errorRule({
    selector:
      "VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='checked']",
    policy: AGENTS_REF.shoelaceChangeParsing,
    violation: 'onChange 변수/람다에서 event.target.checked 접근',
    remediation: 'readShoelaceChecked 사용',
    example: 'event.target.checked → readShoelaceChecked(event)',
  }),
];

const shoelaceHelperWarnRules = [
  warnRule({
    selector:
      'FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/]:not(:has(Identifier[name=/^readShoelace(SingleValue|MultiValue|Checked)$/]))',
    policy: AGENTS_REF.shoelaceChangeParsing,
    violation: 'onChange 핸들러에서 readShoelace* 미사용',
    remediation: '권장 헬퍼 사용으로 파싱 표준화',
    example: 'const v = event.target.value → const v = readShoelaceSingleValue(event)',
  }),
  warnRule({
    selector:
      'VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/][init.type=/ArrowFunctionExpression|FunctionExpression/]:not(:has(Identifier[name=/^readShoelace(SingleValue|MultiValue|Checked)$/]))',
    policy: AGENTS_REF.shoelaceChangeParsing,
    violation: 'onChange 변수형 핸들러에서 readShoelace* 미사용',
    remediation: '권장 헬퍼 사용으로 파싱 표준화',
    example: 'const v = event.target.value → const v = readShoelaceSingleValue(event)',
  }),
];
const shoelaceChangeHandlerNamingWarnRules = [
  warnRule({
    selector:
      "VAttribute[directive=true][key.name.name='on'][key.argument.name='sl-change'] > VExpressionContainer > Identifier:not([name=/^onChange[A-Z].+/])",
    policy: AGENTS_REF.sfcMethodNaming,
    violation: '@sl-change 핸들러 이름이 onChangeXxx 규약과 다름',
    remediation: 'onChangeXxx 형태로 변경',
    example: 'handlerChange → onChangeValue',
  }),
  warnRule({
    selector:
      "VAttribute[directive=true][key.name.name='on'][key.argument.name='sl-change'] > VExpressionContainer > MemberExpression[property.name]:not(:has(Identifier[name=/^onChange[A-Z].+/]))",
    policy: AGENTS_REF.sfcMethodNaming,
    violation: '@sl-change 핸들러 멤버명명이 규약과 다름',
    remediation: 'onChangeXxx 형태로 변경',
    example: 'method.handle → onChangeValue',
  }),
];

/* ===== PB_HOOKS 전용 규칙 ===== */
const pbHooksRuntimeErrorRules = [
  pbHooksErrorRule({
    selector: 'ImportDeclaration',
    policy: AGENTS_REF.pbHooksCjs,
    violation: 'ESM import 사용',
    remediation: 'CJS require로 변경',
    example: `import dayjs from 'dayjs' → const dayjs = require('dayjs')`,
  }),
  pbHooksErrorRule({
    selector: 'ExportNamedDeclaration',
    policy: AGENTS_REF.pbHooksCjs,
    violation: 'ESM named export 사용',
    remediation: 'module.exports로 export 처리',
    example: `export const fn = () => {} → module.exports.fn = fn`,
  }),
  pbHooksErrorRule({
    selector: 'ExportDefaultDeclaration',
    policy: AGENTS_REF.pbHooksCjs,
    violation: 'ESM export default 사용',
    remediation: 'module.exports로 대체',
    example: `export default handler → module.exports = handler`,
  }),
  pbHooksErrorRule({
    selector: 'ExportAllDeclaration',
    policy: AGENTS_REF.pbHooksCjs,
    violation: 'ESM export * 사용',
    remediation: 'CJS 호환 방식으로 변경',
    example: `export * from './x' → const x = require('./x'); Object.assign(module.exports, x)`,
  }),
  pbHooksErrorRule({
    selector: 'ImportExpression',
    policy: AGENTS_REF.pbHooksCjs,
    violation: '동적 import() 사용',
    remediation: 'require() 사용',
    example: `import('foo') → require('foo')`,
  }),
  pbHooksErrorRule({
    selector: "CallExpression[callee.name='require'][arguments.0.type='Literal'][arguments.0.value=/^(\\.\\.?\\/)/]",
    policy: AGENTS_REF.pbHooksModuleLoad,
    violation: 'require 상대 경로 사용',
    remediation: '__hooks 절대경로로 변경',
    example: `require('./utils') → require('__hooks/utils')`,
  }),
  pbHooksErrorRule({
    selector: "CallExpression[callee.name='require'][arguments.0.type='Literal'][arguments.0.value=/^(fs|path|buffer|crypto|child_process|stream|http|https)$/]",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'Node 내장 모듈 사용',
    remediation: '호환 가능한 대체 경로로 이동',
    example: `require('fs') 사용 제거`,
  }),
  pbHooksErrorRule({
    selector: "CallExpression[callee.name='fetch']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'fetch() 직접 사용',
    remediation: 'PocketBase 훅 규칙에 맞는 흐름으로 전환',
    example: 'fetch(url) → 허용 API 기반 처리',
  }),
  pbHooksErrorRule({
    selector: "CallExpression[callee.name='setTimeout']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'setTimeout 사용',
    remediation: 'hook 실행 흐름으로 타이밍 제어',
    example: 'setTimeout(fn, 1000) → 필요 시 다른 훅 처리로 변경',
  }),
  pbHooksErrorRule({
    selector: "CallExpression[callee.name='setInterval']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'setInterval 사용',
    remediation: 'cronAdd 등 예약 작업으로 대체',
    example: 'setInterval(fn, 1000) → cronAdd(fn, 1000)',
  }),
  pbHooksErrorRule({
    selector: "Identifier[name='window']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'window 전역 객체 사용',
    remediation: 'pb_hooks 환경에서 사용 불가 API 제거',
    example: 'window.location → 제거',
  }),
  pbHooksErrorRule({
    selector: "Identifier[name='document']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'document 전역 객체 사용',
    remediation: 'pb_hooks 환경에서 사용 불가 API 제거',
    example: 'document.querySelector → 제거',
  }),
  pbHooksErrorRule({
    selector: "Identifier[name='navigator']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'navigator 전역 객체 사용',
    remediation: 'pb_hooks 환경에서 사용 불가 API 제거',
    example: 'navigator.userAgent → 제거',
  }),
  pbHooksErrorRule({
    selector: "Identifier[name='localStorage']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'localStorage 사용',
    remediation: '영구 저장 정책을 PB Hooks 용도에 맞게 대체',
    example: 'localStorage.setItem → 제거',
  }),
  pbHooksErrorRule({
    selector: "Identifier[name='sessionStorage']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'sessionStorage 사용',
    remediation: '영구 저장 정책을 PB Hooks 용도에 맞게 대체',
    example: 'sessionStorage.getItem → 제거',
  }),
  pbHooksErrorRule({
    selector: "Identifier[name='Buffer']",
    policy: AGENTS_REF.pbHooksRuntime,
    violation: 'Buffer 사용',
    remediation: '런타임 제약에 맞는 대체 구현 사용',
    example: 'Buffer.from(...) → 대체 로직 적용',
  }),
];

const pbHooksDataSafetyErrorRules = [
  pbHooksErrorRule({
    selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='newQuery'][arguments.0.type='TemplateLiteral']",
    policy: 'PocketBase Hook 데이터 안전성 규칙',
    violation: 'newQuery SQL에 템플릿 보간 사용',
    remediation: '바인딩 파라미터 사용',
    example: "newQuery(`SELECT * FROM a WHERE id=${id}`) → newQuery('SELECT * FROM a WHERE id = {:id}', { id })",
  }),
  pbHooksErrorRule({
    selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='findRecordsByFilter'][arguments.1.type='TemplateLiteral']",
    policy: 'PocketBase Hook 데이터 안전성 규칙',
    violation: 'findRecordsByFilter에서 템플릿 보간 사용',
    remediation: '필터 파라미터 바인딩 사용',
    example: "findRecordsByFilter('users', `${'name'} = '${'name'}'`) → findRecordsByFilter('users', '{name} = :name', { name })",
  }),
  pbHooksErrorRule({
    selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='findFirstRecordByFilter'][arguments.1.type='TemplateLiteral']",
    policy: 'PocketBase Hook 데이터 안전성 규칙',
    violation: 'findFirstRecordByFilter에서 템플릿 보간 사용',
    remediation: '필터 파라미터 바인딩 사용',
    example: "findFirstRecordByFilter('users', `${'name'} = '${'name'}'`) → findFirstRecordByFilter('users', '{name} = :name', { name })",
  }),
];

const pbHooksRoutingWarnRules = [
  pbHooksWarnRule({
    selector: "CallExpression[callee.name='routerAdd'][arguments.0.type='Literal'][arguments.0.value=/^(get|post|put|patch|delete|options|head)$/]",
    policy: 'PocketBase Hook 라우팅 규칙',
    violation: 'routerAdd에서 HTTP 메서드가 소문자',
    remediation: '메서드를 대문자로 통일',
    example: "routerAdd('get', ...) → routerAdd('GET', ...)",
  }),
  pbHooksWarnRule({
    selector: "CallExpression[callee.name='routerAdd'][arguments.1.type='Literal']:not([arguments.1.value=/^\\/api\\//])",
    policy: 'PocketBase Hook 라우팅 규칙',
    violation: '라우트 경로가 /api 접두사 미사용',
    remediation: '/api 접두사 사용',
    example: "routerAdd('GET', '/users', ...) → routerAdd('GET', '/api/users', ...)",
  }),
];

const pbHooksRoutingSafetyErrorRules = [
  pbHooksErrorRule({
    selector:
      "CallExpression[callee.name='routerAdd']:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\//]):not(:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\/public\\//])):not(:has(CallExpression[callee.type='MemberExpression'][callee.object.name='$apis'][callee.property.name=/^(requireAuth|requireSuperuserAuth)$/]))",
    policy: 'PocketBase Hook 라우팅 보안 규칙',
    violation: '/api 경로에서 인증 미들웨어 누락',
    remediation: 'requireAuth 또는 requireSuperuserAuth 추가',
    example: "routerAdd('GET', '/api/data', handler) → routerAdd('GET', '/api/data', handler, $apis.requireAuth())",
  }),
  pbHooksErrorRule({
    selector:
      "CallExpression[callee.name='routerAdd']:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\/public\\//]):has(CallExpression[callee.type='MemberExpression'][callee.object.name='$apis'][callee.property.name=/^(requireAuth|requireSuperuserAuth)$/])",
    policy: 'PocketBase Hook 라우팅 보안 규칙',
    violation: '/api/public 경로에서 인증 미들웨어 사용',
    remediation: 'public 라우트에서 인증 미들웨어 제거',
    example: "routerAdd('GET', '/api/public/ping', handler, $apis.requireAuth()) → routerAdd('GET', '/api/public/ping', handler)",
  }),
];

const pbHooksHttpWarnRules = [
  pbHooksWarnRule({
    selector:
      "CallExpression[callee.object.name='$http'][callee.property.name='send'][arguments.0.type='ObjectExpression']:not(:has(Property[key.name='timeout']))",
    policy: 'PocketBase Hook HTTP 규칙',
    violation: '$http.send timeout 미지정',
    remediation: 'timeout 설정 권장',
    example: '$http.send({ url, method }) → $http.send({ url, method, timeout: 30000 })',
  }),
];

const pbHooksErrorRules = [
  ...pbHooksRuntimeErrorRules,
  ...pbHooksDataSafetyErrorRules,
  ...pbHooksRoutingSafetyErrorRules,
];
const pbHooksWarnRules = [...pbHooksRoutingWarnRules, ...pbHooksHttpWarnRules];

/* ===== 레이어 경계 규칙 ===== */
const boundaryBaseErrorRules = [
  ...pbCollectionLiteralErrorRules,
  errorRule({
    selector: "CallExpression[callee.object.name='pb'][callee.property.name='collection']",
    policy: AGENTS_REF.noDirectPbCall,
    violation: 'page/component에서 pb.collection 직접 호출',
    remediation: '도메인 composable 액션 호출로 위임',
    example: "pb.collection('works').getList() → useWorks().fetchWorkList()",
  }),
  errorRule({
    selector: "CallExpression[callee.object.name='pb'][callee.property.name='send']",
    policy: AGENTS_REF.noDirectPbCall,
    violation: 'page/component에서 pb.send 직접 호출',
    remediation: '도메인 composable 액션 호출로 위임',
    example: 'pb.send(...) → useXxx().someAction()',
  }),
  errorRule({
    selector: "CallExpression[callee.name='useQuery']",
    policy: AGENTS_REF.queryOnlyInComposable,
    violation: 'page/component에서 useQuery 직접 사용',
    remediation: 'composable 액션 함수 호출로 이동',
    example: 'useQuery(...) → useXxx().fetchYyy()',
  }),
  errorRule({
    selector: "CallExpression[callee.name='useMutation']",
    policy: AGENTS_REF.queryOnlyInComposable,
    violation: 'page/component에서 useMutation 직접 사용',
    remediation: 'composable 액션 함수 호출로 이동',
    example: 'useMutation(...) → useXxx().createYyy(...)',
  }),
];

const pageComponentOnlyBoundaryErrorRules = [
  ...boundaryBaseErrorRules,
  errorRule({
    selector: "CallExpression[callee.name='useQueryClient']",
    policy: AGENTS_REF.queryOnlyInComposable,
    violation: 'page/component에서 useQueryClient 직접 사용',
    remediation: 'composable 내부에서 캐시 갱신 처리',
    example: 'useQueryClient() → useXxx().fetch/modify 함수 사용',
  }),
  errorRule({
    selector: "Identifier[name='queryClient']",
    policy: AGENTS_REF.queryOnlyInComposable,
    violation: 'page/component에서 queryClient 직접 사용',
    remediation: 'composable 내부 캐시 관리로 이동',
    example: 'queryClient.invalidateQueries(...) → useXxx().refresh...()',
  }),
];

const pageComponentBoundaryErrorRules = [
  ...pageComponentOnlyBoundaryErrorRules,
  ...realtimeSubscriptionErrorRules,
  ...queryKeyErrorRules,
  ...shoelaceFormVModelErrorRules,
  ...shoelaceValueParsingErrorRules,
];

const composableErrorRules = [
  ...pbCollectionLiteralErrorRules,
  errorRule({
    selector: 'VariableDeclarator[id.name=/^on[A-Z].+/]',
    policy: AGENTS_REF.composableNaming,
    violation: 'composable 변수명이 onXxx로 시작',
    remediation: '도메인 액션 동사(fetch/create/update/delete/subscribe/unsubscribe) 사용',
    example: 'const onLoad = () => {} → const fetchWorkList = () => {}',
  }),
  errorRule({
    selector: 'FunctionDeclaration[id.name=/^on[A-Z].+/]',
    policy: AGENTS_REF.composableNaming,
    violation: 'composable 함수명이 onXxx로 시작',
    remediation: '도메인 액션 동사 사용',
    example: 'function onClick() {} → function fetchWorkDetail() {}',
  }),
  ...composableMutationErrorRules,
  ...queryKeyErrorRules,
];

const commonErrorRules = [...pbCollectionLiteralErrorRules, ...queryKeyErrorRules, ...shoelaceFormVModelErrorRules];
/* ===== 최종 적용 블록 ===== */
const eslintCustomRuleConfig = [
  // pages 적용 규칙
  restrictedSyntaxErrorBlock([FILE_GLOB.pages], pageComponentBoundaryErrorRules),
  // components 적용 규칙
  restrictedSyntaxErrorBlock([FILE_GLOB.components], pageComponentBoundaryErrorRules),
  // composables 적용 규칙
  restrictedSyntaxErrorBlock([FILE_GLOB.composables], composableErrorRules),
  // PB_HOOKS 전용 규칙
  restrictedSyntaxErrorBlock([FILE_GLOB.pbHooksTs], pbHooksErrorRules),
  // 기타 src/packages 적용 규칙
  restrictedSyntaxErrorBlock([FILE_GLOB.appSrc, FILE_GLOB.packageSrc], commonErrorRules, [
    FILE_GLOB.pages,
    FILE_GLOB.components,
    FILE_GLOB.composables,
  ]),
  // Shoelace form 컴포넌트의 v-model 금지 규칙 (template AST 전용)
  restrictedSyntaxErrorBlock(
    [FILE_GLOB.appVue, FILE_GLOB.packageVue],
    [...shoelaceFormVModelErrorRules, ...nativeFormTagRestrictionErrorRules],
    [],
    'vue/no-restricted-syntax',
  ),
  // useQuery queryKey 2nd segment / readShoelace 헬퍼 권장 규칙 (warning)
  restrictedSyntaxWarnBlock(
    [FILE_GLOB.appSrc, FILE_GLOB.packageSrc],
    [
      ...queryKeyWarnRules,
      ...invalidationWarnRules,
      ...shoelaceHelperWarnRules,
      ...shoelaceChangeHandlerNamingWarnRules,
    ],
  ),
  // PB_HOOKS 전용 권장 규칙 (warning)
  restrictedSyntaxWarnBlock([FILE_GLOB.pbHooksTs], pbHooksWarnRules),
];
/* ===== 최종 적용 블록 ===== */

export default eslintCustomRuleConfig;
