#!/usr/bin/env node
import "source-map-support/register";
import "dotenv/config";
import { App } from "aws-cdk-lib";
import { WebAclStack } from "../lib/web-acl-stack";
import { FrontendStack } from "../lib/frontend-stack";
import { frontendConfig } from "../lib/config";

const app = new App();
const waf = new WebAclStack(app, "FrontendWebAclStack", {
  env: {
    region: frontendConfig.frontendWafRegion,
  },
});

new FrontendStack(app, "FrontendStack", {
  env: {
    region: frontendConfig.frontendRegion,
  },
}).addDependency(waf);
