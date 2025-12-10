# React SPA + Serverless Backend + Cognito 認証デモ

## 概要

AWS CDK v2 でバックエンドを、React + AWS Amplify でフロントエンドを構築するサンプルです。Cognito の認証情報を用いて API Gateway/Lambda にアクセスし、WAF を API と CloudFront の両方にアタッチする流れを確認できます。

![screen-cognito](imgs/screen-cognito.png)
![screen-home](imgs/screen-home.png)

## アーキテクチャ

それぞれの CDK スタックで役割を分けています。

- AuthStack  
  - Amazon Cognito
- APIStack  
  - Amazon API Gateway, AWS WAF, AWS Lambda
- FrontendStack  
  - Amazon CloudFront, AWS WAF, Amazon S3

![Architecture](imgs/architecture.png)

## ディレクトリ構成

```sh
.
├── backend          # バックエンド (API/Cognito) の CDK スクリプト
└── frontend
    ├── provisioning # フロントエンド (CloudFront/S3) の CDK スクリプト
    └── web          # React + Amplify アプリ
```

## 主なライブラリ

- aws-cdk-lib / constructs
- aws-amplify / @aws-amplify/ui-react
- react / react-scripts
- typescript
- jest / ts-jest

## 前提

- npm / Node.js（CDK v2 と React 18 が動作するバージョンを推奨）
- AWS CLI の設定（`aws configure` 済みであること）
- CDK CLI v2 (`npm i -g aws-cdk`) が利用可能であること

## セットアップ手順

### 1. リポジトリ取得

```bash
git clone <this-repo>
```

### 2. バックエンドをデプロイ

1. `backend` ディレクトリで依存関係をインストール  
   `npm install`
2. CDK でスタックをデプロイ  
   `cdk deploy --all`
3. デプロイ完了後に出力される以下をメモ  
   - `CognitoUserPoolId`
   - `CognitoUserPoolWebClientId`
   - API エンドポイント

### 3. フロントエンドをビルド & デプロイ

#### 3.1 React アプリのビルド

1. `frontend/web` で依存関係をインストール  
   `npm install`
2. 環境変数を設定  
   - `cp .env.template .env.local`  
   - `.env.local` の `REACT_APP_COGNITO_USER_POOL_ID` / `REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID` / `REACT_APP_API_ENDPOINT` を手順 2 で得た値に置き換え（API は `apiEndpoint` 出力をそのまま利用可。末尾スラッシュはビルド時に自動除去）
3. ビルド  
   `npm run build`

#### 3.2 CloudFront/S3 へデプロイ

1. `frontend/provisioning` で依存関係をインストール  
   `npm install`
2. CDK デプロイ  
   `cdk deploy --all`
3. `FrontendStack.endpoint` に表示された CloudFront の URL でアプリにアクセス

### 4. Cognito ユーザーの作成

サインインには事前にユーザーを作成しておく必要があります。AWS マネジメントコンソールまたは AWS CLI からユーザーを登録してください。

## 自動デプロイ・削除スクリプト

ルート直下の `scripts/deploy.sh` / `scripts/destroy.sh` で一連の作業を自動化できます（`--profile` / `--region` は省略可）。

```sh
# デプロイ: backend → 出力で .env.local を自動生成 → frontend build → frontend/provisioning デプロイ
./scripts/deploy.sh --profile admin --region ap-northeast-1

# 削除
./scripts/destroy.sh --profile admin --region ap-northeast-1
```

※ AWS CLI / jq が必要です。CloudFront の作成/削除に時間がかかることがあります。タイムアウトにかかる場合は `AWS_CLI_READ_TIMEOUT` などを必要に応じて環境変数で調整してください。

## セキュリティ

セキュリティに関する連絡先などは [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) を参照してください。

## ライセンス

MIT-0 License。詳細は LICENSE を参照してください。
