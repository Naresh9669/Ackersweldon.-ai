#!/bin/bash

# MongoDB Database Backup Script for ACKERS WELDON Dashboard
# This script creates daily backups of the MongoDB database with retention

set -euo pipefail

# Configuration
BACKUP_DIR="/home/ubuntu/backups/mongodb"
DB_NAME="dashboard_db"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="dashboard_aw_backup_${TIMESTAMP}"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a /var/log/mongodb-backup.log
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log "🔄 Starting MongoDB backup for database: ${DB_NAME}"

# Check if MongoDB is running
MONGO_CONTAINER="aw_scraper-main_mongodb_1"
if ! docker ps | grep -q "${MONGO_CONTAINER}"; then
    log "❌ MongoDB container (${MONGO_CONTAINER}) is not running"
    exit 1
fi

# Create the backup using mongodump via docker exec
log "📦 Creating backup: ${BACKUP_NAME}"

# Run mongodump inside the MongoDB container
if docker exec "${MONGO_CONTAINER}" mongodump --db "${DB_NAME}" --out "/tmp/backup_${TIMESTAMP}"; then
    log "✅ Mongodump completed successfully"
else
    log "❌ Mongodump failed"
    exit 1
fi

# Copy the backup from container to host
if docker cp "${MONGO_CONTAINER}:/tmp/backup_${TIMESTAMP}/${DB_NAME}" "${BACKUP_DIR}/${BACKUP_NAME}"; then
    log "✅ Backup copied to host: ${BACKUP_DIR}/${BACKUP_NAME}"
else
    log "❌ Failed to copy backup from container"
    exit 1
fi

# Clean up temporary backup in container
docker exec "${MONGO_CONTAINER}" rm -rf "/tmp/backup_${TIMESTAMP}"

# Compress the backup
log "🗜️ Compressing backup..."
cd "${BACKUP_DIR}"
if tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"; then
    rm -rf "${BACKUP_NAME}"
    log "✅ Backup compressed: ${BACKUP_NAME}.tar.gz"
else
    log "❌ Failed to compress backup"
    exit 1
fi

# Calculate backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
log "📊 Backup size: ${BACKUP_SIZE}"

# Remove old backups (older than retention period)
log "🧹 Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "dashboard_aw_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
REMAINING_BACKUPS=$(find "${BACKUP_DIR}" -name "dashboard_aw_backup_*.tar.gz" | wc -l)
log "📁 Remaining backups: ${REMAINING_BACKUPS}"

# Verify backup integrity
log "🔍 Verifying backup integrity..."
if tar -tzf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" > /dev/null; then
    log "✅ Backup integrity verified"
else
    log "❌ Backup integrity check failed"
    exit 1
fi

# Log completion
log "🎉 Backup completed successfully: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# Optional: Send backup status to monitoring endpoint (if configured)
if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
    curl -X POST "${BACKUP_WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -d "{\"status\":\"success\",\"backup\":\"${BACKUP_NAME}.tar.gz\",\"size\":\"${BACKUP_SIZE}\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        --connect-timeout 10 --max-time 30 || log "⚠️ Failed to send webhook notification"
fi

log "✅ Database backup process completed"
