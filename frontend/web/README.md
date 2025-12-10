# React アプリ開発メモ

このプロジェクトは [Create React App](https://github.com/facebook/create-react-app) をベースに、Amplify UI で認証付きの SPA を構築しています。

## よく使うスクリプト

- `npm start`  
  開発サーバーを起動します。http://localhost:3000 で確認できます。
- `npm test`  
  テストをウォッチモードで実行します。
- `npm run build`  
  本番向けにビルドし、`build` ディレクトリへ出力します。
- `npm run eject`  
  ビルド設定をすべてプロジェクトに展開します（元に戻せないので通常は不要）。

## 設定方法 (.env)

- `cp .env.template .env.local` を実行し、Cognito と API エンドポイントの値を `.env.local` に記入してください。
- 末尾に `/api` は付けず、ベース URL を設定します。

## 参考ドキュメント

- [Create React App docs](https://facebook.github.io/create-react-app/docs/getting-started)
- [React docs](https://react.dev/)
- [AWS Amplify UI docs](https://ui.docs.amplify.aws/)
