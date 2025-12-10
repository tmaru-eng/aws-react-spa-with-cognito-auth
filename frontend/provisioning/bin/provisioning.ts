#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { WebAclStack } from "../lib/web-acl-stack";
import { FrontendStack } from "../lib/frontend-stack";

const app = new App();
const waf = new WebAclStack(app, "FrontendWebAclStack", {
  env: {
    region: "us-east-1",
  },
});

new FrontendStack(app, "FrontendStack").addDependency(waf);
