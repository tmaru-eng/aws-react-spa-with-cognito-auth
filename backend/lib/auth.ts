import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { backendConfig } from "./config";

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly client: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 認証用のユーザープール（デモ用なので削除も許可）
    const userPool = new cognito.UserPool(this, "UserPool", {
      removalPolicy: RemovalPolicy.DESTROY,
      mfa: cognito.Mfa.REQUIRED,
      mfaSecondFactor: {
        otp: true,
        sms: false,
      },
      selfSignUpEnabled: backendConfig.selfSignUpEnabled,
      userPoolName: `${backendConfig.systemName}-${backendConfig.stage}-UserPool`,
    });

    // SPA から利用するクライアントを作成
    const client = userPool.addClient("WebClient", {
      userPoolClientName: `${backendConfig.systemName}-${backendConfig.stage}-WebClient`,
      idTokenValidity: Duration.days(1),
      accessTokenValidity: Duration.days(1),
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
    });

    this.userPool = userPool;
    this.client = client;

    // フロントエンド設定に必要な値をスタックの出力として表示
    new CfnOutput(this, "CognitoUserPoolId", {
      value: userPool.userPoolId,
      description: "userPoolId required for frontend settings",
    });
    new CfnOutput(this, "CognitoUserPoolWebClientId", {
      value: client.userPoolClientId,
      description: "clientId required for frontend settings",
    });
  }
}
