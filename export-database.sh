#!/bin/bash
# Database Export Script for astruXo
# Run this to export your Neon PostgreSQL database

echo "📦 astruXo Database Export"
echo "=========================="
echo ""

# Get DATABASE_URL from environment or prompt
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not found in environment"
    echo "Please enter your Neon database connection string:"
    read -s DATABASE_URL
    echo ""
fi

# Create backup filename with timestamp
BACKUP_FILE="astruxo-backup-$(date +%Y%m%d-%H%M%S).sql"

echo "📥 Exporting database to: $BACKUP_FILE"
echo ""

# Export database
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database exported successfully!"
    echo "📁 File: $BACKUP_FILE"
    echo ""
    echo "📊 Database size:"
    du -h "$BACKUP_FILE"
else
    echo ""
    echo "❌ Export failed!"
    echo "Make sure pg_dump is installed: brew install postgresql"
    exit 1
fi
