import React from "react";
import {
  Admin,
  Resource,
  List,
  Datagrid,
  TextField,
  NumberField,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  Create,
  Layout,
  AppBar,
  TitlePortal,
} from "react-admin";
import { Box, Button, CssBaseline } from "@mui/material";
import { adminDataProvider } from "./adminDataProvider";

type AdminDemoProps = {
  onExit: () => void;
  onSignOut?: () => void;
};

const CustomAppBar: React.FC<{
  onExit: () => void;
  onSignOut?: () => void;
}> = ({ onExit, onSignOut, ...props }) => (
  <AppBar
    {...props}
    color="primary"
    elevation={1}
    sx={{ backgroundColor: "#1b1d2a" }}
  >
    <TitlePortal />
    <Box flex={1} />
    <Button color="inherit" onClick={onExit} sx={{ mr: 1 }}>
      時刻ビューへ戻る
    </Button>
    {onSignOut ? (
      <Button color="inherit" onClick={onSignOut}>
        サインアウト
      </Button>
    ) : null}
  </AppBar>
);

const CustomLayout: React.FC<any> = (props) => {
  const { onExit, onSignOut, ...rest } = props;
  return (
    <Layout
      {...rest}
      appBar={(appBarProps) => (
        <CustomAppBar
          {...appBarProps}
          onExit={onExit}
          onSignOut={onSignOut}
        />
      )}
    />
  );
};

const ItemList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="title" label="タイトル" />
      <NumberField source="views" label="閲覧数" />
      <TextField source="published_at" label="公開日" />
    </Datagrid>
  </List>
);

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

const AdminDemo: React.FC<AdminDemoProps> = ({ onExit, onSignOut }) => (
  <>
    <CssBaseline />
    <Admin
      dataProvider={adminDataProvider}
      basename="/admin-demo"
      disableTelemetry
      layout={(props) => (
        <CustomLayout {...props} onExit={onExit} onSignOut={onSignOut} />
      )}
      title="React Admin デモ"
    >
      <Resource
        name="items"
        list={ItemList}
        edit={ItemEdit}
        create={ItemCreate}
        recordRepresentation="title"
      />
    </Admin>
  </>
);

export default AdminDemo;
