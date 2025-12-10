import React from "react";
import { render, screen } from "@testing-library/react";
import { getTime } from "./api";

// Amplify 本体と Authenticator はテスト用に簡易モックを使う
jest.mock("aws-amplify", () => ({
  Amplify: { configure: jest.fn() },
}));

jest.mock("aws-amplify/utils", () => ({
  I18n: { putVocabularies: jest.fn(), setLanguage: jest.fn() },
}));

jest.mock("@aws-amplify/ui", () => ({
  translations: {},
}));

jest.mock("@aws-amplify/ui-react", () => ({
  Authenticator: ({ children }: any) => (
    <div data-testid="authenticator">
      {typeof children === "function"
        ? children({
            signOut: jest.fn(),
            user: { username: "テストユーザー" },
          })
        : children}
    </div>
  ),
  Heading: ({ children, className }: any) => (
    <h2 className={className}>{children}</h2>
  ),
  Text: ({ children, className }: any) => (
    <p className={className}>{children}</p>
  ),
}));

jest.mock("@aws-amplify/ui-react/styles.css", () => ({}), { virtual: true });

jest.mock("./api", () => ({
  getTime: jest.fn(),
}));

import App from "./App";

test("日本語 UI がレンダリングされる", async () => {
  (getTime as jest.Mock).mockResolvedValue({ cur_date: "2024/01/01 12:00" });
  render(<App />);

  expect(screen.getByText("サーバー時刻ビューア")).toBeInTheDocument();
  expect(screen.getByText("テストユーザー")).toBeInTheDocument();
  expect(
    await screen.findByText("2024/01/01 12:00")
  ).toBeInTheDocument();
});
