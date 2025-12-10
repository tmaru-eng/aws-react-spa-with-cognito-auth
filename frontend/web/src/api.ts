import { fetchAuthSession } from "aws-amplify/auth";
import { apiEndpoint } from "./config";

// Cognito のセッションから API 用の JWT を取得
export const getToken = async () => {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) {
    throw new Error("IDトークンが取得できませんでした。");
  }
  return `Bearer ${idToken}`;
};

export interface TimeResponse {
  cur_date: string;
}

// API Gateway 経由で Lambda の現在時刻を取得
export const getTime = async (): Promise<TimeResponse> => {
  const token = await getToken();
  if (!apiEndpoint) {
    throw new Error("API エンドポイントが設定されていません。");
  }

  const baseUrl = apiEndpoint.replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/time`, {
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error(
      `API から時刻を取得できませんでした (status: ${res.status}).`
    );
  }

  return (await res.json()) as TimeResponse;
};
