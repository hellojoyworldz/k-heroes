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

# SQLite DB 영구 저장용 GCS 버킷 (.env에 GCS_DB_BUCKET 없으면 기본값 사용)
GCS_DB_BUCKET=$(grep -E '^GCS_DB_BUCKET=' ../.env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | tr -d '\r')
if [ -z "$GCS_DB_BUCKET" ]; then
    GCS_DB_BUCKET="${PROJECT_ID}-k-heroes-db"
fi
DB_MOUNT_PATH="/data"
DB_FILE_NAME="k_heroes.db"
DATABASE_URL="sqlite:////data/${DB_FILE_NAME}"

echo "=========================================="
echo "K-Heroes 백엔드 GCP Cloud Run에 배포중..."
echo "프로젝트 ID: $PROJECT_ID"
echo "서비스 이름: $SERVICE_NAME"
echo "리전: $REGION"
echo "=========================================="

# GCS 버킷 생성 및 Cloud Run 서비스 계정 권한 부여
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
RUN_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

if ! gcloud storage buckets describe gs://${GCS_DB_BUCKET} --project $PROJECT_ID >/dev/null 2>&1; then
    echo "[INFO] GCS 버킷 생성 중: gs://${GCS_DB_BUCKET}"
    gcloud storage buckets create gs://${GCS_DB_BUCKET} \
        --project=$PROJECT_ID \
        --location=$REGION \
        --uniform-bucket-level-access
fi

gcloud storage buckets add-iam-policy-binding gs://${GCS_DB_BUCKET} \
    --project=$PROJECT_ID \
    --member="serviceAccount:${RUN_SERVICE_ACCOUNT}" \
    --role="roles/storage.objectAdmin" \
    >/dev/null

# 로컬 DB가 있고 GCS에 없으면 최초 1회 업로드
if [ -f db/${DB_FILE_NAME} ]; then
    if ! gcloud storage objects describe gs://${GCS_DB_BUCKET}/${DB_FILE_NAME} --project $PROJECT_ID >/dev/null 2>&1; then
        echo "[INFO] 로컬 DB를 GCS 버킷에 업로드 중 (최초 1회)"
        gcloud storage cp db/${DB_FILE_NAME} gs://${GCS_DB_BUCKET}/${DB_FILE_NAME} --project $PROJECT_ID
    fi
fi

# 프로젝트 루트의 .env 파일에서 환경변수 파싱하여 쉼표로 연결
# 주석(#) 및 빈 줄 제외하고 한 줄로 조인
ENV_VARS=$(grep -v '^#' ../.env | grep -v '^$' | grep -v '^GCS_DB_BUCKET=' | tr '\n' ',' | sed 's/,$//')

# Cloud Run 배포 실행
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --execution-environment=gen2 \
  --allow-unauthenticated \
  --max-instances=1 \
  --add-volume name=db-data,type=cloud-storage,bucket=${GCS_DB_BUCKET} \
  --add-volume-mount volume=db-data,mount-path=${DB_MOUNT_PATH} \
  --set-env-vars "$ENV_VARS,GCP_PROJECT_ID=$PROJECT_ID,DATABASE_URL=$DATABASE_URL,DB_VOLUME_MOUNT_PATH=$DB_MOUNT_PATH"

echo "=========================================="
echo "[SUCCESS] 배포가 완료되었습니다!"
echo "=========================================="
