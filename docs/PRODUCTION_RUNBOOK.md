# Production Runbook: Corporate Travel Analytics

## 1. Quick Start Commands

### Local Development Startup
```bash
# Backend startup
cd backend
python -m uvicorn main:app --reload --port 8000

# Frontend startup
cd frontend
npm run dev -- --port 5173
```

### Docker Container Startup
```bash
docker compose up -d --build
```

---

## 2. Testing & Verification Runbook
```bash
# 1. Run all unit and integration tests
pytest

# 2. Run master 20-point production readiness verification
python scripts/verify_production_readiness.py

# 3. Compile frontend production bundle
npm --prefix frontend run build
```

---

## 3. Production Health Monitoring
- Verify API status: `curl https://corporate-travel-analytics.onrender.com/health`
- Verify DB status: `curl https://corporate-travel-analytics.onrender.com/health/db`
- Inspect live metrics: `curl https://corporate-travel-analytics.onrender.com/api/metrics`
