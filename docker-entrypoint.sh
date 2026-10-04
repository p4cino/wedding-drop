#!/bin/sh
# Wolumen /app/data moze byc zalozony przez wczesniejszy obraz dzialajacy jako root
# (named volume kopiuje wlasciciela tylko przy pierwszym utworzeniu), przez co
# uzytkownik "node" dostaje EACCES przy rename/mkdir. Naprawiamy wlasciciela
# przy kazdym starcie, a nastepnie zrzucamy uprawnienia do "node".
set -e

DATA_DIR="${DATA_DIR:-/app/data}"

if [ "$(id -u)" = "0" ]; then
	mkdir -p "$DATA_DIR/galleries" "$DATA_DIR/tus_temp"
	find "$DATA_DIR" -xdev \( ! -user node -o ! -group node \) -exec chown node:node {} +
	exec su-exec node "$@"
fi

exec "$@"
