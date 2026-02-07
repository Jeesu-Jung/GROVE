# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

GROVE (GROup Variable Evaluation) is a microservices-based system for instruction dataset analysis, optimization, and LLM interaction with intelligent caching and vector search capabilities. The system consists of 5 backend services (4 Kotlin/Spring Boot, 1 Python/FastAPI) and 1 React frontend.

## Service Architecture

### Backend Services
- **weavy** (port 8084): RAG-based chatbot using LangChain4j with Milvus vector search
- **grove-cache-service** (port 8080): LLM API caching proxy for OpenAI, Claude, and OpenRouter
- **grove-task-mixture-service** (port 8081): Instruction dataset sampling and task mixture recommendation
- **grove-zebra-service** (port 8082): Model benchmark scoring and recommendation
- **grove-model-centric-service** (port 8083): Model variability analysis using Jensen-Shannon divergence

### Frontend
- **grove-frontend** (port 5173): React + TypeScript + Vite + TailwindCSS UI for dataset analysis

### External Dependencies
- **Milvus 2.6.2**: Vector database (port 19530) with collections for instruction embeddings and document search
- **Redis**: Caching layer for all services (default localhost:6379)

## Common Commands

### Docker (권장)

전체 프로젝트를 Docker로 실행하는 방법입니다. 자세한 내용은 [README.Docker.md](README.Docker.md) 참조.

```bash
# 환경 설정
cp .env.example .env
# .env 파일에서 OPENAI_API_KEY 설정

# 모델 준비 (model-centric-service용)
mkdir -p grove-model-centric-service/model/Llama-3.2-1B-Instruct
# Llama-3.2-1B-Instruct 모델 다운로드 및 배치

# 전체 스택 실행 (Milvus + Redis 포함)
docker-compose up -d

# 경량 버전 실행 (Milvus 제외)
docker-compose -f docker-compose.lite.yml up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

### 로컬 개발 (Docker 미사용)

#### Milvus (Required for all services):
```bash
cd milvus_v2.6.2-docker-compose
docker-compose up -d
```

#### Kotlin/Spring Boot Services (weavy, cache, task-mixture, zebra):
```bash
# Run from service directory
./gradlew bootRun

# Build JAR
./gradlew build

# Run tests
./gradlew test

# Run specific test
./gradlew test --tests "io.jeesu.servicename.SpecificTestClass"

# Clean build
./gradlew clean build
```

#### Python Services (model-centric):
```bash
cd grove-model-centric-service

# Install dependencies
pip install -r requirements.txt

# Download Llama-3.2-1B-Instruct model first
# Place files in model/Llama-3.2-1B-Instruct/

# Run service
uvicorn main:get_app --host 0.0.0.0 --port 8083
```

#### Frontend:
```bash
cd grove-frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

#### Data Labeling Tool (Streamlit):
```bash
# Run from root directory
streamlit run app.py
```

### Embedding Scripts

Before using task-mixture or weavy services, populate Milvus with embeddings:

```bash
cd grove-task-mixture-embed

# Install dependencies
pip install -r requirements.txt

# Set OpenAI API key
export OPENAI_API_KEY="your-key"

# Embed Alpaca instruction dataset
python embed_instruction_alpaca.py

# Embed seed sentences for task categories
python embed_seed_sentences.py
```

## Architecture Details

### Service Communication Pattern
Services communicate via synchronous HTTP/REST using Spring Cloud OpenFeign. The cache service acts as a proxy for external LLM APIs. Frontend calls backend services directly via Vite proxy configuration.

### Milvus Collections
- `instruction_alpaca`: Alpaca instruction dataset with 1536-dim OpenAI embeddings
- `seed_sentence`: Seed sentences for task type categorization
- `weavy_test`: Document embeddings for RAG chatbot

### Configuration Files
All Kotlin services use `src/main/resources/application.yml` for configuration including:
- Server port
- Redis connection settings
- Milvus connection settings
- OpenFeign client configurations
- Cache settings

### Key Technologies
- **Backend**: Kotlin 1.9.25, Spring Boot 3.5.6, Java 21, LangChain4j 1.7.1
- **Frontend**: React 18, TypeScript, Vite 7, TailwindCSS, Zustand (state), React Router v6
- **ML/AI**: PyTorch, Transformers, LangChain4j, OpenAI embeddings
- **Data**: Milvus vector DB, Redis cache, CSV benchmark files

## Development Workflow

### Service Startup Order
1. Start Milvus and MinIO via Docker Compose
2. Start Redis (if not already running)
3. Start backend services (any order, but cache-service often used by others)
4. Start frontend with `npm run dev`

### Testing Strategy
- Kotlin services use JUnit 5 with Spring Boot Test
- Run tests with `./gradlew test` in each service directory
- Frontend tests use ESLint for linting: `npm run lint`

### API Testing
Each service exposes REST endpoints. Example curl commands:

```bash
# Task Mixture Search
curl -X POST http://localhost:8081/v1/task-mixture/alpaca/search \
  -H 'Content-Type: application/json' \
  -d '{"model": "llama2-7b", "data_size": 1000, "task": "qa", "target_task": "sample task"}'

# Model Variability Analysis
curl -X POST http://localhost:8083/v1/model-centric/variability/extract \
  -H 'Content-Type: application/json' \
  -d '{"inputs": "tell me about seasons in the forest"}'

# Weavy Chat
curl -X POST http://localhost:8084/weavy/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "What is GROVE?", "sessionId": "test-session"}'
```

### Code Organization
- **Kotlin services**: Follow standard Spring Boot structure with `controller`, `service`, `repository`, `domain`, `config` packages
- **Frontend**: Component-based React with pages in `src/pages/`, shared components in `src/components/`
- **State management**: Zustand stores in `src/store/`
- **API clients**: Feign clients in each Kotlin service under `client` package

## Important Notes

- The Llama-3.2-1B-Instruct model must be downloaded manually for grove-model-centric-service
- Redis must be running on localhost:6379 for all caching features to work
- Milvus must be populated with embeddings before task-mixture and weavy services can return results
- Frontend proxy configuration in `vite.config.ts` routes API calls to appropriate backend ports
- Rate limiting is implemented in weavy service (daily limits per IP)
- All Spring Boot services use Java 21 - ensure JDK 21 is installed
- Vector search results are cached in Redis with MD5-hashed keys to reduce costs and improve performance
