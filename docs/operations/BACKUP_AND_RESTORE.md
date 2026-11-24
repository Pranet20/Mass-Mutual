# Operations: Backup and Disaster Recovery Runbook

## 1. Backup Strategy
- **Frequency**: Daily automated logical backups via `pg_dump`.
- **Retention**: 30 daily snapshots, 12 monthly archives, 7 annual snapshots (to satisfy statutory financial audit retention).
- **Storage**: Offsite encrypted cloud bucket with versioning and object lock.

---

## 2. Backup Execution Command
```bash
# Automated PostgreSQL Backup Command
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -Fc -f "/backups/travel_analytics_$(date +%Y%m%d_%H%M%S).dump"
```

---

## 3. Restoration Procedure
```bash
# 1. Stop web application traffic
docker stop travel_analytics_web

# 2. Restore database from specified dump file
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME --clean --if-exists "/backups/travel_analytics_TARGET_TIMESTAMP.dump"

# 3. Verify database integrity
python scripts/verify_production_readiness.py

# 4. Restart web service
docker start travel_analytics_web
```
