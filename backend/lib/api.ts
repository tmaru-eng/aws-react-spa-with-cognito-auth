import { Duration, Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as waf from "aws-cdk-lib/aws-wafv2";
import * as agw from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

interface APIStackProps extends StackProps {
  userPool: cognito.UserPool;
  namePrefix: string;
  allowedIpRanges: string[];
}

export class APIStack extends Stack {
  constructor(scope: Construct, id: string, props: APIStackProps) {
    super(scope, id, props);

    const authorizer = new agw.CognitoUserPoolsAuthorizer(this, "Authorizer", {
      cognitoUserPools: [props.userPool],
    });

    // Lambda（Node.js 20 + ESBuild バンドル）で現在時刻を返す
    const getTimeFunction = new lambdaNodejs.NodejsFunction(this, "getTime", {
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      entry: path.join(__dirname, "../lambda/time/get.ts"),
    });

    // アクセスを許可する IP レンジをコンテキストから取得
    const ipRanges = props.allowedIpRanges;

    const wafIPSet = new waf.CfnIPSet(this, "IPSet", {
      name: `${props.namePrefix}-BackendWebAclIpSet`,
      ipAddressVersion: "IPV4",
      scope: "REGIONAL",
      addresses: ipRanges,
    });

    const apiWaf = new waf.CfnWebACL(this, "waf", {
      defaultAction: { block: {} },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "ApiGatewayWAF",
      },
      // https://docs.aws.amazon.com/ja_jp/waf/latest/developerguide/aws-managed-rule-groups-list.html
      rules: [
        {
          priority: 1,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "AWS-AWSManagedRulesCommonRuleSet",
          },
          name: "AWSManagedRulesCommonRuleSet",
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
        },
        {
          priority: 2,
          name: "BackendWebAclIpRuleSet",
          action: { allow: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "BackendWebAclIpRuleSet",
          },
          statement: {
            ipSetReferenceStatement: {
              arn: wafIPSet.attrArn,
            },
          },
        },
      ],
    });

    // API Gateway を用意し、Cognito 認証 + WAF を適用
    const api = new agw.RestApi(this, "api", {
      deployOptions: {
        stageName: "api",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: agw.Cors.ALL_ORIGINS,
        allowMethods: agw.Cors.ALL_METHODS,
      },
    });

    const region = Stack.of(this).region;
    const restApiId = api.restApiId;
    const stageName = api.deploymentStage.stageName;
    new waf.CfnWebACLAssociation(this, "apply-waf-apigw", {
      webAclArn: apiWaf.attrArn,
      resourceArn: `arn:aws:apigateway:${region}::/restapis/${restApiId}/stages/${stageName}`,
    });

    // GET: /time
    const userinfo = api.root.addResource("time");
    userinfo.addMethod("GET", new agw.LambdaIntegration(getTimeFunction), {
      authorizer: authorizer,
      authorizationType: agw.AuthorizationType.COGNITO,
    });

    new CfnOutput(this, "apiEndpoint", {
      value: api.url,
      description: "API Gateway invoke URL (ステージ付き)",
    });
  }
}
