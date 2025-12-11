import React from "react";
import {
  Admin,
  Resource,
  ListGuesser,
  ShowGuesser,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  Create,
} from "react-admin";
import { CssBaseline } from "@mui/material";
import { adminDataProvider } from "./adminDataProvider";

const ItemCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" label="タイトル" required />
      <NumberInput source="views" label="閲覧数" />
      <TextInput source="published_at" label="公開日 (YYYY-MM-DD)" />
    </SimpleForm>
  </Create>
);

const ItemEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" label="タイトル" required />
      <NumberInput source="views" label="閲覧数" />
      <TextInput source="published_at" label="公開日 (YYYY-MM-DD)" />
    </SimpleForm>
  </Edit>
);

const AdminDemo: React.FC = () => (
  <>
    <CssBaseline />
    <Admin
      dataProvider={adminDataProvider}
      basename="/admin-demo"
      disableTelemetry
      title="React Admin デモ"
    >
      <Resource
        name="items"
        list={ListGuesser}
        show={ShowGuesser}
        edit={ItemEdit}
        create={ItemCreate}
        recordRepresentation="title"
      />
    </Admin>
  </>
);

export default AdminDemo;
