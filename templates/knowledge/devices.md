---
name: Devices
description: How to manage simulators, emulators, and devices for verification.
  Read when setting up the verification environment or acquiring a device.
---

## Device Management Policy

<!-- Agent: On first use, ask the human which device management approach they prefer:

  1. (Recommended) **Dedicated pool** — Create simulators/emulators specifically for proofrun,
     named with "(Proofrun-only)" prefix. Only these devices are used for verification.
     No risk of conflicts with human work or other agents.

  2. **Use available** — Pick whatever device is available each time.
     Risk: may conflict with other agents or human work.
     Agent must ask human approval before each device use.

  Record the choice below so all future agents follow it. -->

Policy: <!-- dedicated-pool | use-available — set after human chooses -->

## Device Pool

<!-- Agent: After creating dedicated devices, list them here with identifiers.
     Only relevant if policy is "dedicated-pool".

     When creating a pool, follow these principles:
     - Start with 3 devices per platform unless human requests otherwise
     - Naming format: "(Proofrun-only) <Device Name>"
     - Form factor variety: large phone (latest gen), small phone (prior gen), tablet
     - Use later-generation devices
     - If you frequently find all devices locked, propose increasing the pool size -->

### iOS Simulators

<!-- Agent: Research the latest iOS version first (e.g., `xcrun simctl list runtimes`).
     Create simulators using the interaction tool or `xcrun simctl create`.

     Example entries:
     - (Proofrun-only) iPhone 17 Pro Max — UDID: B1DBC6F9-..., iOS 26.2
     - (Proofrun-only) iPhone 16 — UDID: A2CDC7E8-..., iOS 26.2
     - (Proofrun-only) iPad Air 11-inch — UDID: F6CD502D-..., iOS 26.2
-->

### Android Emulators

<!-- Agent: Research the latest Android API level first.
     Download system images and create AVDs:

     1. Download a system image:
        sdkmanager --install "system-images;android-<API>;google_apis;arm64-v8a"
        (use arm64-v8a on Apple Silicon, x86_64 on Intel)

     2. Accept licenses non-interactively:
        yes | sdkmanager --licenses

     3. Create AVDs non-interactively:
        echo "no" | avdmanager create avd \
          --name "(Proofrun-only) Pixel 9 Pro" \
          --package "system-images;android-<API>;google_apis;arm64-v8a" \
          --device "pixel_9_pro" --force

     Use Pixel device profiles for form factor variety:
     - Large phone: pixel_9_pro or pixel_8_pro
     - Small phone: pixel_8a or pixel_7a
     - Tablet: pixel_tablet

     Example entries:
     - (Proofrun-only) Pixel 9 Pro — AVD: Proofrun-only_Pixel_9_Pro, API 36
     - (Proofrun-only) Pixel 8a — AVD: Proofrun-only_Pixel_8a, API 36
     - (Proofrun-only) Pixel Tablet — AVD: Proofrun-only_Pixel_Tablet, API 36
-->

### Web Browser

<!-- Agent: Web browser sessions are ephemeral — no persistent device to manage.
     The agent-browser tool manages its own browser lifecycle.
     No AVD/simulator creation is needed.

     For proofrun session locking, use a logical device identifier:
     - chromium-mobile — for Chromium device emulation
     - safari-ios-sim — for real Mobile Safari via iOS Simulator
-->

## Device Lifecycle

<!-- Agent: Follow this lifecycle for each verification session:

  1. **Check availability**: Run `proofrun device status` to see which devices are free
  2. **Boot the device**: Start the simulator/emulator if not already running
     - iOS: Use the interaction tool or `xcrun simctl boot <UDID>`
     - Android: Use the interaction tool or `emulator -avd <name>`,
       then `adb wait-for-device` to confirm boot
     - Web: No boot needed — agent-browser manages the browser lifecycle
  3. **Lock the device**: `proofrun session start` locks it automatically via global lock
  4. **Use the device**: Build, install, interact, verify
  5. **Release the lock**: `proofrun session stop` releases the lock
  6. **Shut down after verification**: Once feedback is received (LGTM or addressed),
     shut down the device to free system RAM.
     - iOS: `xcrun simctl shutdown <UDID>`
     - Android: `adb emu kill`
     - Web: `agent-browser close`
     Do NOT leave devices running after verification is complete.

  If a device shows as locked:
  - Check `proofrun device status --device <id>` for details
  - If stale: use `--force-unlock` to take over
  - If active: ask human for approval before force-unlocking

  To delete a device:
  - iOS: `xcrun simctl delete <UDID>`
  - Android: `avdmanager delete avd --name <name>`
-->

## Device Cleanup

<!-- Agent: After verification is complete and feedback is received:
  1. Check `proofrun device status` — only clean up devices that are FREE
  2. If the device is free, shut it down to free system RAM:
     - iOS: `xcrun simctl shutdown <UDID>`
     - Android: `adb emu kill`
     - Web: `agent-browser close` (if session still open)
  3. Do NOT shut down a device that is locked by another session
  4. Do NOT leave devices running after verification is complete
-->
