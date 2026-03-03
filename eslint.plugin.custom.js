const noPocketbaseCollectionLiteralRule = {
  create(context) {
    return {
      "CallExpression[callee.object.name='pb'][callee.property.name='collection'][arguments.0.type='Literal']"(node) {
        context.report({
          message:
            '[금지] AGENTS.md > PocketBase 가이드 > 문자열 리터럴로 컬렉션 명을 지정하는 것을 금지한다. pb.collection("...") 대신 Collections Enum을 사용하세요.',
          node,
        });
      },
    };
  },
};

const noQueryKeyCollectionsEnumRule = {
  create(context) {
    return {
      "Property[key.name='queryKey'] MemberExpression[object.name='Collections']"(node) {
        context.report({
          message:
            "[금지] AGENTS.md > TanStack Query 가이드 > Query Key는 일관된 규칙을 따른다. queryKey에는 Collections Enum 대신 도메인 문자열(예: 'works')을 사용하세요.",
          node,
        });
      },
    };
  },
};

const pluginName = 'my-custom-rules';

const plugin = {
  meta: {
    name: pluginName,
  },
  rules: {
    'no-pocketbase-collection-literal': noPocketbaseCollectionLiteralRule,
    'no-query-key-collections-enum': noQueryKeyCollectionsEnumRule,
  },
  configs: {
    recommended: {
      rules: {
        [`${pluginName}/no-pocketbase-collection-literal`]: 'error',
        [`${pluginName}/no-query-key-collections-enum`]: 'error',
      },
    },
  },
};

export default plugin;
