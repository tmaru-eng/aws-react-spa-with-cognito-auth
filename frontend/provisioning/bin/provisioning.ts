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

let waf: WebAclStack | undefined;
if (frontendConfig.frontendWafEnabled) {
  waf = new WebAclStack(app, `${namePrefix}-FrontendWebAclStack`, {
    env: {
      region: frontendConfig.frontendWafRegion,
    },
    namePrefix,
    parameterName: webAclParameterName,
    allowedIpRanges: frontendConfig.allowedIpRanges,
    allowedIpRangesV6: frontendConfig.allowedIpRangesV6,
  });
}

const frontend = new FrontendStack(app, `${namePrefix}-FrontendStack`, {
  env: {
    region: frontendConfig.frontendRegion,
  },
  namePrefix,
  wafEnabled: frontendConfig.frontendWafEnabled,
  webAclParameterName,
  webAclRegion: frontendConfig.frontendWafRegion,
});

if (waf) {
  frontend.addDependency(waf);
}
