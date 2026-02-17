## Nobe Omniscope Control

Triggers channels in Nobe Omniscope over websocket.

### Configuration

- `Target IP`: IP address of the machine running Nobe Omniscope.
- `Target Port`: websocket port (default `4475`).

### Action

- `Trigger Channel`: Sends channel triggers `1-32` to Nobe Omniscope.

### Connection behavior

- Automatic reconnect is enabled.
- If OmniScope starts after Companion, the module retries until it connects.
- If OmniScope restarts or crashes, the module reconnects automatically.

### Troubleshooting

- If the connection editor shows `No config data loaded`, install dependencies with `npm install` in the module directory and restart Companion.
