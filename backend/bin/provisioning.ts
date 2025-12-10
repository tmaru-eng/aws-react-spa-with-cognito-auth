#!/usr/bin/env node
import "source-map-support/register";
import "dotenv/config";
import { App } from "aws-cdk-lib";
import { APIStack } from "../lib/api";
import { AuthStack } from "../lib/auth";
import { backendConfig } from "../lib/config";

const app = new App();
const env = {
  region: backendConfig.backendRegion,
};

const namePrefix = `${backendConfig.systemName}-${backendConfig.stage}`;

// 先に Cognito を用意してから API に連携させる
const auth = new AuthStack(app, `${namePrefix}-AuthStack`, { env });
new APIStack(app, `${namePrefix}-APIStack`, {
  userPool: auth.userPool,
  env,
  namePrefix,
  allowedIpRanges: backendConfig.allowedIpRanges,
});
