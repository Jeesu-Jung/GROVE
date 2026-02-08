# WEAVE

**WEAVE** (Well-structured Empirical workflows in Analysis, Visualized selection, and Efficient binarization) is a unified workbench for LLM instruction data engineering.
It integrates three core modules: 

- **Grouped Refinement of Organized Variability Estimation (GROVE)** for total dataset automatic visualization and hybrid data selection combining verb-anchored grouping with model-centric variability scoring,
- **Mixture Optimization for Structured Subtasks (MOSS)** for budget-aware task composition analysis, and
- **ZEro annotation Behavior-based Response Alignment (ZEBRA)** for zero-annotation preference binarization using model behavior knowledge.
  *([ZEBRA](https://aclanthology.org/2025.findings-emnlp.417/) page provides a prototype feature for automatic binarization to support alignment tuning.)*

Together, these components enable practitioners to achieve better accuracy-per-token and accuracy-per-GPU-hour than training on unstructured, fully scaled datasets.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Included Services](#included-services)
- [Key Commands](#key-commands)
- [Troubleshooting](#troubleshooting)

## Prerequisites

The following software must be installed:

- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher

Verify installation:
```bash
docker --version
docker compose version
```

## Quick Start

### 1. Configure Environment Variables

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit the .env file to set environment variables
```
[Environment Variables Guide](#environment-variables)

### 2. Run the Full Stack

```bash
# Build and run all services (including Milvus + Redis)
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### 3. Initialize Data (Embedding)

Run once with **optional profiles** to populate embedding data in Milvus (OpenAI API costs may apply).

```bash
# MOSS embedding index (seed_sentence + instruction_alpaca)
docker compose --profile embed run --rm grove-task-mixture-embed

# Weavy document embedding (for RAG chatbot)
docker compose --profile ingest run --rm weavy-ingest
```

### 4. Access Services

### Web Interfaces

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost | Main Web UI |
| Attu | http://localhost:8000 | Milvus GUI Management Tool |


### Health Check

Check the status of all services:

```bash
# Overall service status
docker compose ps

# Individual service health checks
curl http://localhost:8080/actuator/health  # Cache Service
curl http://localhost:8081/actuator/health  # Task Mixture
curl http://localhost:8082/actuator/health  # Zebra Service
curl http://localhost:8083/health           # Model Centric
curl http://localhost:8084/actuator/health  # Weavy
curl http://localhost/health                # Frontend
```

## Included Services

- **Milvus** (Vector Database) + etcd, MinIO
- **Attu** (Milvus GUI Management Tool)
- **Redis** (Caching)
- **Backend Services** × 5 (Cache, Task Mixture, Zebra, Model Centric, Weavy)
- **Frontend**

## Environment Variables

Key environment variables in the `.env` file:

### Required Environment Variables

```env
# OpenAI API Key (required for Weavy service)
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Hugging Face Token (required for model downloads in grove-model-centric-service)
# Get your token at https://huggingface.co/settings/tokens
HF_TOKEN=hf_your-token-here
```

### Optional Environment Variables

```env
# Redis settings (default: redis:6379)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# Milvus settings (default: milvus:19530)
MILVUS_HOST=milvus
MILVUS_PORT=19530
MILVUS_URI=http://milvus:19530

# Service ports (recommended to use defaults)
CACHE_SERVICE_PORT=8080
TASK_MIXTURE_PORT=8081
ZEBRA_SERVICE_PORT=8082
MODEL_CENTRIC_PORT=8083
WEAVY_PORT=8084
FRONTEND_PORT=80
```

## Key Commands

### Start and Stop

```bash
# Start the full stack (background)
docker compose up -d

# Start the full stack (with logs)
docker compose up

# Stop the full stack
docker compose down

# Stop + remove volumes (reset all data)
docker compose down -v
```

### View Logs

```bash
# Follow all service logs in real-time
docker compose logs -f

# Follow logs for a specific service
docker compose logs -f grove-cache-service
docker compose logs -f weavy

# View only the last 100 lines
docker compose logs --tail=100
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart a specific service
docker compose restart grove-cache-service

# Rebuild and restart a service
docker compose up -d --build grove-cache-service
```

### Check Status

```bash
# List running containers
docker compose ps

# Detailed status (CPU, memory usage)
docker stats

# Detailed info for a specific service
docker compose logs grove-cache-service
```

### Data Management

```bash
# List volumes
docker volume ls | grep grove

# Volume details
docker volume inspect grove_milvus-data

# Clean up unused volumes
docker volume prune

# Reset all data (caution!)
docker compose down -v
```

### Build

```bash
# Build all images
docker compose build

# Build without cache
docker compose build --no-cache

# Build a specific service
docker compose build grove-cache-service

# Parallel build (faster)
docker compose build --parallel
```

## Troubleshooting


### Port Conflict

**Symptom**: `port is already allocated` error

**Solution**:
```bash
# Check which process is using the port (macOS/Linux)
lsof -i :8080

# Change the port in the .env file
CACHE_SERVICE_PORT=18080

# Or kill the existing process
kill -9 <PID>
```

### Out of Memory

**Symptom**: Service terminated due to OOM

**Solution**:
```bash
# Check Docker memory settings (Docker Desktop)
# Settings > Resources > Memory — allocate at least 8GB

# Or run only selected services
docker compose up -d redis grove-cache-service grove-frontend
```

### Environment Variables Not Applied

**Symptom**: Default values are still being used

**Solution**:
```bash
# Verify .env file location (same directory as docker-compose.yml)
ls -la .env

# Check environment variables
docker compose config

# Rebuild and restart
docker compose down
docker compose up -d --build
```



