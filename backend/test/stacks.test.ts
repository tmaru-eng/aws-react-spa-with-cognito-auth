import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { AuthStack } from "../lib/auth";
import { APIStack } from "../lib/api";

test("AuthStack でユーザープールが作成される", () => {
  const app = new App();
  const stack = new AuthStack(app, "AuthStackTest");
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::Cognito::UserPool", {
    MfaConfiguration: "ON",
  });

  template.hasOutput("CognitoUserPoolId", {});
  template.hasOutput("CognitoUserPoolWebClientId", {});
});

test("APIStack が Cognito 認証付き API を作成する", () => {
  const app = new App();
  const base = new Stack(app, "Base");
  const userPool = new cognito.UserPool(base, "UserPool");

  const apiStack = new APIStack(app, "ApiStackTest", {
    userPool,
    namePrefix: "test",
    allowedIpRanges: ["0.0.0.0/0"],
  });
  const template = Template.fromStack(apiStack);

  template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
  template.hasResourceProperties("AWS::ApiGateway::Authorizer", {
    Type: "COGNITO_USER_POOLS",
  });
  template.hasResourceProperties("AWS::WAFv2::WebACL", {
    Scope: "REGIONAL",
  });
  template.resourceCountIs("AWS::DynamoDB::Table", 3); // posts, users, comments
  template.resourceCountIs("AWS::Lambda::Function", 2); // getTime + demo CRUD
});
