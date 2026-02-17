# Companion v4 Migration Notes

## Summary

This module was migrated to Companion v4 runtime format and validated against Companion 4.2.x.

## Runtime Migration

### Added

- `main.js` (Companion v4 runtime entrypoint)
- `companion/manifest.json` (module manifest)
- `companion/HELP.md` (module help shown in Companion)

### Updated

- `package.json`
  - `name` set to `companion-module-nobe-omniscope`
  - `main` set to `main.js`
  - dependencies added:
    - `@companion-module/base`
    - `ws`

## Behavioral Improvements

The v4 runtime includes websocket resilience improvements:

- automatic reconnect on close/error
- exponential reconnect backoff
- socket cleanup during config changes/destroy
- guarded send behavior when socket is disconnected

## Companion Manifest Requirements

The manifest uses Companion v4 plugin runtime metadata:

- `runtime.type = node18`
- `runtime.api = nodejs-ipc`
- `runtime.apiVersion = 1.13.0`
- `runtime.entrypoint = ../main.js`

These fields are required for Companion to load the module correctly as a dev module.

## Local Dev Module Setup

1. Run `npm install` in this repository.
2. Set Companion `dev_modules_path` to a directory containing this module folder.
3. Restart Companion.
4. Add/enable `Nobe: Omniscope (Dev)`.

## Troubleshooting

### `No config data loaded`

Most common causes:

1. Dependencies not installed (`npm install` missing)
2. Companion not restarted after dependency install
3. Wrong dev module path (must point to parent directory containing the module)

### `Cannot find module '@companion-module/base/package.json'`

Run `npm install` in the module directory and restart Companion.

## Test Matrix

Validate at minimum:

1. Companion starts before OmniScope.
2. OmniScope starts later and module auto-connects.
3. OmniScope restarts/crashes and module auto-reconnects.
4. Channel action sends correctly after reconnect.
