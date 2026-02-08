# WEAVE

**WEAVE** (Well-structured Empirical workflows in Analysis, Visualized selection, and Efficient binarization)는 LLM 지시문 데이터 엔지니어링을 위한 통합 워크벤치입니다.
동사 기반 그룹핑과 모델 중심 변동성 스코어링을 결합한 하이브리드 데이터 선택(**GROVE**), 예산 기반 과업 혼합 분석(**MOSS**), 모델 행동 지식을 활용한 제로 어노테이션 선호 이원화(**ZEBRA**) 세 가지 핵심 모듈을 통합합니다.
이를 통해 비구조적이고 전체 규모의 데이터셋으로 학습하는 것보다 더 높은 토큰당 정확도 및 GPU 시간당 정확도를 달성할 수 있습니다.

## 목차

- [사전 요구사항](#사전-요구사항)
- [빠른 시작](#빠른-시작)
- [포함 서비스](#포함-서비스)
- [주요 명령어](#주요-명령어)
- [문제 해결](#문제-해결)

## 사전 요구사항

다음 소프트웨어가 설치되어 있어야 합니다:

- **Docker**: 20.10 이상
- **Docker Compose**: 2.0 이상

설치 확인:
```bash
docker --version
docker compose version
```

## 빠른 시작

### 1. 환경변수 설정

```bash
# .env.example 파일을 .env로 복사
cp .env.example .env

# .env 파일을 편집하여 환경변수 세팅
```
[환경변수 가이드](#환경변수-설정)

### 2. 전체 스택 실행

```bash
# 모든 서비스 빌드 및 실행 (Milvus + Redis 포함)
docker compose up -d

# 로그 확인
docker compose logs -f

# 상태 확인
docker compose ps
```

### 3. 데이터 초기화 (임베딩)

Milvus에 임베딩 데이터를 넣기 위해 **옵션 프로필**로 1회 실행합니다 (OpenAI 비용이 발생할 수 있습니다).

```bash
# MOSS 임베딩 색인 (seed_sentence + instruction_alpaca)
docker compose --profile embed run --rm grove-task-mixture-embed

# Weavy 문서 임베딩 (RAG 챗봇용)
docker compose --profile ingest run --rm weavy-ingest
```

### 4. 서비스 접속

### 웹 인터페이스

| 서비스 | URL | 설명 |
|--------|-----|------|
| Frontend | http://localhost | 메인 웹 UI |
| Attu | http://localhost:8000 | Milvus GUI 관리 도구 |


### Health Check

모든 서비스의 상태 확인:

```bash
# 전체 서비스 상태
docker compose ps

# 개별 서비스 health check
curl http://localhost:8080/actuator/health  # Cache Service
curl http://localhost:8081/actuator/health  # Task Mixture
curl http://localhost:8082/actuator/health  # Zebra Service
curl http://localhost:8083/health           # Model Centric
curl http://localhost:8084/actuator/health  # Weavy
curl http://localhost/health                # Frontend
```

## 포함 서비스

- **Milvus** (벡터 데이터베이스) + etcd, MinIO
- **Attu** (Milvus GUI 관리 도구)
- **Redis** (캐싱)
- **백엔드 서비스** 5개 (Cache, Task Mixture, Zebra, Model Centric, Weavy)
- **Frontend**

## 환경변수 설정

`.env` 파일의 주요 환경변수:

### 필수 환경변수

```env
# OpenAI API 키 (weavy 서비스에 필수)
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Hugging Face Token (grove-model-centric-service에서 모델 다운로드에 필요)
# https://huggingface.co/settings/tokens 에서 발급
HF_TOKEN=hf_your-token-here
```

### 선택적 환경변수

```env
# Redis 설정 (기본값: redis:6379)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# Milvus 설정 (기본값: milvus:19530)
MILVUS_HOST=milvus
MILVUS_PORT=19530
MILVUS_URI=http://milvus:19530

# 서비스 포트 (기본값 사용 권장)
CACHE_SERVICE_PORT=8080
TASK_MIXTURE_PORT=8081
ZEBRA_SERVICE_PORT=8082
MODEL_CENTRIC_PORT=8083
WEAVY_PORT=8084
FRONTEND_PORT=80
```

## 주요 명령어

### 시작 및 중지

```bash
# 전체 스택 시작 (백그라운드)
docker compose up -d

# 전체 스택 시작 (로그 표시)
docker compose up

# 전체 스택 중지
docker compose down

# 중지 + 볼륨 삭제 (데이터 초기화)
docker compose down -v
```

### 로그 확인

```bash
# 모든 서비스 로그 실시간 확인
docker compose logs -f

# 특정 서비스 로그만 확인
docker compose logs -f grove-cache-service
docker compose logs -f weavy

# 최근 100줄만 확인
docker compose logs --tail=100
```

### 서비스 재시작

```bash
# 전체 재시작
docker compose restart

# 특정 서비스만 재시작
docker compose restart grove-cache-service

# 서비스 재빌드 후 재시작
docker compose up -d --build grove-cache-service
```

### 상태 확인

```bash
# 실행 중인 컨테이너 목록
docker compose ps

# 상세 상태 (CPU, 메모리 사용량)
docker stats

# 특정 서비스 상세 정보
docker compose logs grove-cache-service
```

### 데이터 관리

```bash
# 볼륨 목록 확인
docker volume ls | grep grove

# 볼륨 상세 정보
docker volume inspect grove_milvus-data

# 사용하지 않는 볼륨 정리
docker volume prune

# 모든 데이터 초기화 (주의!)
docker compose down -v
```

### 빌드

```bash
# 모든 이미지 빌드
docker compose build

# 캐시 무시하고 빌드
docker compose build --no-cache

# 특정 서비스만 빌드
docker compose build grove-cache-service

# 병렬 빌드 (빠름)
docker compose build --parallel
```

## 문제 해결


### 포트 충돌

**증상**: `port is already allocated` 오류

**해결**:
```bash
# 포트 사용 중인 프로세스 확인 (macOS/Linux)
lsof -i :8080

# .env 파일에서 포트 변경
CACHE_SERVICE_PORT=18080

# 또는 기존 프로세스 종료
kill -9 <PID>
```

### 메모리 부족

**증상**: 서비스가 OOM으로 종료됨

**해결**:
```bash
# Docker 메모리 설정 확인 (Docker Desktop)
# Settings > Resources > Memory 에서 최소 8GB 할당

# 또는 일부 서비스만 실행
docker compose up -d redis grove-cache-service grove-frontend
```

### 환경변수가 적용되지 않음

**증상**: 기본값이 계속 사용됨

**해결**:
```bash
# .env 파일 위치 확인 (docker compose.yml과 같은 디렉토리)
ls -la .env

# 환경변수 확인
docker compose config

# 재빌드 및 재시작
docker compose down
docker compose up -d --build
```

