import {
  Stack,
  StackProps,
  aws_ssm as ssm,
  aws_wafv2 as waf,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { frontendConfig } from "./config";

export class WebAclStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const ipRanges = frontendConfig.allowedIpRanges;
    const ipRangesV6 = frontendConfig.allowedIpRangesV6;

    const wafIPSet4 = new waf.CfnIPSet(this, "IPSet4", {
      name: `${frontendConfig.systemName}-${frontendConfig.stage}-FrontendWebAclIpSet4`,
      ipAddressVersion: "IPV4",
      scope: "CLOUDFRONT",
      addresses: ipRanges,
    });

    const wafIPSet6 = new waf.CfnIPSet(this, "IPSet6", {
      name: `${frontendConfig.systemName}-${frontendConfig.stage}-FrontendWebAclIpSet6`,
      ipAddressVersion: "IPV6",
      scope: "CLOUDFRONT",
      addresses: ipRangesV6,
    });

    // CloudFront 用の WAF。IPv4/IPv6 と AWS Managed Rule を組み合わせる
    const frontendWaf = new waf.CfnWebACL(this, "waf", {
      defaultAction: { block: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "FrontendWAF",
      },
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
          name: `${frontendConfig.systemName}-${frontendConfig.stage}-FrontendWebAclIpRuleSet`,
          action: { allow: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "FrontendWebAclIpRuleSet",
          },
          statement: {
            ipSetReferenceStatement: {
              arn: wafIPSet4.attrArn,
            },
          },
        },
        {
          priority: 3,
          name: `${frontendConfig.systemName}-${frontendConfig.stage}-FrontendWebAclIpV6RuleSet`,
          action: { allow: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "FrontendWebAclIpV6RuleSet",
          },
          statement: {
            ipSetReferenceStatement: {
              arn: wafIPSet6.attrArn,
            },
          },
        },
      ],
    });

    // CloudFront から参照しやすいように WAF ARN を SSM へ保存
    new ssm.StringParameter(this, "WebAclArnParameter", {
      parameterName: "WebAclArnParameter",
      stringValue: frontendWaf.attrArn,
    });
  }
}
