export const apiEndpoint = (process.env.REACT_APP_API_ENDPOINT || "").replace(/\/$/, "");
export const cognitoConfig = {
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || "",
  userPoolWebClientId: process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID || "",
};

export const enableSelfSignUp =
  (process.env.REACT_APP_ENABLE_SELF_SIGNUP || "").toLowerCase() === "true";
