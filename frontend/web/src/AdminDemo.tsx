import React from "react";
import {
  Admin,
  Resource,
  ListGuesser,
  ShowGuesser,
  EditGuesser,
} from "react-admin";
import fakeRestDataProvider from "ra-data-fakerest";
import { CssBaseline } from "@mui/material";

// 簡易デモ用のインメモリデータ（React Admin のチュートリアルに近い形）
const dataProvider = fakeRestDataProvider({
  posts: [
    { id: 1, title: "React Admin 入門", views: 245, published_at: "2024-12-01" },
    { id: 2, title: "Amplify と Cognito", views: 180, published_at: "2024-11-21" },
  ],
  users: [
    { id: 1, name: "Yamada Taro", email: "taro@example.com" },
    { id: 2, name: "Suzuki Hanako", email: "hanako@example.com" },
  ],
});

const AdminDemo: React.FC = () => (
  <>
    <CssBaseline />
    <Admin
      dataProvider={dataProvider}
      basename="/admin-demo"
      disableTelemetry
      title="React Admin デモ"
    >
      <Resource
        name="posts"
        list={ListGuesser}
        show={ShowGuesser}
        edit={EditGuesser}
        recordRepresentation="title"
      />
      <Resource
        name="users"
        list={ListGuesser}
        edit={EditGuesser}
        show={ShowGuesser}
        recordRepresentation="name"
      />
    </Admin>
  </>
);

export default AdminDemo;
