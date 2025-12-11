import React from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
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
  defaultTheme,
  Menu,
  UserMenu,
  Layout,
  AppBar,
  TranslationMessages,
} from "react-admin";
import polyglotI18nProvider from "ra-i18n-polyglot";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Card, CardContent, Typography, MenuItem } from "@mui/material";
import { adminDataProvider } from "./adminDataProvider";
import { cognitoConfig, enableSelfSignUp } from "./config";
import AuthHeader from "./authHeader";
import "./index.css";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolWebClientId,
    },
  },
});

const theme = createTheme({
  ...defaultTheme,
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    background: { default: "#f7f8fb" },
  },
});

const japaneseMessages: TranslationMessages = {
  ra: {
    action: {
      add_filter: "フィルターを追加",
      add: "追加",
      back: "戻る",
      bulk_actions: "1件選択 |||| %{smart_count}件選択",
      cancel: "キャンセル",
      clear_array_input: "クリア",
      clear_input_value: "クリア",
      clone: "複製",
      confirm: "確認",
      create: "作成",
      create_item: "%{item} を作成",
      delete: "削除",
      edit_item: "%{item} を編集",
      edit: "編集",
      export: "エクスポート",
      list: "一覧",
      refresh: "リフレッシュ",
      remove_filter: "フィルターを削除",
      remove: "削除",
      save: "保存",
      search: "検索",
      show: "表示",
      sort: "並べ替え",
      undo: "取り消す",
      unselect: "選択解除",
      expand: "展開",
      close: "閉じる",
      open_menu: "メニューを開く",
      close_menu: "メニューを閉じる",
      clear_selection: "選択をクリア",
      expand_all: "すべて展開",
      close_all: "すべて閉じる",
      select_all: "すべて選択",
      select_row: "行を選択",
      remove_all_filters: "フィルターを全て削除",
      update_application: "アプリケーションを更新",
      update: "更新",
      move_up: "上へ",
      move_down: "下へ",
      move_left: "左へ",
      move_right: "右へ",
      open: "開く",
      toggle_theme: "テーマ切替",
      select_columns: "列を選択",
    },
    boolean: {
      true: "はい",
      false: "いいえ",
      null: "未設定",
    },
    page: {
      create: "%{name} を作成",
      dashboard: "ダッシュボード",
      edit: "%{name} #%{id}",
      error: "何か問題が発生しました",
      list: "%{name} 一覧",
      loading: "読み込み中",
      not_found: "見つかりません",
      show: "%{name} #%{id}",
      empty: "データがありません",
      invite: "新規作成しますか？",
    },
    input: {
      file: {
        upload_several: "ドラッグ＆ドロップでアップロード、またはクリックして選択",
        upload_single: "ドラッグ＆ドロップでアップロード、またはクリックして選択",
      },
      image: {
        upload_several: "ドラッグ＆ドロップでアップロード、またはクリックして選択",
        upload_single: "ドラッグ＆ドロップでアップロード、またはクリックして選択",
      },
      references: {
        all_missing: "関連データが見つかりません",
        many_missing: "関連データの一部が見つかりません",
        single_missing: "関連データが見つかりません",
      },
      password: {
        toggle_visible: "パスワードを表示",
        toggle_hidden: "パスワードを非表示",
      },
    },
    message: {
      about: "この画面について",
      are_you_sure: "よろしいですか？",
      auth_error: "認証エラー。再ログインしてください。",
      bulk_delete_content:
        "選択した %{name} を本当に削除しますか？ |||| 選択した %{smart_count} 件の %{name} を本当に削除しますか？",
      bulk_delete_title: "削除 %{name} |||| %{smart_count}件の %{name} を削除",
      bulk_update_content:
        "選択した %{name} を本当に更新しますか？ |||| 選択した %{smart_count} 件の %{name} を本当に更新しますか？",
      bulk_update_title: "更新 %{name} |||| %{smart_count}件の %{name} を更新",
      delete_content: "本当に削除しますか？",
      delete_title: "削除 %{name} #%{id}",
      details: "詳細",
      error: "クライアントのエラーが発生しました。",
      invalid_form: "入力に誤りがあります。確認してください。",
      loading: "読み込み中",
      no: "いいえ",
      yes: "はい",
      not_found: "URLが間違っているか、リンクが古い可能性があります。",
      unsaved_changes: "保存されていない変更があります。本当に離脱しますか？",
      clear_array_input: "選択をクリア",
    },
    navigation: {
      no_results: "該当なし",
      no_more_results: "ページ %{page} は存在しません",
      page_out_of_boundaries: "%{page} は範囲外です",
      page_out_from_end: "最終ページを超えました",
      page_out_from_begin: "1ページ目より前です",
      page_range_info: "%{offsetBegin}-%{offsetEnd} / %{total}",
      page_rows_per_page: "行/ページ:",
      next: "次へ",
      prev: "前へ",
      partial_page_range_info: "%{offsetBegin}-%{offsetEnd} / %{offsetEnd}+",
      current_page: "ページ %{page}",
      page: "ページ",
      first: "最初",
      last: "最後",
      skip_nav: "コンテンツへスキップ",
      next_page: "次のページ",
      prev_page: "前のページ",
      previous: "前へ",
    },
    saved_queries: {
      label: "保存済みクエリ",
      query_name: "クエリ名",
      new_label: "クエリを保存...",
      new_dialog_title: "クエリを保存",
      remove_label: "保存済みクエリを削除",
      remove_label_with_name: '"%{name}" を削除',
      remove_dialog_title: "保存済みクエリを削除しますか？",
      remove_message:
        "このクエリをツールバーから削除します。あとで再作成する必要があります。",
      help: "フィルターを設定して保存すると、いつでも再利用できます",
    },
    sort: {
      sort_by: "%{field} を %{order} で並べ替え",
      ASC: "昇順",
      DESC: "降順",
    },
    auth: {
      auth_check_error: "認証エラー。再ログインしてください。",
      user_menu: "プロフィール",
      username: "ユーザー名",
      password: "パスワード",
      sign_in: "ログイン",
      sign_in_error: "ログインに失敗しました",
      logout: "ログアウト",
    },
    notification: {
      updated: "更新しました |||| %{smart_count} 件更新しました",
      created: "作成しました",
      deleted: "削除しました |||| %{smart_count} 件削除しました",
      bad_item: "データが不正です",
      item_doesnt_exist: "データが見つかりません",
      http_error: "通信エラーが発生しました",
      data_provider_error: "データプロバイダーエラー。詳細はコンソールを確認してください。",
      canceled: "キャンセルしました",
      logged_out: "セッションが無効です。再ログインしてください。",
      i18n_error: "翻訳を読み込めませんでした",
      not_authorized: "権限がありません",
      application_update_available: "新しいバージョンが利用可能です。更新してください。",
    },
    validation: {
      required: "必須項目です",
      minLength: "最低 %{min} 文字以上",
      maxLength: "最大 %{max} 文字まで",
      minValue: "%{min} 以上",
      maxValue: "%{max} 以下",
      number: "数値で入力してください",
      email: "有効なメールアドレスを入力してください",
      oneOf: "有効な値を選択してください",
      regex: "入力が形式に合致しません (正規表現: %{pattern})",
    },
  },
};

const i18nProvider = polyglotI18nProvider(() => japaneseMessages, "ja");

const PostList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="title" label="タイトル" />
      <TextField source="published_at" label="公開日" />
    </Datagrid>
  </List>
);

const PostForm = () => (
  <SimpleForm>
    <TextInput source="title" label="タイトル" required fullWidth />
    <TextInput
      source="body"
      label="本文"
      multiline
      minRows={4}
      fullWidth
    />
    <TextInput
      source="published_at"
      label="公開日 (未入力なら自動で今日)"
      fullWidth
      placeholder="例: 2025-01-01"
    />
  </SimpleForm>
);

const PostCreate = () => (
  <Create redirect="list">
    <PostForm />
  </Create>
);

const PostEdit = () => (
  <Edit redirect="list">
    <PostForm />
  </Edit>
);

const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" label="名前" />
      <TextField source="email" label="メール" />
    </Datagrid>
  </List>
);

const UserEdit = () => (
  <Edit redirect="list">
    <SimpleForm>
      <TextInput source="name" label="名前" required fullWidth />
      <TextInput source="email" label="メール" fullWidth />
    </SimpleForm>
  </Edit>
);

const UserCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <TextInput source="name" label="名前" required fullWidth />
      <TextInput source="email" label="メール" fullWidth />
    </SimpleForm>
  </Create>
);

const CommentList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="post_id" label="投稿ID" />
      <TextField source="author" label="作者" />
      <TextField source="body" label="本文" />
    </Datagrid>
  </List>
);

const CommentEdit = () => (
  <Edit redirect="list">
    <SimpleForm>
      <TextInput
        source="post_id"
        label="投稿ID"
        required
        fullWidth
        helperText="紐づける投稿のIDを指定してください"
      />
      <TextInput source="author" label="作者" fullWidth />
      <TextInput
        source="body"
        label="本文"
        multiline
        minRows={3}
        fullWidth
      />
    </SimpleForm>
  </Edit>
);

const CommentCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <TextInput
        source="post_id"
        label="投稿ID"
        required
        fullWidth
        helperText="紐づける投稿のIDを指定してください"
      />
      <TextInput source="author" label="作者" fullWidth />
      <TextInput source="body" label="本文" multiline minRows={3} fullWidth />
    </SimpleForm>
  </Create>
);

const Dashboard: React.FC = () => (
  <Card sx={{ margin: 2 }}>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        React Admin デモ
      </Typography>
      <Typography variant="body1">
        Cognito 認証後、/items API を CRUD できます。
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        API エンドポイント: {process.env.REACT_APP_API_ENDPOINT || "(未設定)"}
      </Typography>
    </CardContent>
  </Card>
);

const LogoutMenu: React.FC<{ onSignOut?: VoidFunction }> = ({ onSignOut }) => (
  <UserMenu>
    <MenuItem onClick={onSignOut}>サインアウト</MenuItem>
  </UserMenu>
);

const AdminMenu: React.FC = (props) => <Menu {...props} />;

const CustomLayout: React.FC<any> = (props) => {
  const { onSignOut, ...rest } = props;
  return (
    <Layout
      {...rest}
      appBar={(appBarProps) => (
        <AppBar
          {...appBarProps}
          userMenu={<LogoutMenu onSignOut={onSignOut} />}
        />
      )}
    />
  );
};

const App: React.FC = () => (
  <Authenticator
    hideSignUp={!enableSelfSignUp}
    components={{ Header: AuthHeader as unknown as () => React.ReactElement }}
  >
    {({ signOut }) => (
      <ThemeProvider theme={theme}>
        <Admin
          basename="/"
          dataProvider={adminDataProvider}
          disableTelemetry
          i18nProvider={i18nProvider}
      theme={theme}
      dashboard={Dashboard}
      menu={AdminMenu}
      layout={(props) => <CustomLayout {...props} onSignOut={signOut} />}
    >
      <Resource
        name="posts"
        list={PostList}
        edit={PostEdit}
        create={PostCreate}
        recordRepresentation="title"
      />
          <Resource
            name="users"
            list={UserList}
            edit={UserEdit}
            create={UserCreate}
            recordRepresentation="name"
          />
          <Resource
            name="comments"
            list={CommentList}
            edit={CommentEdit}
            create={CommentCreate}
            recordRepresentation="body"
          />
        </Admin>
      </ThemeProvider>
    )}
  </Authenticator>
);

export default App;
