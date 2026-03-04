const createSelectorRule = (checks) => ({
  create(context) {
    return Object.fromEntries(
      checks.map(({ selector, message }) => [
        selector,
        (node) => {
          context.report({
            message,
            node,
          });
        },
      ]),
    );
  },
});

const createVueTemplateSelectorRule = (checks) => ({
  create(context) {
    const visitor = Object.fromEntries(
      checks.map(({ selector, message }) => [
        selector,
        (node) => {
          context.report({
            message,
            node,
          });
        },
      ]),
    );

    const parserServices = context.sourceCode.parserServices;
    if (parserServices && typeof parserServices.defineTemplateBodyVisitor === 'function') {
      return parserServices.defineTemplateBodyVisitor(visitor);
    }

    return {};
  },
});

const noPocketbaseCollectionLiteralRule = createSelectorRule([
  {
    selector: "CallExpression[callee.object.name='pb'][callee.property.name='collection'][arguments.0.type='Literal']",
    message:
      '[금지] AGENTS.md > PocketBase 가이드 > 문자열 리터럴로 컬렉션 명을 지정하는 것을 금지한다. pb.collection("...") 대신 Collections Enum을 사용하세요.',
  },
]);

const noQueryKeyCollectionsEnumRule = createSelectorRule([
  {
    selector: "Property[key.name='queryKey'] MemberExpression[object.name='Collections']",
    message:
      "[금지] AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다. queryKey에는 Collections Enum 대신 도메인 문자열(예: 'works')을 사용하세요.",
  },
]);

const noQueryKeyFirstSegmentDomainRule = createSelectorRule([
  {
    selector: "Property[key.name='queryKey'] > ArrayExpression > :first-child:not(Literal[value=/^[a-z0-9-]+$/])",
    message:
      "[금지] AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다. queryKey 1st segment는 소문자 도메인 문자열이어야 합니다. 예: ['works', 'list', params]",
  },
]);

const noDirectPocketbaseSdkCallInPageComponentRule = createSelectorRule([
  {
    selector: "CallExpression[callee.object.name='pb'][callee.property.name='collection']",
    message:
      '[금지] AGENTS.md > Agent 금지 사항 > Composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다. 도메인 composable 액션을 사용하세요.',
  },
  {
    selector: "CallExpression[callee.object.name='pb'][callee.property.name='send']",
    message:
      '[금지] AGENTS.md > Agent 금지 사항 > Composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다. 도메인 composable 액션을 사용하세요.',
  },
]);

const noDirectTanstackQueryInPageComponentRule = createSelectorRule([
  {
    selector: "CallExpression[callee.name='useQuery']",
    message:
      '[금지] AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages/components에서는 composable 액션을 호출하세요.',
  },
  {
    selector: "CallExpression[callee.name='useMutation']",
    message:
      '[금지] AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages/components에서는 composable 액션을 호출하세요.',
  },
  {
    selector: "CallExpression[callee.name='useQueryClient']",
    message:
      '[금지] AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages/components에서 useQueryClient()를 직접 사용하지 마세요.',
  },
  {
    selector: "Identifier[name='queryClient']",
    message:
      '[금지] AGENTS.md > Composables 가이드 > TanStack Query는 도메인 Composable 내부에서만 사용한다. pages/components에서 queryClient를 직접 사용하지 마세요.',
  },
]);

const noDirectRealtimeSubscribeInPageComponentRule = createSelectorRule([
  {
    selector: "CallExpression[callee.type='Identifier'][callee.name='subscribe']",
    message:
      '[금지] AGENTS.md > Realtime subscribe 규칙 > Page는 subscribeXxxRealtime(handler?) / unsubscribeXxxRealtime()만 사용한다. subscribe* 직접 호출 대신 subscribeXxxRealtime을 사용하세요.',
  },
  {
    selector: "CallExpression[callee.type='Identifier'][callee.name='unsubscribe']",
    message:
      '[금지] AGENTS.md > Realtime subscribe 규칙 > Page는 subscribeXxxRealtime(handler?) / unsubscribeXxxRealtime()만 사용한다. unsubscribe* 직접 호출 대신 unsubscribeXxxRealtime을 사용하세요.',
  },
  {
    selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='subscribe']",
    message:
      '[금지] AGENTS.md > Realtime subscribe 규칙 > Page는 subscribeXxxRealtime(handler?) / unsubscribeXxxRealtime()만 사용한다. 객체의 subscribe() 직접 호출 대신 composable의 subscribeXxxRealtime을 사용하세요.',
  },
  {
    selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='unsubscribe']",
    message:
      '[금지] AGENTS.md > Realtime subscribe 규칙 > Page는 subscribeXxxRealtime(handler?) / unsubscribeXxxRealtime()만 사용한다. 객체의 unsubscribe() 직접 호출 대신 composable의 unsubscribeXxxRealtime을 사용하세요.',
  },
]);

const noDirectShoelaceEventTargetAccessRule = createSelectorRule([
  {
    selector:
      "FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='value']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace @sl-change 이벤트 값 파싱은 readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked를 기본값으로 사용한다. event.target.value 직접 접근을 피하세요.',
  },
  {
    selector:
      "FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='checked']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace @sl-change 이벤트 값 파싱은 readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked를 기본값으로 사용한다. event.target.checked 직접 접근을 피하세요.',
  },
  {
    selector:
      "VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='value']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace @sl-change 이벤트 값 파싱은 readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked를 기본값으로 사용한다. event.target.value 직접 접근을 피하세요.',
  },
  {
    selector:
      "VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/] MemberExpression[object.type='MemberExpression'][object.object.name='event'][object.property.name='target'][property.name='checked']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace @sl-change 이벤트 값 파싱은 readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked를 기본값으로 사용한다. event.target.checked 직접 접근을 피하세요.',
  },
]);

const noComposableOnPrefixActionNameRule = createSelectorRule([
  {
    selector: 'VariableDeclarator[id.name=/^on[A-Z].+/]',
    message:
      '[금지] AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Composable 메서드 명명 규칙. composable 메서드에서 onXxx 네이밍은 금지됩니다. 도메인 액션(CRUD/구독)은 fetch/create/update/delete/subscribe/unsubscribe 동사를 사용하고, 내부 유틸은 도메인 의미가 드러나면 예외 가능합니다.',
  },
  {
    selector: 'FunctionDeclaration[id.name=/^on[A-Z].+/]',
    message:
      '[금지] AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Composable 메서드 명명 규칙. composable 메서드에서 onXxx 네이밍은 금지됩니다. 도메인 액션(CRUD/구독)은 fetch/create/update/delete/subscribe/unsubscribe 동사를 사용하고, 내부 유틸은 도메인 의미가 드러나면 예외 가능합니다.',
  },
]);

const noComposableMutationExposureRule = createSelectorRule([
  {
    selector: 'ReturnStatement > Identifier[name=/[Mm]utation/]',
    message:
      '[금지] AGENTS.md > Agent 금지 사항 > Composable에서 Mutation 객체(useMutation 결과)를 그대로 반환하지 않는다. mutateAsync 기반 도메인 액션 함수로 감싸서 반환하세요.',
  },
  {
    selector: "ReturnStatement ObjectExpression > Property[value.type='Identifier'][value.name=/[Mm]utation/]",
    message:
      '[금지] AGENTS.md > Agent 금지 사항 > Composable에서 Mutation 객체(useMutation 결과)를 그대로 반환하지 않는다. mutateAsync 기반 도메인 액션 함수로 감싸서 반환하세요.',
  },
]);

const noComposableMutateCallRule = createSelectorRule([
  {
    selector: "CallExpression[callee.object.name=/[Mm]utation/][callee.property.name='mutate']",
    message:
      '[금지] AGENTS.md > Composables 가이드 > Mutation 도메인 액션 함수는 mutateAsync 기반 Promise 반환을 기본으로 한다. mutate() 대신 mutateAsync()를 사용하세요.',
  },
  {
    selector: "CallExpression[callee.type='Identifier'][callee.name='mutate']",
    message:
      '[금지] AGENTS.md > Composables 가이드 > Mutation 도메인 액션 함수는 mutateAsync 기반 Promise 반환을 기본으로 한다. mutate() 대신 mutateAsync()를 사용하세요.',
  },
]);

const noComposableUseMutationDestructureRule = createSelectorRule([
  {
    selector: "VariableDeclarator[id.type='ObjectPattern'][init.type='CallExpression'][init.callee.name='useMutation']",
    message:
      '[금지] AGENTS.md > Agent 금지 사항 > Composable에서 Mutation 객체(useMutation 결과)를 그대로 반환하지 않는다. useMutation 결과 구조분해를 금지합니다. mutation 객체는 내부에서만 사용하고 mutateAsync 기반 도메인 액션으로 노출하세요.',
  },
]);

const noPbHooksEsmModuleRule = createSelectorRule([
  {
    selector: 'ImportDeclaration',
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > 모듈 로딩은 CommonJS(require/module.exports)만 사용한다. ESM import를 사용하지 마세요.',
  },
  {
    selector: 'ExportNamedDeclaration',
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > 모듈 로딩은 CommonJS(require/module.exports)만 사용한다. ESM export를 사용하지 마세요.',
  },
  {
    selector: 'ExportDefaultDeclaration',
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > 모듈 로딩은 CommonJS(require/module.exports)만 사용한다. ESM export default를 사용하지 마세요.',
  },
  {
    selector: 'ExportAllDeclaration',
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > 모듈 로딩은 CommonJS(require/module.exports)만 사용한다. ESM export * 를 사용하지 마세요.',
  },
  {
    selector: 'ImportExpression',
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > 모듈 로딩은 CommonJS(require/module.exports)만 사용한다. dynamic import()를 사용하지 마세요.',
  },
]);

const noPbHooksRequireRelativePathRule = createSelectorRule([
  {
    selector: "CallExpression[callee.name='require'][arguments.0.type='Literal'][arguments.0.value=/^(\\.\\.?\\/)/]",
    message:
      "[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > pb_hooks 내부 파일 로드는 __hooks 절대경로를 기본으로 사용한다. require('__hooks/...') 절대경로를 사용하세요.",
  },
]);

const noPbHooksRuntimeDependencyRule = createSelectorRule([
  {
    selector:
      "CallExpression[callee.name='require'][arguments.0.type='Literal'][arguments.0.value=/^(fs|path|buffer|crypto|child_process|stream|http|https)$/]",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. Node 내장 모듈 require를 사용하지 마세요.',
  },
  {
    selector: "CallExpression[callee.name='fetch']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. fetch를 사용하지 마세요.',
  },
  {
    selector: "CallExpression[callee.name='setTimeout']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. setTimeout 대신 PocketBase hook 흐름으로 제어하세요.',
  },
  {
    selector: "CallExpression[callee.name='setInterval']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. setInterval 대신 cronAdd를 사용하세요.',
  },
  {
    selector: "Identifier[name='window']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. window를 사용하지 마세요.',
  },
  {
    selector: "Identifier[name='document']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. document를 사용하지 마세요.',
  },
  {
    selector: "Identifier[name='navigator']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. navigator를 사용하지 마세요.',
  },
  {
    selector: "Identifier[name='localStorage']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. localStorage를 사용하지 마세요.',
  },
  {
    selector: "Identifier[name='sessionStorage']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. sessionStorage를 사용하지 마세요.',
  },
  {
    selector: "Identifier[name='Buffer']",
    message:
      '[PB_HOOKS 전용][금지] AGENTS.md > PocketBase JS Hook (pb_hooks) 작성 규칙 > Node.js/브라우저 런타임 의존 API(window/fetch/fs/buffer 등) 전제 금지. Buffer를 사용하지 마세요.',
  },
]);

const noPbHooksFilterTemplateLiteralRule = createSelectorRule([
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='newQuery'][arguments.0.type='TemplateLiteral']",
    message:
      '[PB_HOOKS 전용][금지] newQuery SQL 문자열에 템플릿 리터럴 보간을 사용하지 마세요. 바인딩 파라미터를 사용하세요.',
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='findRecordsByFilter'][arguments.1.type='TemplateLiteral']",
    message:
      '[PB_HOOKS 전용][금지] findRecordsByFilter filter 문자열에 템플릿 리터럴 보간을 사용하지 마세요. {:param} + params를 사용하세요.',
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name='findFirstRecordByFilter'][arguments.1.type='TemplateLiteral']",
    message:
      '[PB_HOOKS 전용][금지] findFirstRecordByFilter filter 문자열에 템플릿 리터럴 보간을 사용하지 마세요. {:param} + params를 사용하세요.',
  },
]);

const noPbHooksRouterAuthMiddlewareRule = createSelectorRule([
  {
    selector:
      "CallExpression[callee.name='routerAdd']:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\//]):not(:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\/public\\//])):not(:has(CallExpression[callee.type='MemberExpression'][callee.object.name='$apis'][callee.property.name=/^(requireAuth|requireSuperuserAuth)$/]))",
    message:
      '[PB_HOOKS 전용][금지] 인증/내부 API(/api/*, /api/public/* 제외)는 $apis.requireAuth() 또는 $apis.requireSuperuserAuth()를 사용하세요.',
  },
  {
    selector:
      "CallExpression[callee.name='routerAdd']:has([arguments.1.type='Literal'][arguments.1.value=/^\\/api\\/public\\//]):has(CallExpression[callee.type='MemberExpression'][callee.object.name='$apis'][callee.property.name=/^(requireAuth|requireSuperuserAuth)$/])",
    message:
      '[PB_HOOKS 전용][금지] 공개 API(/api/public/*)에는 $apis.requireAuth()/requireSuperuserAuth()를 사용하지 마세요.',
  },
]);

const preferQueryKeySecondSegmentRule = createSelectorRule([
  {
    selector:
      "CallExpression[callee.name='useQuery'] Property[key.name='queryKey'] > ArrayExpression:not(:has(> :nth-child(2)))",
    message:
      '[권장] AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다. useQuery queryKey는 2nd segment(list/detail 등)를 권장합니다. 단, invalidateQueries/removeQueries의 1세그 도메인 키는 예외로 허용됩니다.',
  },
]);

const preferDetailInvalidationQueryKeyRule = createSelectorRule([
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(invalidateQueries|removeQueries)$/] Property[key.name='queryKey'] > ArrayExpression:has(> :nth-child(2)):has(> :nth-child(2)[type='Identifier']):not(:has(> Literal:nth-child(2)[value='detail']))",
    message:
      "[권장] AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다. 상세 무효화라면 ['domain', 'detail', id] 형태를 권장합니다. 도메인 전체 무효화(['domain'])는 허용됩니다.",
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(invalidateQueries|removeQueries)$/] Property[key.name='queryKey'] > ArrayExpression:has(> :nth-child(2)[type='TemplateLiteral']):not(:has(> Literal:nth-child(2)[value='detail']))",
    message:
      "[권장] AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다. 상세 무효화라면 ['domain', 'detail', id] 형태를 권장합니다. 도메인 전체 무효화(['domain'])는 허용됩니다.",
  },
]);

const preferShoelaceReadHelperRule = createSelectorRule([
  {
    selector:
      'FunctionDeclaration[id.name=/^onChange(?!.*(File|Upload)).+/]:not(:has(Identifier[name=/^readShoelace(SingleValue|MultiValue|Checked)$/]))',
    message:
      '[권장] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace @sl-change 이벤트 값 파싱은 readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked를 기본값으로 사용한다. readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked 사용을 권장합니다.',
  },
  {
    selector:
      'VariableDeclarator[id.name=/^onChange(?!.*(File|Upload)).+/][init.type=/ArrowFunctionExpression|FunctionExpression/]:not(:has(Identifier[name=/^readShoelace(SingleValue|MultiValue|Checked)$/]))',
    message:
      '[권장] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace @sl-change 이벤트 값 파싱은 readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked를 기본값으로 사용한다. readShoelaceSingleValue/readShoelaceMultiValue/readShoelaceChecked 사용을 권장합니다.',
  },
]);

const noShoelaceFormVModelRule = createVueTemplateSelectorRule([
  {
    selector: "VElement[name='sl-select'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙. sl-select에서는 v-model 대신 :value + @sl-change를 사용하세요.',
  },
  {
    selector: "VElement[name='sl-checkbox'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙. sl-checkbox에서는 v-model 대신 :checked + @sl-change를 사용하세요.',
  },
  {
    selector: "VElement[name='sl-switch'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙. sl-switch에서는 v-model 대신 :checked + @sl-change를 사용하세요.',
  },
  {
    selector: "VElement[name='sl-radio-group'] > VStartTag > VAttribute[directive=true][key.name.name='model']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙. sl-radio-group에서는 v-model 대신 :value + @sl-change를 사용하세요.',
  },
]);

const noNativeFormTagExceptAllowedRule = createVueTemplateSelectorRule([
  {
    selector: "VElement[name='button']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙. 네이티브 <button> 대신 <sl-button>을 사용하세요.',
  },
  {
    selector: "VElement[name='select']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙. 네이티브 <select> 대신 <sl-select>를 사용하세요.',
  },
  {
    selector: "VElement[name='textarea']",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙. 네이티브 <textarea> 대신 <sl-textarea>를 사용하세요.',
  },
  {
    selector:
      "VElement[name='input']:not(:has(VAttribute[key.name='type'][value.value='file'])):not(:has(VAttribute[key.name='type'][value.value='text']):has(VAttribute[key.name='hidden']))",
    message:
      '[금지] AGENTS.md > UI(Shoelace) & Tailwind 사용 가이드 > Shoelace 우선 원칙. input은 file/hidden 예외 외에는 Shoelace 컴포넌트를 사용하세요.',
  },
]);

const preferShoelaceSlChangeHandlerNamingRule = createVueTemplateSelectorRule([
  {
    selector:
      "VAttribute[directive=true][key.name.name='on'][key.argument.name='sl-change'][value.type='VExpressionContainer'][value.expression.type='Identifier']:not([value.expression.name=/^onChange[A-Z].+/])",
    message:
      '[권장] AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Vue SFC 메서드 명명 규칙. @sl-change 핸들러 이름은 onChangeXxx 형태를 권장합니다.',
  },
  {
    selector:
      "VAttribute[directive=true][key.name.name='on'][key.argument.name='sl-change'][value.type='VExpressionContainer'][value.expression.type='MemberExpression']:not([value.expression.property.name=/^onChange[A-Z].+/])",
    message:
      '[권장] AGENTS.md > Vue SFC / Composable 구분자 및 명명 가이드 > Vue SFC 메서드 명명 규칙. @sl-change 핸들러 이름은 onChangeXxx 형태를 권장합니다.',
  },
]);

const preferPbHooksRouterMethodUppercaseRule = createSelectorRule([
  {
    selector:
      "CallExpression[callee.name='routerAdd'][arguments.0.type='Literal'][arguments.0.value=/^(get|post|put|patch|delete|options|head)$/]",
    message:
      '[PB_HOOKS 전용][권장] routerAdd HTTP method는 대문자(GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD)를 권장합니다.',
  },
]);

const preferPbHooksRouterApiPrefixRule = createSelectorRule([
  {
    selector:
      "CallExpression[callee.name='routerAdd'][arguments.1.type='Literal']:not([arguments.1.value=/^\\/api\\//])",
    message: '[PB_HOOKS 전용][권장] 커스텀 라우트 path는 /api/... prefix를 권장합니다.',
  },
]);

const preferPbHooksHttpTimeoutRule = createSelectorRule([
  {
    selector:
      "CallExpression[callee.object.name='$http'][callee.property.name='send'][arguments.0.type='ObjectExpression']:not(:has(Property[key.name='timeout']))",
    message: '[PB_HOOKS 전용][권장] $http.send 요청에는 timeout 명시를 권장합니다.',
  },
]);

const pluginName = 'my-custom-rules';

const appCommonRecommendedRules = {
  [`${pluginName}/no-pocketbase-collection-literal`]: 'error',
  [`${pluginName}/no-query-key-collections-enum`]: 'error',
  [`${pluginName}/no-query-key-first-segment-domain`]: 'error',
  [`${pluginName}/prefer-query-key-second-segment`]: 'warn',
  [`${pluginName}/prefer-detail-invalidation-query-key`]: 'warn',
  [`${pluginName}/prefer-shoelace-read-helper`]: 'warn',
};

const pagesComponentsRecommendedRules = {
  [`${pluginName}/no-direct-pocketbase-sdk-call-in-page-component`]: 'error',
  [`${pluginName}/no-direct-tanstack-query-in-page-component`]: 'error',
  [`${pluginName}/no-direct-realtime-subscribe-in-page-component`]: 'error',
  [`${pluginName}/no-direct-shoelace-event-target-access`]: 'error',
};

const composablesRecommendedRules = {
  [`${pluginName}/no-composable-on-prefix-action-name`]: 'error',
  [`${pluginName}/no-composable-mutation-exposure`]: 'error',
  [`${pluginName}/no-composable-mutate-call`]: 'error',
  [`${pluginName}/no-composable-usemutation-destructure`]: 'error',
};

const pbHooksRecommendedRules = {
  [`${pluginName}/no-pb-hooks-esm-module`]: 'error',
  [`${pluginName}/no-pb-hooks-require-relative-path`]: 'error',
  [`${pluginName}/no-pb-hooks-runtime-dependency`]: 'error',
  [`${pluginName}/no-pb-hooks-filter-template-literal`]: 'error',
  [`${pluginName}/no-pb-hooks-router-auth-middleware`]: 'error',
  [`${pluginName}/prefer-pb-hooks-router-method-uppercase`]: 'warn',
  [`${pluginName}/prefer-pb-hooks-router-api-prefix`]: 'warn',
  [`${pluginName}/prefer-pb-hooks-http-timeout`]: 'warn',
};

const vueTemplateRecommendedRules = {
  [`${pluginName}/no-shoelace-form-v-model`]: 'error',
  [`${pluginName}/no-native-form-tag-except-allowed`]: 'error',
  [`${pluginName}/prefer-shoelace-sl-change-handler-naming`]: 'warn',
};

const plugin = {
  meta: {
    name: pluginName,
  },
  rules: {
    'no-pocketbase-collection-literal': noPocketbaseCollectionLiteralRule,
    'no-query-key-collections-enum': noQueryKeyCollectionsEnumRule,
    'no-query-key-first-segment-domain': noQueryKeyFirstSegmentDomainRule,
    'no-direct-pocketbase-sdk-call-in-page-component': noDirectPocketbaseSdkCallInPageComponentRule,
    'no-direct-tanstack-query-in-page-component': noDirectTanstackQueryInPageComponentRule,
    'no-direct-realtime-subscribe-in-page-component': noDirectRealtimeSubscribeInPageComponentRule,
    'no-direct-shoelace-event-target-access': noDirectShoelaceEventTargetAccessRule,
    'no-composable-on-prefix-action-name': noComposableOnPrefixActionNameRule,
    'no-composable-mutation-exposure': noComposableMutationExposureRule,
    'no-composable-mutate-call': noComposableMutateCallRule,
    'no-composable-usemutation-destructure': noComposableUseMutationDestructureRule,
    'no-pb-hooks-esm-module': noPbHooksEsmModuleRule,
    'no-pb-hooks-require-relative-path': noPbHooksRequireRelativePathRule,
    'no-pb-hooks-runtime-dependency': noPbHooksRuntimeDependencyRule,
    'no-pb-hooks-filter-template-literal': noPbHooksFilterTemplateLiteralRule,
    'no-pb-hooks-router-auth-middleware': noPbHooksRouterAuthMiddlewareRule,
    'prefer-query-key-second-segment': preferQueryKeySecondSegmentRule,
    'prefer-detail-invalidation-query-key': preferDetailInvalidationQueryKeyRule,
    'prefer-shoelace-read-helper': preferShoelaceReadHelperRule,
    'no-shoelace-form-v-model': noShoelaceFormVModelRule,
    'no-native-form-tag-except-allowed': noNativeFormTagExceptAllowedRule,
    'prefer-shoelace-sl-change-handler-naming': preferShoelaceSlChangeHandlerNamingRule,
    'prefer-pb-hooks-router-method-uppercase': preferPbHooksRouterMethodUppercaseRule,
    'prefer-pb-hooks-router-api-prefix': preferPbHooksRouterApiPrefixRule,
    'prefer-pb-hooks-http-timeout': preferPbHooksHttpTimeoutRule,
  },
  configs: {
    recommended: {
      rules: {
        ...appCommonRecommendedRules,
        ...pagesComponentsRecommendedRules,
        ...composablesRecommendedRules,
        ...pbHooksRecommendedRules,
        ...vueTemplateRecommendedRules,
      },
    },
    recommendedAppCommon: {
      rules: appCommonRecommendedRules,
    },
    recommendedPagesComponents: {
      rules: pagesComponentsRecommendedRules,
    },
    recommendedComposables: {
      rules: composablesRecommendedRules,
    },
    recommendedPbHooks: {
      rules: pbHooksRecommendedRules,
    },
    recommendedVueTemplate: {
      rules: vueTemplateRecommendedRules,
    },
  },
};

export default plugin;
