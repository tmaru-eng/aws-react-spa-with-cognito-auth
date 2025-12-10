import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_iam as iam,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  custom_resources as customResources,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      websiteErrorDocument: "index.html",
      websiteIndexDocument: "index.html",
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront からのみ S3 にアクセスさせるための OAI
    const websiteIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "WebsiteIdentity"
    );
    websiteBucket.grantRead(websiteIdentity);

    // us-east-1 にある WAF ARN を SSM から参照
    const webAclRef = new SsmParameterReader(this, "WebAclArnParameterReader", {
      parameterName: "WebAclArnParameter",
      region: "us-east-1",
    }).stringValue;

    // SPA なので 404 を index.html に差し替え
    const websiteDistribution = new cloudfront.Distribution(
      this,
      "WebsiteDistribution",
      {
        webAclId: webAclRef,
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessIdentity(
            websiteBucket,
            {
              originAccessIdentity: websiteIdentity,
            }
          ),
        },
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(300),
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      }
    );

    // ビルド成果物を S3/CloudFront へデプロイ
    new s3deploy.BucketDeployment(this, "WebsiteDeploy", {
      sources: [
        s3deploy.Source.asset(`${path.resolve(__dirname)}/../../web/build`),
      ],
      destinationBucket: websiteBucket,
      distribution: websiteDistribution,
      distributionPaths: ["/*"],
      memoryLimit: 1024,
    });

    new CfnOutput(this, "endpoint", {
      description: "Frontend Endpoint",
      value: websiteDistribution.distributionDomainName,
    });
  }
}

interface SsmParameterReaderProps {
  parameterName: string;
  region: string;
}

// 別リージョンの SSM パラメータを安全に読むためのカスタムリソース
class SsmParameterReader extends Construct {
  private reader: customResources.AwsCustomResource;

  get stringValue(): string {
    return this.getParameterValue();
  }

  constructor(scope: Construct, name: string, props: SsmParameterReaderProps) {
    super(scope, name);

    const { parameterName, region } = props;

    const customResource = new customResources.AwsCustomResource(
      scope,
      `${name}CustomResource`,
      {
        policy: customResources.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ssm:GetParameter*"],
            resources: [
              Stack.of(this).formatArn({
                service: "ssm",
                region,
                resource: "parameter",
                resourceName: parameterName.replace(/^\/+/, ""),
              }),
            ],
          }),
        ]),
        installLatestAwsSdk: false,
        onUpdate: {
          service: "SSM",
          action: "getParameter",
          parameters: {
            Name: parameterName,
          },
          region,
          physicalResourceId: customResources.PhysicalResourceId.of(
            Date.now().toString()
          ),
        },
      }
    );

    this.reader = customResource;
  }

  private getParameterValue(): string {
    return this.reader.getResponseField("Parameter.Value");
  }
}
