# 로컬 도커(Docker) 개발 환경 가이드

이 문서는 **K-Heroes** 프로젝트의 로컬 개발 환경 통일 및 라이브러리 추가 시 컨테이너 동기화를 위한 가이드입니다. 환경 불일치로 인한 빌드 에러를 방지하기 위해 아래 내용을 숙지 후 준수해 주세요.

---

## 1. 최초 개발 환경 세팅

### 1) Docker Desktop 설치 및 실행

1. Docker 공식 홈페이지에서 OS 환경에 맞는 버전을 다운로드하여 설치합니다.
2. [Windows 필수] 설치 과정 중 `Use WSL 2 instead of Hyper-V` 옵션은 반드시 체크합니다.
3. 설치 완료 후 Docker Desktop 앱을 실행합니다. (고래 아이콘이 초록색 `Running`으로 바뀌면 준비 완료)

### 2) 환경 변수 파일(`.env`) 생성

프로젝트 루트 디렉토리에서 환경 변수 설정 파일을 생성합니다.

```bash
cp .env.example .env
```

※ 생성 후 필요한 API 키 및 자격 증명 정보를 `.env` 파일에 기입해 주세요.

### 3) 프로젝트 컨테이너 최초 실행

프로젝트 루트 디렉토리(`k-heroes/`) 터미널에서 아래 명령어를 입력합니다.

```bash
# 로컬 컨테이너 빌드 및 백그라운드 실행
docker compose up -d
```

### 4) 정상 실행 확인 (브라우저 접속)

* **프론트엔드 (Next.js):** [http://localhost:3000](http://localhost:3000)
* **백엔드 API (FastAPI):** [http://localhost:8000](http://localhost:8000) (또는 API 문서 확인: [http://localhost:8000/docs](http://localhost:8000/docs))

---

## 2. 라이브러리(패키지) 추가 및 동기화 프로세스

로컬 PC 환경과 도커 컨테이너 내부의 패키지 격리를 위해, 신규 라이브러리 추가 및 Git Pull 이후에는 반드시 다음 프로세스를 따릅니다.

### [경우 A] 내가 신규 패키지를 추가하는 경우 (작업자)

반드시 실행 중인 도커 컨테이너 내부를 타깃으로 명령어를 수행해야 로컬과 컨테이너 환경이 동기화됩니다. (VS Code 터미널에서 실행)

#### 1) Frontend (Next.js - pnpm 사용)

```bash
docker compose exec frontend pnpm add [라이브러리명]
```

#### 2) Backend (FastAPI - pip 사용)
```bash
# 1. 컨테이너 내부 패키지 설치
docker compose exec backend pip install [라이브러리명]

# 2. backend/requirements.txt 파일 하단에 추가한 패키지 정보 명시
# 예시) [라이브러리명]==[버전]
```

#### 3) 팀원에게 공유 및 푸시

1. 패키지 설치가 완료되면 변경된 설정 파일들(`package.json`, `pnpm-lock.yaml`, `backend/requirements.txt` 등)을 확인하고 커밋/푸시합니다.
2. 메신저(슬랙, 카톡 등)로 팀원들에게 공유합니다.

---

### [경우 B] 팀원이 패키지를 추가한 코드를 받았을 때 (동기화)

git pull 이후 원격 저장소의 패키지 설정 파일이 변경되었다면, 아래 명령어를 실행하여 컨테이너 환경을 갱신합니다. 전체 재세팅 없이 변경 부분만 증분 빌드(Incremental Build)됩니다.

```bash
docker compose up -d --build
```

※ 평소에는 docker compose up -d로만 실행하며, 패키지 파일 변경이 있을 때만 --build 옵션을 추가합니다.

---

## 3. 핵심 도커 명령어 치트시트

### 컨테이너 종료 (Stop)

```bash
docker compose down
```

### 컨테이너 프로세스 상태 확인 (PS)

```bash
docker compose ps
```

### 실시간 로그 모니터링 (디버깅)

```bash
# 전체 서비스 로그 출력
docker compose logs -f

# 특정 서비스 로그만 출력
docker compose logs -f frontend
docker compose logs -f backend
```

### 컨테이너 내부 터미널 진입

```bash
# Frontend 컨테이너 쉘 진입
docker compose exec frontend sh

# Backend 컨테이너 쉘 진입
docker compose exec backend bash
```
