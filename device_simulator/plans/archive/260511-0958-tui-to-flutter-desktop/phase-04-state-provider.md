# Phase 04 — DeviceProvider (State + Business Logic)

## Context Links

- Plan overview: `./plan.md`
- TUI orchestrator: `tui-app.tsx` lines 110-218 (auto-replies + key handlers)
- TCP service (Phase 3): `lib/services/tcp_client_service.dart`
- Models (Phase 2): `lib/models/log_entry.dart`, `lib/models/device_config.dart`

## Overview

- **Priority:** P1 (blocks Phases 5, 6, 7)
- **Status:** complete
- **Description:** Central `ChangeNotifier` that holds `config`, `status`, `logs`, owns the `TcpClientService`, and implements auto-reply rules (RESET/POWEROFF/VERNO/phbx). Exposes high-level intents the UI calls: `connect()`, `disconnect()`, `sendLk()`, etc. UI widgets are dumb consumers.

## Key Insights

- Source TUI puts auto-reply logic inline in the `useEffect` event handler — port verbatim into provider's stream listener.
- `MAX_LOG_ENTRIES = 500`. Trim via `if (_logs.length >= 500) _logs.removeAt(0);` before append.
- Status transitions:
  - `OFFLINE` → `CONNECTING` (when user calls `connect()`)
  - `CONNECTING` → `ONLINE` (on `Connected` event)
  - any → `OFFLINE` (on `Disconnected` event)
- On `Connected`, TUI auto-sends `sendLK(0, 0, 85)` — replicate this. Treat it as part of "device handshake" emulation.
- `appendLog` is also called for synthetic events: `connected → '→ [connected]'`, `disconnected → '! [disconnected: reason]'`, `parse_error → '! [parse error] raw'`, `error → '! [error] message]'`. Mirror exactly.
- Settings flow: TUI calls `client.disconnect()` then shows setup screen. Provider exposes `openSettings()` which disconnects + sets a flag the UI watches.
- Config change requires tearing down the existing `TcpClientService` and creating a new one (host/port/deviceId baked into constructor). Implement `_resetClient(DeviceConfig cfg)`.

## Requirements

**Functional**
- Public reactive state (private fields + getters):
  - `DeviceConfig? get config`
  - `Status get status` (default `offline`)
  - `List<LogEntry> get logs` (unmodifiable view)
  - `bool get showSettings` — true when no config OR user pressed Settings.
- Public intents:
  - `void applyConfig(DeviceConfig cfg)` — replaces service, clears logs, hides settings.
  - `Future<void> connect()` — only when `offline`; sets `connecting`, calls service.
  - `void disconnect()`
  - `void clearLogs()`
  - `void openSettings()` — disconnects, sets `showSettings = true`.
  - `void sendLk({int steps=0, int overturn=0, int battery=85})`, `void sendBphrt({int high=120, int low=80, int hr=72, int height=170, int gender=1, int age=30, int weight=65})`, `void sendOxygen({int flag=0, int value=98})`, `void sendBtemp2({int type=0, double temp=36.6})`, `void sendPhbxOk()`, `void sendPhbxFail()` — each guarded by `status == online`. UI passes user-entered values; defaults pre-fill the fields. <!-- Updated: Validation Session 1 - send methods accept params instead of hardcoded defaults -->
- Auto-reply rules on `Received(command, raw)`:
  - `RESET` → `sendRESET()`
  - `POWEROFF` → `sendPOWEROFF()`
  - `VERNO` → `sendVERNO()`
  - `phbx` → `sendPhbx(1)`
- On `Connected`: set `online`, append `→ [connected]`, auto-`sendLK(0, 0, 85)`.
- On `Disconnected(reason)`: set `offline`, append `! [disconnected: reason]`.
- On `Sent(raw)`: append `→ raw`.
- On `Received(_, raw)`: append `← raw` (auto-replies happen after).
- On `ParseError(raw)`: append `! [parse error] raw`.
- On `ErrorEvent(message)`: append `! [error] message`.

**Non-functional**
- File ≤ 200 LOC. No `command_defaults.dart` needed — defaults live as named parameter defaults in method signatures. <!-- Updated: Validation Session 1 - defaults expressed as named param defaults, not constants file -->
- `dispose()` cancels stream subscription and disposes service.

## Architecture

```dart
class DeviceProvider extends ChangeNotifier {
  DeviceConfig? _config;
  Status _status = Status.offline;
  final List<LogEntry> _logs = [];
  bool _showSettings = true;
  int _nextLogId = 0;

  TcpClientService? _service;
  StreamSubscription<ClientEvent>? _sub;

  // getters, intents, _appendLog, _onEvent, _resetClient, dispose
}
```

Provider is created once at app root (Phase 7) — single instance per app session.

## Related Code Files

**Create**
- `lib/providers/device_provider.dart`
- (optional) `lib/providers/command_defaults.dart` — default payload constants if needed.

**Modify**
- None at this phase (wiring into `main.dart` happens in Phase 7).

**Delete**
- None.

## Implementation Steps

1. Skeleton `class DeviceProvider extends ChangeNotifier` with private fields + getters listed above.
2. `_appendLog(LogDirection dir, String raw)`:
   ```dart
   if (_logs.length >= 500) _logs.removeAt(0);
   _logs.add(LogEntry(id: _nextLogId++, ts: formatTimestamp(DateTime.now()), direction: dir, raw: raw));
   notifyListeners();
   ```
3. `_resetClient(DeviceConfig cfg)`:
   - Cancel old sub, dispose old service.
   - Create new `TcpClientService(host: cfg.host, port: cfg.port, deviceId: cfg.deviceId)`.
   - Subscribe to `_service!.events` → `_onEvent`.
4. `_onEvent(ClientEvent e)` exhaustive switch:
   - `Connected` → `_status = Status.online; _appendLog(sent, '[connected]'); _service!.sendLK(0, 0, 85); notifyListeners();`
   - `Disconnected(reason)` → `_status = Status.offline; _appendLog(alert, '[disconnected: $reason]'); notifyListeners();`
   - `Sent(raw)` → `_appendLog(sent, raw);`
   - `Received(command, raw)` → `_appendLog(received, raw);` then if command in {RESET, POWEROFF, VERNO, phbx} → fire corresponding service method.
   - `ParseError(raw)` → `_appendLog(alert, '[parse error] $raw');`
   - `ErrorEvent(message)` → `_appendLog(alert, '[error] $message');`
5. Implement intents — each delegates to `_service?.sendXxx()` after guard:
   ```dart
   void sendLk() { if (_status == Status.online) _service?.sendLK(0, 0, 85); }
   void sendBphrt() { if (_status == Status.online) _service?.sendBPHRT(120, 80, 72, 170, 1, 30, 65); }
   void sendOxygen() { if (_status == Status.online) _service?.sendOxygen(1, 98); }
   void sendBtemp2() { if (_status == Status.online) _service?.sendBtemp2(0, 36.6); }
   void sendPhbxOk() { if (_status == Status.online) _service?.sendPhbx(1); }
   void sendPhbxFail() { if (_status == Status.online) _service?.sendPhbx(0); }
   ```
6. `connect()`: `if (_status == Status.offline && _service != null) { _status = Status.connecting; notifyListeners(); await _service!.connect(); }`.
7. `disconnect()`: `_service?.disconnect();`.
8. `openSettings()`: `disconnect(); _showSettings = true; notifyListeners();`.
9. `applyConfig(DeviceConfig cfg)`: `_config = cfg; _logs.clear(); _showSettings = false; _resetClient(cfg); notifyListeners();`.
10. `clearLogs()`: `_logs.clear(); notifyListeners();`.
11. `dispose()`: cancel sub, dispose service, then `super.dispose()`.
12. `flutter analyze` clean.

## Todo List

- [ ] Create `lib/providers/device_provider.dart` skeleton
- [ ] Implement `_appendLog` with 500-entry cap
- [ ] Implement `_resetClient` + event subscription
- [ ] Implement `_onEvent` with all 6 event types + auto-replies (RESET / POWEROFF / VERNO / phbx)
- [ ] Implement all 6 send intents with online guard
- [ ] Implement `connect/disconnect/openSettings/applyConfig/clearLogs/dispose`
- [ ] `flutter analyze` clean

## Success Criteria

- Provider compiles and unit-instantiable.
- All TUI event-handler branches in `tui-app.tsx` lines 131-164 are accounted for.
- All TUI input-handler branches in `tui-app.tsx` lines 171-218 map to a public intent.
- Log buffer never exceeds 500 entries.

## Risk Assessment

- **Re-entrant `notifyListeners`**: auto-reply triggers `sendXxx` → `Sent` event → `_appendLog` → another `notifyListeners`. Stream events are async (microtask boundary) so this is safe; verify in Phase 7 manual run.
- **Stream subscription leak on config change** — `_resetClient` MUST cancel old `_sub` before creating new one. Easy to miss.
- **Status race on quick reconnect**: user spams Connect. Guard `status == offline` prevents double-connect.

## Security Considerations

- No new attack surface vs Phase 3.

## Next Steps

- Unblocks Phase 5 (SetupScreen uses `applyConfig`) and Phase 6 (MainScreen consumes state + calls intents).
