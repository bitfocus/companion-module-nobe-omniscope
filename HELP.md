## Nobe Omniscope Control

Trigger OmniScope channels from Companion over websocket.

### Configuration

- `Target IP`: host running OmniScope
- `Target Port`: websocket port (`4475` by default)

### Action

- `Trigger Channel (1-32)`

### Notes

- The module sends payloads in the OmniScope format:
  - `{"event":"testEvent","action":<0-31>}`
- Connection automatically retries after OmniScope restarts or temporary disconnects.
