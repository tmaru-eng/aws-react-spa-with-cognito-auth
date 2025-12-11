import { fetchAuthSession } from "aws-amplify/auth";
import { DataProvider } from "react-admin";
import { apiEndpoint } from "./config";

const getAuthHeader = async () => {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) throw new Error("IDトークンが取得できませんでした。");
  return { Authorization: `Bearer ${idToken}` };
};

const baseUrl = apiEndpoint;

const handleResponse = async (res: Response) => {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any)?.message || `API error: ${res.status}`;
    throw new Error(message);
  }
  return json;
};

export const adminDataProvider: DataProvider = {
  getList: async (resource) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/${resource}`, { headers });
    const json = await handleResponse(res);
    const items = (json as any).data ?? [];
    return { data: items, total: (json as any).total ?? items.length };
  },
  getOne: async (resource, params) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/${resource}/${params.id}`, { headers });
    const json = await handleResponse(res);
    return { data: (json as any).data };
  },
  create: async (resource, params) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/${resource}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(params.data),
    });
    const json = await handleResponse(res);
    return { data: (json as any).data };
  },
  update: async (resource, params) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/${resource}/${params.id}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(params.data),
    });
    const json = await handleResponse(res);
    return { data: (json as any).data };
  },
  delete: async (resource, params) => {
    if (!baseUrl) throw new Error("API エンドポイントが未設定です。");
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/${resource}/${params.id}`, {
      method: "DELETE",
      headers,
    });
    const json = await handleResponse(res);
    return { data: (json as any).data };
  },
  getMany: async (resource, params) => {
    const list = await adminDataProvider.getList(resource, {} as any);
    const filtered = list.data.filter((item: any) => params.ids.includes(item.id));
    return { data: filtered };
  },
  getManyReference: async () => ({ data: [], total: 0 }),
  deleteMany: async (resource, params) => {
    const results = await Promise.all(
      params.ids.map((id) => adminDataProvider.delete(resource, { id }))
    );
    return { data: results.map((r) => (r as any).data.id) };
  },
  updateMany: async (resource, params) => {
    const results = await Promise.all(
      params.ids.map((id) =>
        adminDataProvider.update(resource, {
          id,
          data: params.data,
          previousData: params.data,
        })
      )
    );
    return { data: results.map((r) => (r as any).data.id) };
  },
};
