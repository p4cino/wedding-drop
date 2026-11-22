#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/data}"

if ! mkdir -p "$DATA_DIR/galleries" "$DATA_DIR/tus_temp" 2>/dev/null || [ ! -w "$DATA_DIR" ]; then
	echo "[ERROR] Brak uprawnień zapisu w katalogu danych '$DATA_DIR' dla użytkownika $(id -un) ($(id -u):$(id -g))." >&2
	echo "[ERROR] Jeśli migrujesz wolumen utworzony przed v1.3, uruchom jednorazowo: docker run --rm -v wedding-drop_app_data:/data alpine chown -R 1000:1000 /data" >&2
	exit 1
fi

exec "$@"
