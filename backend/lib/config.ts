const toBool = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
};

const parseList = (value: string | undefined, defaultList: string[]) => {
  if (!value) return defaultList;
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

export const backendConfig = {
  systemName: process.env.SYSTEM_NAME || "demo",
  stage: process.env.STAGE || "dev",
  backendRegion:
    process.env.BACKEND_REGION ||
    process.env.CDK_DEFAULT_REGION ||
    "ap-northeast-1",
  frontendRegion:
    process.env.FRONTEND_REGION ||
    process.env.CDK_DEFAULT_REGION ||
    "ap-northeast-1",
  frontendWafRegion: process.env.FRONTEND_WAF_REGION || "us-east-1",
  selfSignUpEnabled: toBool(process.env.SELF_SIGN_UP_ENABLED, false),
  allowedIpRanges: parseList(process.env.ALLOWED_IP_RANGES, [
    "0.0.0.0/1",
    "128.0.0.0/1",
  ]),
  allowedIpRangesV6: parseList(process.env.ALLOWED_IP_RANGES_V6, [
    "0000:0000:0000:0000:0000:0000:0000:0000/1",
    "8000:0000:0000:0000:0000:0000:0000:0000/1",
  ]),
};
