// @ts-nocheck
/// <reference path="types.d.ts" />

$app.rootCmd?.addCommand(
  new Command({
    use: 'action',
    run: () => {
      console.log('실행 확인');
    },
  }),
);
