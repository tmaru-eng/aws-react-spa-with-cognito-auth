import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { WebAclStack } from "../lib/web-acl-stack";

test("WAF の基本ルールが作成される", () => {
  const app = new App();
  const stack = new WebAclStack(app, "WebAclTest", {
    env: { region: "us-east-1" },
    namePrefix: "demo-dev",
    allowedIpRanges: ["0.0.0.0/0"],
    allowedIpRangesV6: ["::/0"],
    parameterName: "demo-dev-WebAclArnParameter",
  });
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::WAFv2::WebACL", {
    Scope: "CLOUDFRONT",
  });
  template.hasResourceProperties("AWS::SSM::Parameter", {
    Name: "demo-dev-WebAclArnParameter",
  });
});
