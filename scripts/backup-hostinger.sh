#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
APP_DIR="${APP_DIR:-$HOME/domains/gliznowo.pl/nodejs}"
DATE="$(date +%F-%H%M)"

mkdir -p "$BACKUP_DIR"

if [[ -z "${MYSQL_USER:-}" || -z "${MYSQL_DATABASE:-}" ]]; then
  echo "Ustaw MYSQL_USER i MYSQL_DATABASE przed uruchomieniem skryptu."
  exit 1
fi

mysqldump -u "$MYSQL_USER" -p "$MYSQL_DATABASE" > "$BACKUP_DIR/maszyny-db-$DATE.sql"

if [[ -d "$APP_DIR/public/uploads" ]]; then
  tar -czf "$BACKUP_DIR/maszyny-uploads-$DATE.tar.gz" -C "$APP_DIR/public" uploads
fi

echo "Backup zapisany w: $BACKUP_DIR"
