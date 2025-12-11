import {
  Duration,
  Stack,
  StackProps,
  CfnOutput,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as waf from "aws-cdk-lib/aws-wafv2";
import * as agw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
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
    const getTimeFunction = new lambdaNodejs.NodejsFunction(
      this,
      "getTime",
      {
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 512,
        entry: path.join(__dirname, "../lambda/time/get.ts"),
        functionName: `${props.namePrefix}-getTime`,
      }
    );

    // React Admin demo 用 DynamoDB テーブル（posts/users/comments）
    const postsTable = new dynamodb.Table(this, "PostsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.namePrefix.includes("prod")
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      tableName: `${props.namePrefix}-PostsTable`,
    });

    const usersTable = new dynamodb.Table(this, "UsersTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.namePrefix.includes("prod")
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      tableName: `${props.namePrefix}-UsersTable`,
    });

    const commentsTable = new dynamodb.Table(this, "CommentsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.namePrefix.includes("prod")
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      tableName: `${props.namePrefix}-CommentsTable`,
    });

    // React Admin 用の CRUD Lambda（posts/users/comments を1本で処理）
    const demoFunction = new lambdaNodejs.NodejsFunction(
      this,
      "demoHandler",
      {
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 512,
        entry: path.join(__dirname, "../lambda/demo/handler.ts"),
        functionName: `${props.namePrefix}-demo-api`,
        environment: {
          POSTS_TABLE: postsTable.tableName,
          USERS_TABLE: usersTable.tableName,
          COMMENTS_TABLE: commentsTable.tableName,
        },
      }
    );
    postsTable.grantReadWriteData(demoFunction);
    usersTable.grantReadWriteData(demoFunction);
    commentsTable.grantReadWriteData(demoFunction);

    // アクセスを許可する IP レンジをコンテキストから取得
    const ipRanges = props.allowedIpRanges;

    const wafIPSet = new waf.CfnIPSet(this, "IPSet", {
      name: `${props.namePrefix}-BackendWebAclIpSet`,
      ipAddressVersion: "IPV4",
      scope: "REGIONAL",
      addresses: ipRanges,
    });

    const apiWaf = new waf.CfnWebACL(this, "waf", {
      name: `${props.namePrefix}-BackendWAF`,
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
      restApiName: `${props.namePrefix}-api`,
      deployOptions: {
        stageName: "api",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: agw.Cors.ALL_ORIGINS,
        allowMethods: agw.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "X-Amz-User-Agent",
          "Accept",
          "Origin",
        ],
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

    // CRUD: /posts, /users (comments は posts/{id}/comments もサポート)
    const resources = ["posts", "users"];
    resources.forEach((name) => {
      const res = api.root.addResource(name);
      const byId = res.addResource("{id}");

      res.addMethod("GET", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
      res.addMethod("POST", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
      byId.addMethod("GET", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
      byId.addMethod("PUT", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
      byId.addMethod("DELETE", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
    });

    // comments: /comments, /comments/{id}
    const comments = api.root.addResource("comments");
    const commentById = comments.addResource("{id}");

    [comments, commentById].forEach((res) => {
      ["GET", "POST", "PUT", "DELETE"].forEach((method) => {
        // DELETE/PUT only on commentById
        if ((method === "PUT" || method === "DELETE") && res === comments) return;
        res.addMethod(method, new agw.LambdaIntegration(demoFunction), {
          authorizer,
          authorizationType: agw.AuthorizationType.COGNITO,
        });
      });
    });

    // /posts/{id}/comments, /posts/{id}/comments/{commentId}
    const postsRoot = api.root.getResource("posts");
    if (postsRoot) {
      const postById = postsRoot.getResource("{id}") ?? postsRoot.addResource("{id}");
      const postComments = postById.addResource("comments");
      const postCommentById = postComments.addResource("{commentId}");

      postComments.addMethod("GET", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
      postComments.addMethod("POST", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
      postCommentById.addMethod("GET", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
      postCommentById.addMethod("PUT", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
      postCommentById.addMethod("DELETE", new agw.LambdaIntegration(demoFunction), {
        authorizer,
        authorizationType: agw.AuthorizationType.COGNITO,
      });
    }

    new CfnOutput(this, "apiEndpoint", {
      value: api.url,
      description: "API Gateway invoke URL (ステージ付き)",
    });
  }
}
