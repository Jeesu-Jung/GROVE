# GROVE Docker 가이드

GROVE 프로젝트를 Docker로 한번에 실행하는 방법을 설명합니다.

## 목차

- [사전 요구사항](#사전-요구사항)
- [빠른 시작](#빠른-시작)
- [버전 선택](#버전-선택)
- [모델 준비](#모델-준비)
- [환경변수 설정](#환경변수-설정)
- [서비스 접속](#서비스-접속)
- [주요 명령어](#주요-명령어)
- [문제 해결](#문제-해결)

## 사전 요구사항

다음 소프트웨어가 설치되어 있어야 합니다:

- **Docker**: 20.10 이상
- **Docker Compose**: 2.0 이상

설치 확인:
```bash
docker --version
docker-compose --version
```

## 빠른 시작

### 1. 환경변수 설정

```bash
# .env.example 파일을 .env로 복사
cp .env.example .env

# .env 파일을 편집하여 OPENAI_API_KEY 설정
# 필수: OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 2. 모델 준비 (grove-model-centric-service용)

Llama-3.2-1B-Instruct 모델을 다운로드합니다:

```bash
# 모델 디렉토리 생성
mkdir -p grove-model-centric-service/model/Llama-3.2-1B-Instruct

# Hugging Face에서 모델 다운로드
# https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct
# 모든 파일을 grove-model-centric-service/model/Llama-3.2-1B-Instruct/ 에 배치
```

자세한 내용은 [모델 준비](#모델-준비) 섹션을 참조하세요.

### 3. 전체 스택 실행

```bash
# 모든 서비스 빌드 및 실행 (Milvus + Redis 포함)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

### 4. 서비스 접속

- **Frontend**: http://localhost
- **Cache Service**: http://localhost:8080
- **Task Mixture Service**: http://localhost:8081
- **Zebra Service**: http://localhost:8082
- **Model Centric Service**: http://localhost:8083
- **Weavy Service**: http://localhost:8084
- **Milvus Console**: http://localhost:9091
- **MinIO Console**: http://localhost:9001

## 버전 선택

### 전체 버전 (docker-compose.yml)

**포함 서비스**:
- Milvus (벡터 데이터베이스)
- Redis (캐싱)
- 모든 백엔드 서비스 (5개)
- Frontend

**사용 사례**:
- 프로덕션 환경
- 전체 기능 사용
- 벡터 검색 및 RAG 챗봇 필요

**실행**:
```bash
docker-compose up -d
```

### 경량 버전 (docker-compose.lite.yml)

**포함 서비스**:
- Redis (캐싱)
- 백엔드 서비스 3개 (cache, zebra, model-centric)
- Frontend (일부 기능 제한)

**제외 서비스**:
- Milvus, etcd, MinIO
- Task Mixture Service
- Weavy Service

**사용 사례**:
- 개발/테스트 환경
- 벡터 검색 기능 불필요
- 리소스 제약 환경

**실행**:
```bash
docker-compose -f docker-compose.lite.yml up -d
```

## 모델 준비

grove-model-centric-service는 Llama-3.2-1B-Instruct 모델이 필요합니다.

### 방법 1: 수동 다운로드 (권장)

1. Hugging Face에서 모델 다운로드:
   - URL: https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct
   - 모든 `.bin`, `.json`, `.txt` 파일 다운로드

2. 파일 배치:
   ```bash
   grove-model-centric-service/model/Llama-3.2-1B-Instruct/
   ├── config.json
   ├── generation_config.json
   ├── model.safetensors
   ├── special_tokens_map.json
   ├── tokenizer.json
   ├── tokenizer_config.json
   └── ... (기타 파일들)
   ```

3. 디렉토리 구조 확인:
   ```bash
   ls -la grove-model-centric-service/model/Llama-3.2-1B-Instruct/
   ```

### 방법 2: Hugging Face CLI 사용

```bash
# Hugging Face CLI 설치
pip install huggingface-hub

# 모델 다운로드
huggingface-cli download meta-llama/Llama-3.2-1B-Instruct \
  --local-dir grove-model-centric-service/model/Llama-3.2-1B-Instruct
```

### 방법 3: 커스텀 경로 사용

다른 위치에 모델이 있는 경우:

```bash
# .env 파일에서 MODEL_PATH 수정
MODEL_PATH=/absolute/path/to/your/model
```

## 환경변수 설정

`.env` 파일의 주요 환경변수:

### 필수 환경변수

```env
# OpenAI API 키 (weavy 서비스에 필수)
OPENAI_API_KEY=sk-proj-your-actual-key-here
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

# 모델 경로
MODEL_PATH=./grove-model-centric-service/model
```

## 서비스 접속

### 웹 인터페이스

| 서비스 | URL | 설명 |
|--------|-----|------|
| Frontend | http://localhost | 메인 웹 UI |
| MinIO Console | http://localhost:9001 | 객체 스토리지 관리 (minioadmin/minioadmin) |

### API 엔드포인트

| 서비스 | URL | 주요 엔드포인트 |
|--------|-----|-----------------|
| Cache Service | http://localhost:8080 | `/v1/chat/completions`, `/v1/messages` |
| Task Mixture | http://localhost:8081 | `/v1/task-mixture/alpaca/search` |
| Zebra Service | http://localhost:8082 | `/v1/benchmark/models` |
| Model Centric | http://localhost:8083 | `/v1/model-centric/variability/extract` |
| Weavy | http://localhost:8084 | `/weavy/v1/chat`, `/weavy/v1/ingest` |

### Health Check

모든 서비스의 상태 확인:

```bash
# 전체 서비스 상태
docker-compose ps

# 개별 서비스 health check
curl http://localhost:8080/actuator/health  # Cache Service
curl http://localhost:8081/actuator/health  # Task Mixture
curl http://localhost:8082/actuator/health  # Zebra Service
curl http://localhost:8083/health           # Model Centric
curl http://localhost:8084/actuator/health  # Weavy
curl http://localhost/health                # Frontend
```

## 주요 명령어

### 시작 및 중지

```bash
# 전체 스택 시작 (백그라운드)
docker-compose up -d

# 전체 스택 시작 (로그 표시)
docker-compose up

# 경량 버전 시작
docker-compose -f docker-compose.lite.yml up -d

# 전체 스택 중지
docker-compose down

# 중지 + 볼륨 삭제 (데이터 초기화)
docker-compose down -v
```

### 로그 확인

```bash
# 모든 서비스 로그 실시간 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f grove-cache-service
docker-compose logs -f weavy

# 최근 100줄만 확인
docker-compose logs --tail=100
```

### 서비스 재시작

```bash
# 전체 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart grove-cache-service

# 서비스 재빌드 후 재시작
docker-compose up -d --build grove-cache-service
```

### 상태 확인

```bash
# 실행 중인 컨테이너 목록
docker-compose ps

# 상세 상태 (CPU, 메모리 사용량)
docker stats

# 특정 서비스 상세 정보
docker-compose logs grove-cache-service
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
docker-compose down -v
```

### 빌드

```bash
# 모든 이미지 빌드
docker-compose build

# 캐시 무시하고 빌드
docker-compose build --no-cache

# 특정 서비스만 빌드
docker-compose build grove-cache-service

# 병렬 빌드 (빠름)
docker-compose build --parallel
```

## 문제 해결

### 서비스 시작 실패

**증상**: 특정 서비스가 계속 재시작됨

**해결**:
```bash
# 로그 확인
docker-compose logs -f <service-name>

# 컨테이너 내부 접속
docker-compose exec <service-name> sh

# 상태 확인
docker-compose ps
```

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

### Milvus 연결 실패

**증상**: `connection refused` 또는 타임아웃

**해결**:
```bash
# Milvus health check 확인
curl http://localhost:9091/healthz

# Milvus 재시작
docker-compose restart milvus

# Milvus 로그 확인
docker-compose logs -f milvus

# Milvus가 준비될 때까지 대기 (90초 start_period)
```

### Redis 연결 실패

**증상**: Redis 연결 오류

**해결**:
```bash
# Redis 상태 확인
docker-compose exec redis redis-cli ping
# 응답: PONG

# Redis 재시작
docker-compose restart redis
```

### 모델 로딩 실패 (Model Centric Service)

**증상**: `FileNotFoundError` 또는 모델 파일 없음

**해결**:
```bash
# 모델 파일 확인
ls -la grove-model-centric-service/model/Llama-3.2-1B-Instruct/

# 볼륨 마운트 확인
docker-compose exec grove-model-centric-service ls -la /app/model

# .env 파일의 MODEL_PATH 확인
cat .env | grep MODEL_PATH

# 모델 재다운로드 (모델 준비 섹션 참조)
```

### 메모리 부족

**증상**: 서비스가 OOM으로 종료됨

**해결**:
```bash
# Docker 메모리 설정 확인 (Docker Desktop)
# Settings > Resources > Memory 에서 최소 8GB 할당

# 경량 버전 사용
docker-compose -f docker-compose.lite.yml up -d

# 또는 일부 서비스만 실행
docker-compose up -d redis grove-cache-service grove-frontend
```

### 빌드 실패

**증상**: Gradle 또는 npm 빌드 오류

**해결**:
```bash
# 캐시 없이 재빌드
docker-compose build --no-cache <service-name>

# BuildKit 캐시 정리
docker builder prune

# 로컬에서 직접 빌드 테스트
cd <service-directory>
./gradlew build  # Kotlin 서비스
npm run build    # Frontend
```

### 네트워크 문제

**증상**: 서비스 간 통신 실패

**해결**:
```bash
# 네트워크 확인
docker network ls | grep grove

# 네트워크 상세 정보
docker network inspect grove_grove-network

# 네트워크 재생성
docker-compose down
docker-compose up -d
```

### 환경변수가 적용되지 않음

**증상**: 기본값이 계속 사용됨

**해결**:
```bash
# .env 파일 위치 확인 (docker-compose.yml과 같은 디렉토리)
ls -la .env

# 환경변수 확인
docker-compose config

# 재빌드 및 재시작
docker-compose down
docker-compose up -d --build
```

## 데이터 초기화

### Milvus 컬렉션 생성

Milvus에 임베딩 데이터를 넣으려면:

#### 방법 1: Docker로 one-shot 색인 실행 (권장)

Milvus/Redis 등 전체 스택을 올린 뒤, 임베딩 색인을 **옵션 프로필**로 1회 실행합니다.

```bash
# 1) 전체 스택 기동
docker compose up -d

# 2) Milvus 임베딩 색인 (seed_sentence + instruction_alpaca)
# - OpenAI 비용이 발생할 수 있습니다.
docker compose --profile embed run --rm grove-task-mixture-embed
```

#### 방법 2: 로컬에서 직접 실행

```bash
# 임베딩 스크립트 디렉토리로 이동
cd grove-task-mixture-embed

# 의존성 설치
pip install -r requirements.txt

# OpenAI API 키 설정
export OPENAI_API_KEY="your-key-here"

# Alpaca 데이터셋 임베딩
python embed_instruction_alpaca.py

# Seed 문장 임베딩
python embed_seed_sentences.py
```

## 프로덕션 배포 고려사항

### 보안

- `.env` 파일을 절대 Git에 커밋하지 마세요
- 프로덕션에서는 Docker secrets 또는 환경변수 관리 도구 사용
- API 키는 환경변수로만 관리

### 성능

- JVM 메모리 설정 최적화 (필요시 `JAVA_OPTS` 환경변수 추가)
- Redis `maxmemory` 정책 설정
- Milvus 메모리 할당 조정

### 모니터링

- Spring Boot Actuator metrics 활성화
- 로그 수집 (ELK Stack, Fluentd 등)
- 컨테이너 리소스 모니터링 (Prometheus + Grafana)

### 백업

```bash
# 볼륨 백업
docker run --rm -v grove_milvus-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/milvus-backup.tar.gz /data

# 볼륨 복원
docker run --rm -v grove_milvus-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/milvus-backup.tar.gz -C /
```

## 추가 리소스

- [CLAUDE.md](CLAUDE.md) - 코드베이스 아키텍처 가이드
- [README.md](README.md) - 프로젝트 개요
- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)

## 지원

문제가 발생하면 GitHub Issues에 보고해주세요.
