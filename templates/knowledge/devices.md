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
     - Research the latest OS version first (e.g., `xcrun simctl list runtimes`)
     - Start with 3 devices unless human requests otherwise
     - Naming format: "(Proofrun-only) <Device Name>"
       e.g., "(Proofrun-only) iPhone 17 Pro Max"
     - Form factor variety: large phone (latest gen), small phone (prior gen), tablet
     - Use later-generation devices (e.g., iPhone 17 + iPhone 16, not iPhone 12)
     - If you frequently find all devices locked, propose increasing the pool size

     Example entry:
     - (Proofrun-only) iPhone 17 Pro Max — UDID: B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466, iOS 26.2
-->

## Device Lifecycle

<!-- Agent: Follow this lifecycle for each verification session:

  1. **Check availability**: Run `proofrun device status` to see which devices are free
  2. **Boot the device**: Start the simulator/emulator if not already running
  3. **Lock the device**: `proofrun session start` locks it automatically via global lock
  4. **Use the device**: Build, install, interact, verify
  5. **Release the lock**: `proofrun session stop` releases the lock
  6. **Shut down after verification**: Once feedback is received (LGTM or addressed),
     shut down the simulator/emulator to free system RAM.
     Do NOT leave devices running after verification is complete.

  If a device shows as locked:
  - Check `proofrun device status --device <id>` for details
  - If stale: use `--force-unlock` to take over
  - If active: ask human for approval before force-unlocking
-->

## Device Cleanup

<!-- Agent: After verification is complete and feedback is received:
  1. Check `proofrun device status` — only clean up devices that are FREE
  2. If the device is free, shut down the simulator/emulator to free system RAM
  3. Do NOT shut down a device that is locked by another session
  4. Do NOT leave devices running after verification is complete
-->
