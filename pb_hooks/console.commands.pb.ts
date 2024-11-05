// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="types.d.ts" />

$app.rootCmd?.addCommand(
  new Command({
    use: 'action',
    run: (cmd, args) => {
      console.log('실행 확인');
    },
  }),
);
