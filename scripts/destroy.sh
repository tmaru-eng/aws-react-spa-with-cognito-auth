#!/usr/bin/env bash
set -euo pipefail

PROFILE_ARG=""
REGION_ARG=""
REGION_VALUE=""

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
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ルートの .env を読み込んで CDK/CLI へ共有
if [[ -f "$ROOT_DIR/.env" ]]; then
  echo "Loading shared environment from .env"
  while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    # Remove surrounding quotes if present
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    export "$key=$value"
  done < "$ROOT_DIR/.env"
fi

if [[ -z "$REGION_VALUE" ]]; then
  REGION_VALUE="${AWS_REGION:-${AWS_DEFAULT_REGION:-ap-northeast-1}}"
  REGION_ARG="--region $REGION_VALUE"
fi

echo "Using region: $REGION_VALUE"

export AWS_REGION="$REGION_VALUE"
export AWS_DEFAULT_REGION="$REGION_VALUE"

echo "== Destroy frontend stacks =="
cd "$ROOT_DIR/frontend/provisioning"
cdk destroy --all --require-approval never --force $PROFILE_ARG $REGION_ARG

echo "== Destroy backend stacks =="
cd "$ROOT_DIR/backend"
cdk destroy --all --require-approval never --force $PROFILE_ARG $REGION_ARG

echo "Destroy finished."
