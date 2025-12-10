// 環境変数をまとめて読み込むヘルパー
export const cognitoConfig = {
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || "",
  userPoolWebClientId:
    process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID || "",
};

// API Gateway のベース URL（末尾に /api は付けずにセットする想定）
export const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "";
