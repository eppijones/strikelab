#!/usr/bin/env bash
#
# Install the latest StrikeLab Caddie build onto the paired iPhone + Watch.
#
# Prereqs (one-time, done via Xcode):
#   1. Apple ID added in Xcode (Settings → Accounts).
#   2. Both targets ("StrikeLabCaddie" and "StrikeLabCaddieWatch Watch App")
#      have "Automatically manage signing" enabled with a Personal Team.
#   3. Developer Mode enabled on the iPhone
#      (Settings → Privacy & Security → Developer Mode).
#   4. Run the project once from Xcode so the provisioning profile is created.
#
# Usage:
#   ./install_to_devices.sh
#
# Notes:
#   - Free Personal Team certificates expire after 7 days. After that, run
#     this script again — `xcodebuild` will refresh the profile through the
#     Apple ID configured in Xcode.

set -euo pipefail

cd "$(dirname "$0")"

# Detect the paired iPhone identifier dynamically so this works after a
# new device is paired or the UDID changes (Apple rotates them on factory
# resets).
IPHONE_ID="$(xcrun devicectl list devices 2>/dev/null \
  | awk '/iPhone/ && /paired/ {print $(NF-2)}' \
  | head -n 1)"

if [[ -z "${IPHONE_ID}" ]]; then
  echo "❌ No paired iPhone found. Plug in the phone, unlock it, trust this Mac, and try again."
  exit 1
fi

echo "📱 Installing on iPhone: ${IPHONE_ID}"
echo

# Build + install onto the device. Xcode embeds the watch target alongside
# the iPhone app, so the watch install propagates automatically once the
# phone is updated.
xcodebuild \
  -project StrikeLabCaddie.xcodeproj \
  -scheme StrikeLabCaddie \
  -destination "id=${IPHONE_ID}" \
  -configuration Debug \
  -allowProvisioningUpdates \
  build install

echo
echo "✅ Done. Open StrikeLab Caddie on the iPhone — the Watch app should follow within ~30s."
