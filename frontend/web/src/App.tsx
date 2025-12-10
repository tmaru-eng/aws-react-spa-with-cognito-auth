import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";
import { Authenticator, Heading, Text } from "@aws-amplify/ui-react";
import { translations } from "@aws-amplify/ui";
import "@aws-amplify/ui-react/styles.css";
import { getTime } from "./api";
import { apiEndpoint, cognitoConfig } from "./config";

// Amplify UI の文言を日本語に寄せる
I18n.putVocabularies(translations);
I18n.putVocabularies({
  ja: {
    "Account recovery": "メールアドレスの確認",
    "Account recovery required": "メールアドレスの確認が必要です",
    "Account recovery requires verified contact information":
      "メールアドレスの確認が必要です",
    "Confirm your account": "メールアドレスを確認してください",
    "Confirm Sign In": "サインイン確認",
    "Enter the verification code": "確認コードを入力してください",
    "Resend Code": "確認コードを再送",
    "Back to Sign In": "サインインに戻る",
  },
});
I18n.setLanguage("ja");

// Amplify/Auth の設定値を反映
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolWebClientId,
    },
  },
});

type SignedInViewProps = {
  username?: string;
  signOut?: VoidFunction;
};

// サインイン済みの利用者向け UI とデータ取得処理
const SignedInView: React.FC<SignedInViewProps> = ({ username, signOut }) => {
  const [time, setTime] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await getTime();
        setTime(res.cur_date);
      } catch (error) {
        console.error("時刻取得に失敗しました", error);
        setErrorMessage(
          "サーバー時刻の取得に失敗しました。サインイン情報や API の設定を確認してください。"
        );
      }
    };

    fetchTime();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Heading level={2} className="App-title">
          サーバー時刻ビューア
        </Heading>
        <Text className="App-description">
          Cognito で認証したユーザーだけが API Gateway 経由で Lambda のレスポンスに
          アクセスできます。
        </Text>

        <div className="App-card">
          <Text className="App-label">サインインユーザー</Text>
          <Text className="App-value">{username ?? "不明なユーザー"}</Text>
        </div>

        <div className="App-card">
          <Text className="App-label">最新のサーバー時刻</Text>
          <Text className="App-value">
            {time ?? "取得中..."}
          </Text>
        </div>

        {errorMessage ? <Text className="App-error">{errorMessage}</Text> : null}

        <button className="App-button" onClick={signOut}>
          サインアウト
        </button>
      </header>
    </div>
  );
};

const App: React.FC = () => (
  <Authenticator>
    {({ signOut, user }) => (
      <SignedInView username={user?.username} signOut={signOut} />
    )}
  </Authenticator>
);

export default App;
