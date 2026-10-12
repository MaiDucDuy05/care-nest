# Phase 05 — SetupScreen

## Context Links

- Plan overview: `./plan.md`
- Source: `tui-app.tsx` lines 48-108 (`SetupScreen`)
- Provider intent: `DeviceProvider.applyConfig(DeviceConfig)`

## Overview

- **Priority:** P2 (blocks Phase 7)
- **Status:** complete
- **Description:** Initial config screen with three fields (host, port, deviceId) and a Start button. Persists config to `shared_preferences` so the app boots into MainScreen on subsequent launches.

## Key Insights

- TUI defaults: host=`127.0.0.1`, port=`12345`, deviceId=`1378365340`. Mirror.
- TUI validation:
  - host: non-empty after trim.
  - port: integer 1-65535.
  - deviceId: regex `^\d{10,15}$`.
- `shared_preferences` is async; persistence happens on Start (after validation). Loading the prior config happens once at app bootstrap (Phase 7) before deciding which screen to show.
- KISS: single `Form` with `TextFormField` + `validator` per field. No need for "edit mode" UX from the TUI — desktop UX is direct typing.
- Validators reuse pure functions defined alongside (or imported from) `device_config.dart` to keep DRY with future tests.

## Requirements

**Functional**
- Three labeled `TextFormField`s pre-filled with current `provider.config` if present, else `DeviceConfig.defaults`.
- "Start" elevated button submits form: validates → builds `DeviceConfig` → `provider.applyConfig(cfg)` → persist to `SharedPreferences` key `device_config_v1`.
- Pressing Enter inside any field submits (Flutter `TextInputAction.done`).
- Validation error shown beneath field via `validator` returning message.
- Title `Mock Device Simulator — Setup`.
- Dark theme, consistent with rest of app.

**Non-functional**
- File ≤ 200 LOC.
- No business logic — only form state + call to provider.

## Architecture

```
lib/screens/setup_screen.dart  — StatefulWidget, owns TextEditingControllers + GlobalKey<FormState>
lib/services/config_storage.dart  — SharedPreferences load/save helpers (small, ~30 LOC)
```

`ConfigStorage`:
- `Future<DeviceConfig?> load()` — read JSON string from key, decode, validate; return null on miss/parse-error.
- `Future<void> save(DeviceConfig cfg)` — encode JSON, write.

Validators (pure):
```dart
String? validateHost(String? v) => (v?.trim().isEmpty ?? true) ? 'Host cannot be empty' : null;
String? validatePort(String? v) { final n = int.tryParse(v?.trim() ?? ''); return (n == null || n < 1 || n > 65535) ? 'Port must be 1-65535' : null; }
String? validateDeviceId(String? v) => RegExp(r'^\d{10,15}$').hasMatch(v?.trim() ?? '') ? null : 'Must be 10-15 digits';
```

Place validators inside `device_config.dart` as static methods to keep them with the model (DRY across this phase + tests).

## Related Code Files

**Create**
- `lib/screens/setup_screen.dart`
- `lib/services/config_storage.dart`

**Modify**
- `lib/models/device_config.dart` — add static validators (`DeviceConfig.validateHost` etc.) if not added in Phase 2.

**Delete**
- None.

## Implementation Steps

1. **`config_storage.dart`**
   - `static const _key = 'device_config_v1';`
   - `Future<DeviceConfig?> load() async { final prefs = await SharedPreferences.getInstance(); final raw = prefs.getString(_key); if (raw == null) return null; try { return DeviceConfig.fromJson(jsonDecode(raw) as Map<String, dynamic>); } catch (_) { return null; } }`
   - `Future<void> save(DeviceConfig cfg) async { final prefs = await SharedPreferences.getInstance(); await prefs.setString(_key, jsonEncode(cfg.toJson())); }`
2. **`setup_screen.dart`**
   - `StatefulWidget`. `initState`: read `context.read<DeviceProvider>().config ?? DeviceConfig.defaults` and populate three `TextEditingController`s.
   - Scaffold with `AppBar(title: Text('Mock Device Simulator — Setup'))` and centered `Card` (max width ~480) holding the Form.
   - Inside Form: 3 `TextFormField`s (host, port keyboard=`number`, deviceId keyboard=`number`), each with `decoration: InputDecoration(labelText:..., border: OutlineInputBorder())` and `validator`.
   - `FilledButton(onPressed: _onStart, child: Text('Start'))`.
   - `_onStart` async:
     ```dart
     if (!_formKey.currentState!.validate()) return;
     final cfg = DeviceConfig(host: _host.text.trim(), port: int.parse(_port.text.trim()), deviceId: _device.text.trim());
     await _storage.save(cfg);
     if (!mounted) return;
     context.read<DeviceProvider>().applyConfig(cfg);
     ```
   - `dispose` controllers.
3. Hint text under form: `'Defaults: 127.0.0.1:12345 · 1378365340'`.
4. Run `flutter analyze`.

## Todo List

- [ ] Add validator statics to `DeviceConfig` (if not done in Phase 2)
- [ ] Create `lib/services/config_storage.dart` with load/save
- [ ] Create `lib/screens/setup_screen.dart` with Form + 3 fields + Start
- [ ] Wire Start → `applyConfig` + persistence
- [ ] `flutter analyze` clean
- [ ] Manual: launch app, type values, press Start, verify provider state changes

## Success Criteria

- Empty host shows "Host cannot be empty" inline.
- Port `99999` shows "Port must be 1-65535".
- DeviceId `123` shows "Must be 10-15 digits".
- Valid submit triggers `applyConfig` (verified by `showSettings` becoming false) and writes prefs.
- Re-launching the app (Phase 7 bootstrap) reads the saved config and skips SetupScreen.

## Risk Assessment

- **shared_preferences plugin on Linux/Windows** — supported. macOS supported.
- **JSON shape drift** — versioned key `device_config_v1` makes future migration safe.

## Security Considerations

- Stored config contains no secrets — host/port/deviceId are non-sensitive.

## Next Steps

- Pair with Phase 6 to complete the UI. Phase 7 wires the bootstrap routing.
