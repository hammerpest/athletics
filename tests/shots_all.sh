#!/bin/bash
# Shoots every size and theme, four at a time. Usage: tests/shots_all.sh <python> <page url> <output folder>
printf '%s\n' ipad-land-light ipad-land-dark ipad-port-light ipad-port-dark macbook-light macbook-dark phone-light phone-dark |
  xargs -P 4 -I{} "$1" tests/shots.py "$2" "$3" {} 2>&1 | grep -v "^done\|^ERRORS \[\]$"
