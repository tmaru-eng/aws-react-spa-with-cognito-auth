import { fetchAuthSession } from "aws-amplify/auth";
import { DataProvider } from "react-admin";
import { apiEndpoint } from "./config";

const getAuthHeader = async () => {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) {
    throw new Error("IDトークンが取得できませんでした。");
  }
  return { Authorization: `Bearer ${idToken}` };
};

const baseUrl = apiEndpoint?.replace(/\/$/, "");
if (!baseUrl) {
  console.warn("API エンドポイントが設定されていません。");
}

const handleResponse = async (res: Response) => {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      json?.message || `API エラー (status: ${res.status}, ${res.statusText})`;
    throw new Error(message);
  }
  return json;
};

export const adminDataProvider: DataProvider = {
  getList: async () => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/items`, { headers });
    const json = await handleResponse(res);
    const items = json.data ?? [];
    return { data: items, total: json.total ?? items.length };
  },
  getOne: async (_resource, params) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/items/${params.id}`, { headers });
    const json = await handleResponse(res);
    return { data: json.data };
  },
  create: async (_resource, params) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/items`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(params.data),
    });
    const json = await handleResponse(res);
    return { data: json.data };
  },
  update: async (_resource, params) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/items/${params.id}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(params.data),
    });
    const json = await handleResponse(res);
    return { data: json.data };
  },
  delete: async (_resource, params) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/items/${params.id}`, {
      method: "DELETE",
      headers,
    });
    const json = await handleResponse(res);
    return { data: json.data };
  },
  // 未使用のメソッドは簡易実装
  getMany: async (_resource, params) => {
    const list = await (await adminDataProvider.getList("", {} as any)).data;
    const filtered = list.filter((item: any) => params.ids.includes(item.id));
    return { data: filtered };
  },
  getManyReference: async () => ({ data: [], total: 0 }),
  deleteMany: async (_resource, params) => {
    const results = await Promise.all(
      params.ids.map((id) => adminDataProvider.delete("", { id }))
    );
    return { data: results.map((r) => (r as any).data.id) };
  },
  updateMany: async (_resource, params) => {
    const results = await Promise.all(
      params.ids.map((id) => adminDataProvider.update("", { id, data: params.data }))
    );
    return { data: results.map((r) => (r as any).data.id) };
  },
};
