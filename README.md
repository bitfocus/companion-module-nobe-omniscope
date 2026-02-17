# companion-module-nobe-omniscope

Bitfocus Companion module for triggering Nobe OmniScope channels over websocket.

## Status

This repository now includes a Companion v4 module runtime implementation:

- entrypoint: `main.js`
- manifest: `companion/manifest.json`
- runtime base: `@companion-module/base`

The legacy `index.js` implementation is kept in the repository for reference, but Companion v4 uses the manifest + `main.js` path.

## Features

- Trigger OmniScope channels `1-32`
- Configurable target host and port (default `4475`)
- Automatic websocket reconnect with exponential backoff
- Safe socket lifecycle handling during reconnects and config updates

## Configuration

- `Target IP`: IP address of the system running OmniScope websocket server
- `Target Port`: websocket port (`4475` by default)

## Action

- `Trigger Channel`: sends channel trigger payload to OmniScope

Payload format:

```json
{ "event": "testEvent", "action": 0 }
```

`action` uses zero-based channel numbering (`0-31`) matching OmniScope websocket behavior.

## Development (Companion v4 dev modules)

1. Install module dependencies:

```sh
npm install
```

2. Point Companion `dev_modules_path` to a parent directory containing this module folder.
3. Restart Companion and add the `Nobe: Omniscope (Dev)` connection.

If Companion shows `No config data loaded` for this module, check dependencies are installed and restart Companion.

## Validation Checklist

1. Start Companion while OmniScope is not running.
2. Verify module stays in reconnecting/warning state.
3. Start OmniScope and verify module transitions to connected automatically.
4. Restart OmniScope and verify module reconnects without manual disable/enable cycle.

## License

See [LICENSE](./LICENSE).
