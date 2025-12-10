#!/usr/bin/env bash
set -euo pipefail

# デプロイ順: backend → .env.local 生成 → frontend/web build → frontend/provisioning deploy

PROFILE_ARG=""
REGION_ARG=""
REGION_VALUE=""
ENV_FILE="../frontend/web/.env.local"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      [[ $# -lt 2 ]] && { echo "Missing value for --profile" >&2; exit 1; }
      PROFILE_ARG="--profile $2"
      shift 2
      ;;
    --region)
      [[ $# -lt 2 ]] && { echo "Missing value for --region" >&2; exit 1; }
      REGION_ARG="--region $2"
      REGION_VALUE="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# リージョンは引数優先、なければ環境変数を参照、無ければ ap-northeast-1 を既定とする
if [[ -z "$REGION_VALUE" ]]; then
  REGION_VALUE="${AWS_REGION:-${AWS_DEFAULT_REGION:-ap-northeast-1}}"
  REGION_ARG="--region $REGION_VALUE"
fi

echo "Using env file: $ENV_FILE"
echo "Using region: $REGION_VALUE"

export AWS_REGION="$REGION_VALUE"
export AWS_DEFAULT_REGION="$REGION_VALUE"

echo "== Backend deploy =="
cd "$ROOT_DIR/backend"
if [[ ! -d node_modules ]]; then
  echo "Installing backend dependencies..."
  npm install
fi
cdk deploy --all --require-approval never $PROFILE_ARG $REGION_ARG

echo "== Fetching outputs =="
AUTH_STACK_JSON=$(aws cloudformation describe-stacks --stack-name AuthStack $PROFILE_ARG $REGION_ARG)
API_STACK_JSON=$(aws cloudformation describe-stacks --stack-name APIStack $PROFILE_ARG $REGION_ARG)

USER_POOL_ID=$(echo "$AUTH_STACK_JSON" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="CognitoUserPoolId") | .OutputValue')
USER_POOL_CLIENT_ID=$(echo "$AUTH_STACK_JSON" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="CognitoUserPoolWebClientId") | .OutputValue')
API_ENDPOINT=$(echo "$API_STACK_JSON" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="apiEndpoint") | .OutputValue' | sed 's:/*$::')

if [[ -z "$USER_POOL_ID" || -z "$USER_POOL_CLIENT_ID" || -z "$API_ENDPOINT" ]]; then
  echo "Failed to fetch outputs. Make sure stacks AuthStack/APIStack have been deployed." >&2
  exit 1
fi

mkdir -p "$(dirname "$ENV_FILE")"
cat > "$ENV_FILE" <<EOF
REACT_APP_COGNITO_REGION=${REGION_VALUE}
REACT_APP_COGNITO_USER_POOL_ID=${USER_POOL_ID}
REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID=${USER_POOL_CLIENT_ID}
REACT_APP_API_ENDPOINT=${API_ENDPOINT}
EOF
echo "Updated $ENV_FILE"

echo "== Frontend build =="
cd "$ROOT_DIR/frontend/web"
if [[ ! -d node_modules ]]; then
  echo "Installing frontend/web dependencies..."
  npm install
fi
npm run build

echo "== Frontend infrastructure deploy =="
cd "$ROOT_DIR/frontend/provisioning"
if [[ ! -d node_modules ]]; then
  echo "Installing frontend/provisioning dependencies..."
  npm install
fi
cdk deploy --all --require-approval never $PROFILE_ARG $REGION_ARG

echo "Deployment finished."
