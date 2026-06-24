#!/bin/bash
set -e

# 프로젝트 루트의 .env 파일 존재 여부 확인
if [ ! -f ../.env ]; then
    echo "[ERROR] 프로젝트 루트에 .env 파일이 존재하지 않습니다. 프로젝트 루트에 .env 파일을 생성해 주세요."
    exit 1
fi

# .env 파일에서 GCP_PROJECT_ID 읽어오기 (기본값 k-heroes-499407)
PROJECT_ID=$(grep -E '^GCP_PROJECT_ID=' ../.env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | tr -d '\r')
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID="k-heroes-499407"
fi

# GCP 설정 정보
SERVICE_NAME="k-heroes-backend"
REGION="asia-northeast3"

echo "=========================================="
echo "프로젝트 ID: $PROJECT_ID"
echo "서비스 이름: $SERVICE_NAME"
echo "리전: $REGION"
echo "데이터베이스: Supabase (PostgreSQL)"
echo "=========================================="

# 프로젝트 루트의 .env 파일에서 환경변수 파싱하여 쉼표로 연결
# 주석(#) 및 빈 줄 제외하고 한 줄로 조인
ENV_VARS=$(grep -v '^#' ../.env | grep -v '^$' | tr '\n' ',' | sed 's/,$//')

# Cloud Run 배포 실행 (수파베이스 연동용으로 볼륨 마운트 없이 심플하게 배포)
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --execution-environment=gen2 \
  --allow-unauthenticated \
  --max-instances=1 \
  --set-env-vars "$ENV_VARS,GCP_PROJECT_ID=$PROJECT_ID"

echo "=========================================="
echo "[SUCCESS] 배포가 완료되었습니다!"
echo "=========================================="
