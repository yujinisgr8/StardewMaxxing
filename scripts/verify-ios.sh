#!/usr/bin/env bash
# Builds the Swift engine + parity runner and checks it against the shared golden fixtures.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
xcrun swiftc -O -o "$OUT/parity" ios/StardewMaxxing/Engine/*.swift ios/ParityCheck/main.swift
"$OUT/parity" shared
