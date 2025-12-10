#!/usr/bin/env node
import "source-map-support/register";
import "dotenv/config";
import { App } from "aws-cdk-lib";
import { WebAclStack } from "../lib/web-acl-stack";
import { FrontendStack } from "../lib/frontend-stack";
import { frontendConfig } from "../lib/config";

const app = new App();
const namePrefix = `${frontendConfig.systemName}-${frontendConfig.stage}`;
const webAclParameterName = `${namePrefix}-WebAclArnParameter`;

const waf = new WebAclStack(app, `${namePrefix}-FrontendWebAclStack`, {
  env: {
    region: frontendConfig.frontendWafRegion,
  },
  namePrefix,
  parameterName: webAclParameterName,
  allowedIpRanges: frontendConfig.allowedIpRanges,
  allowedIpRangesV6: frontendConfig.allowedIpRangesV6,
});

new FrontendStack(app, `${namePrefix}-FrontendStack`, {
  env: {
    region: frontendConfig.frontendRegion,
  },
  namePrefix,
  webAclParameterName,
  webAclRegion: frontendConfig.frontendWafRegion,
}).addDependency(waf);
