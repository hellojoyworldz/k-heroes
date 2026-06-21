#!/bin/bash

# GCP 설정 정보
PROJECT_ID="k-heroes-499407"
SERVICE_NAME="k-heroes-backend"
REGION="asia-northeast3"

echo "=========================================="
echo "K-Heroes 백엔드 GCP Cloud Run에 배포중..."
echo "프로젝트 ID: $PROJECT_ID"
echo "서비스 이름: $SERVICE_NAME"
echo "리전: $REGION"
echo "=========================================="

# .env 파일 존재 여부 확인
if [ ! -f .env ]; then
    echo "[ERROR] .env 파일이 존재하지 않습니다. backend/ 폴더 아래에 .env 파일을 생성해 주세요."
    exit 1
fi

# .env 파일에서 환경변수 파싱하여 쉼표로 연결
# 주석(#) 및 빈 줄 제외하고 한 줄로 조인
ENV_VARS=$(grep -v '^#' .env | grep -v '^$' | tr '\n' ',' | sed 's/,$//')

# Cloud Run 배포 실행
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "$ENV_VARS,GCP_PROJECT_ID=$PROJECT_ID"

echo "=========================================="
echo "[SUCCESS] 배포가 완료되었습니다!"
echo "=========================================="
