#!/usr/bin/env bash
# Start / restart / stop / check the insclix-wizard Vite dev server (SvelteKit SPA).
# Port 5180 — chosen to stay clear of the machine-wide allocations
# (claims-forms Vite 5173, BCP/claims 8083, AWP 8084, GWT codeserver 9876).
set -u
PORT="${WIZARD_PORT:-5180}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
LOG="$ROOT/.claude/skills/start-dev/dev.log"
URL="http://localhost:$PORT/"

pid_on_port() {
	# Windows (Git Bash): netstat lists LISTENING pids; elsewhere fall back to lsof
	if command -v netstat >/dev/null 2>&1 && [ "${OS:-}" = "Windows_NT" ]; then
		netstat -ano 2>/dev/null | awk -v p=":$PORT" '$2 ~ p"$" && $4 == "LISTENING" {print $5; exit}'
	else
		lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null | head -1
	fi
}

is_ours() {
	# never kill another project's server on this port
	local pid="$1"
	if [ "${OS:-}" = "Windows_NT" ]; then
		powershell.exe -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=$pid').CommandLine" 2>/dev/null | grep -qi "insclix-wizard\|vite"
	else
		ps -o args= -p "$pid" 2>/dev/null | grep -qi vite
	fi
}

healthy() { [ "$(curl -s -o /dev/null -w '%{http_code}' "$URL")" = "200" ]; }

status() {
	local pid; pid="$(pid_on_port)"
	if healthy; then echo "wizard  UP    $URL (pid ${pid:-?})"; else echo "wizard  DOWN  $URL"; fi
}

stop() {
	local pid; pid="$(pid_on_port)"
	[ -z "$pid" ] && { echo "wizard  not running"; return 0; }
	if is_ours "$pid"; then
		if [ "${OS:-}" = "Windows_NT" ]; then taskkill //PID "$pid" //T //F >/dev/null 2>&1; else kill "$pid"; fi
		echo "wizard  stopped (pid $pid)"
	else
		echo "port $PORT is held by another process (pid $pid) — not touching it" >&2
		return 1
	fi
}

start() {
	if healthy; then status; return 0; fi
	[ -n "$(pid_on_port)" ] && { echo "port $PORT busy but not answering; run --restart" >&2; return 1; }
	cd "$ROOT" || exit 1
	[ -d node_modules ] || npm install
	nohup npx vite dev --port "$PORT" --strictPort > "$LOG" 2>&1 &
	for _ in $(seq 1 60); do
		healthy && { status; return 0; }
		sleep 1
	done
	echo "wizard  FAILED to answer on $URL — see $LOG" >&2
	tail -20 "$LOG" >&2
	return 1
}

case "${1:-}" in
	--status) status ;;
	--stop) stop ;;
	--restart) stop; sleep 1; start ;;
	*) start ;;
esac
