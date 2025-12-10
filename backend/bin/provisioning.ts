#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { APIStack } from "../lib/api";
import { AuthStack } from "../lib/auth";

const app = new App();
const env = {
  region: "ap-northeast-1",
};

// 先に Cognito を用意してから API に連携させる
const auth = new AuthStack(app, "AuthStack", { env });
new APIStack(app, "APIStack", {
  userPool: auth.userPool,
  env,
});
