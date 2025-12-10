# CDK (Frontend) プロジェクト

CloudFront / S3 / WAF を構築する CDK v2 + TypeScript のプロジェクトです。React アプリのビルド成果物を S3 に配置し、CloudFront 経由で配信します。

`cdk.json` は CDK CLI がアプリを実行する方法を示します。

## よく使うコマンド

- `npm run build` … TypeScript をコンパイル
- `npm run watch` … 変更を監視してビルド
- `npm run test` … Jest によるユニットテスト
- `cdk synth` … CloudFormation テンプレートを生成
- `cdk diff` … デプロイ済みスタックとの差分を表示
- `cdk deploy` … スタックをデプロイ
