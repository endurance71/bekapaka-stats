#!/usr/bin/env bash
# Reputacja domeny/IP BeKaPaKa — DNS, HSTS, blacklisty, CERT.
# Użycie: ./scripts/check-reputation.sh
# Opcjonalnie na VPS: >> /var/log/bekapaka-reputation.log 2>&1

set -euo pipefail

PANEL_DOMAIN="${PANEL_DOMAIN:-panel.bekapaka.pl}"
MAIN_DOMAIN="${MAIN_DOMAIN:-bekapaka.pl}"
EXPECTED_IP="${EXPECTED_IP:-51.210.102.167}"
CERT_LIST_URL="${CERT_LIST_URL:-https://hole.cert.pl/domains/domains.txt}"

pass=0
fail=0

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

ok() {
  log "OK   $*"
  pass=$((pass + 1))
}

bad() {
  log "FAIL $*"
  fail=$((fail + 1))
}

check_dns() {
  local ip
  ip=$(dig +short "$PANEL_DOMAIN" A | head -1)
  if [[ -z "$ip" ]]; then
    bad "DNS A brak dla $PANEL_DOMAIN"
    return
  fi
  if [[ "$ip" == "$EXPECTED_IP" ]]; then
    ok "DNS $PANEL_DOMAIN -> $ip"
  else
    bad "DNS $PANEL_DOMAIN -> $ip (oczekiwano $EXPECTED_IP)"
  fi
}

check_hsts() {
  local hsts
  hsts=$(curl -fsSI "https://${PANEL_DOMAIN}/" 2>/dev/null | grep -i '^strict-transport-security:' || true)
  if [[ -n "$hsts" ]]; then
    ok "HSTS: ${hsts#strict-transport-security: }"
  else
    bad "Brak nagłówka Strict-Transport-Security na https://${PANEL_DOMAIN}/"
  fi
}

check_csp() {
  local csp
  csp=$(curl -fsSI "https://${PANEL_DOMAIN}/" 2>/dev/null | grep -i '^content-security-policy:' || true)
  if [[ -n "$csp" ]]; then
    ok "CSP obecny"
  else
    bad "Brak Content-Security-Policy na https://${PANEL_DOMAIN}/"
  fi
}

check_http_status() {
  local code
  code=$(curl -fsSo /dev/null -w '%{http_code}' "https://${PANEL_DOMAIN}/" 2>/dev/null || echo "000")
  if [[ "$code" == "200" ]]; then
    ok "HTTPS / -> $code"
  else
    bad "HTTPS / -> $code"
  fi

  code=$(curl -fsSo /dev/null -w '%{http_code}' "https://${PANEL_DOMAIN}/.well-known/security.txt" 2>/dev/null || echo "000")
  if [[ "$code" == "200" ]]; then
    ok "security.txt -> $code"
  else
    bad "security.txt -> $code"
  fi
}

check_dnsbl() {
  local ip="$1"
  local rev
  rev=$(echo "$ip" | awk -F. '{print $4"."$3"."$2"."$1}')
  local listed=0

  for bl in zen.spamhaus.org bl.spamcop.net; do
    if dig +short "${rev}.${bl}" 2>/dev/null | grep -q .; then
      bad "DNSBL $bl: LISTED ($ip)"
      listed=1
    else
      ok "DNSBL $bl: clean"
    fi
  done

  if [[ "$listed" -eq 0 ]]; then
    ok "IP $ip bez wpisów na sprawdzonych DNSBL"
  fi
}

check_cert_list() {
  local hits
  hits=$(curl -fsS "$CERT_LIST_URL" 2>/dev/null | grep -i 'bekapaka' || true)
  if [[ -z "$hits" ]]; then
    ok "Brak bekapaka na liście CERT ($CERT_LIST_URL)"
  else
    bad "Wpis CERT: $hits"
  fi
}

main() {
  log "=== BeKaPaKa reputation check ==="
  log "panel=$PANEL_DOMAIN main=$MAIN_DOMAIN expected_ip=$EXPECTED_IP"

  check_dns
  local ip
  ip=$(dig +short "$PANEL_DOMAIN" A | head -1)
  if [[ -n "$ip" ]]; then
    check_dnsbl "$ip"
  fi
  check_hsts
  check_csp
  check_http_status
  check_cert_list

  log "=== Podsumowanie: $pass OK, $fail FAIL ==="
  if [[ "$fail" -gt 0 ]]; then
    exit 1
  fi
}

main "$@"
