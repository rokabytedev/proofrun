---
name: Simulators
description: Available iOS simulator devices and how to manage them. Read when setting up the verification environment.
---

## Managing Simulators

List available simulator runtimes:
```
xcrun simctl list devices available
```

Boot a simulator:
```
xcrun simctl boot "<device-name>"
```

Install the app (requires a .app build):
```
xcrun simctl install booted <path-to-app>
```

Launch the app:
```
xcrun simctl launch booted <bundle-id>
```

## Device Recommendations

For verification, use a mix of screen sizes to catch layout issues:
- **Default**: iPhone 16 Pro (standard size)
- **Narrow**: iPhone SE (3rd generation) (small screen)
- **Wide**: iPhone 16 Pro Max (large screen)
- **Tablet**: iPad Pro 13-inch (M4) (tablet layout)

## Connecting iosef

After booting a simulator, connect iosef:
```
iosef connect "<device-name>" --local
```

<!-- Agent: add project-specific simulator notes below (device IDs, build paths, known issues) -->
