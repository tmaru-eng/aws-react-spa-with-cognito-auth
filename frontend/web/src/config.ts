// 環境変数をまとめて読み込むヘルパー
export const cognitoConfig = {
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || "",
  userPoolWebClientId:
    process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID || "",
};

// API Gateway のベース URL（末尾に /api は付けずにセットする想定）
export const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "";

// サインアップを UI で有効にするか
export const enableSelfSignUp =
  (process.env.REACT_APP_ENABLE_SELF_SIGNUP || "").toLowerCase() === "true";

// ステージ・システム名（必要なら UI に表示・メタ情報に利用）
export const stage = process.env.REACT_APP_STAGE || "";
export const systemName = process.env.REACT_APP_SYSTEM_NAME || "";
