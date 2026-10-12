# Phase 02 — Models & Wonlex Protocol

## Context Links

- Plan overview: `./plan.md`
- Source protocol: `/Volumes/work/Care-Nest-MVP/care-nest/mock-device/src/wonlex-protocol.ts`
- Source TUI types: `tui-app.tsx` lines 9-22

## Overview

- **Priority:** P1 (blocks Phases 3, 4)
- **Status:** complete
- **Description:** Port the Wonlex packet builder/parser and define plain Dart models (`DeviceConfig`, `LogEntry`, enums `Status`, `LogDirection`). Pure logic only — no Flutter imports.

## Key Insights

- Packet format: `[3G*{deviceId}*{LLLL}*{content}]` — LLLL = 4-hex-digit uppercase **byte length** of content (UTF-8).
- Dart equivalent of `Buffer.byteLength(content, 'utf8')`: `utf8.encode(content).length`.
- `parsePacket` returns `null` for malformed input. Replicate exactly — null-safety friendly.
- `extractPackets` is part of the TCP client in the TS code but is reused logic — keep it inside the protocol module (or the service that owns the buffer). KISS: keep in `tcp_client_service.dart` (Phase 3) since it owns the byte buffer; `wonlex_protocol.dart` only exports `buildPacket`/`parsePacket`.
- `LogEntry.direction` source uses unicode arrows `→ ← !`. Reuse the same characters in Dart — `String` handles UTF-16 fine. Alternative: an enum `LogDirection { sent, received, alert }` mapped to a glyph at render time. Prefer enum (more idiomatic Dart, easier theming) → DRY for colors too.
- DeviceId regex: `^\d{10,15}$`.

## Requirements

**Functional**
- `buildPacket(deviceId, content)` throws `ArgumentError` for invalid deviceId; returns identical string format.
- `parsePacket(raw)` returns `({String deviceId, String command})?` (record) or `null`.
- `Status` enum: `offline`, `connecting`, `online`.
- `LogDirection` enum: `sent`, `received`, `alert` with `glyph` getter.
- `LogEntry`: `int id`, `String ts`, `LogDirection direction`, `String raw`.
- `DeviceConfig`: `String host`, `int port`, `String deviceId` + `toJson`/`fromJson` for shared_preferences (Phase 5).

**Non-functional**
- Pure Dart, no Flutter imports → trivially unit-testable.
- Each file ≤ 100 LOC.

## Architecture

```
lib/
├── models/
│   ├── log_entry.dart       # Status, LogDirection, LogEntry, timestamp() helper
│   └── device_config.dart   # DeviceConfig + JSON serialization
└── services/
    └── wonlex_protocol.dart # buildPacket, parsePacket, _deviceIdRegex
```

## Related Code Files

**Create**
- `lib/services/wonlex_protocol.dart`
- `lib/models/log_entry.dart`
- `lib/models/device_config.dart`

**Modify**
- None.

**Delete**
- None.

## Implementation Steps

1. **`wonlex_protocol.dart`**
   - `final _deviceIdRe = RegExp(r'^\d{10,15}$');`
   - `String buildPacket(String deviceId, String content)`:
     - `if (!_deviceIdRe.hasMatch(deviceId)) throw ArgumentError('Invalid deviceId: "$deviceId" — must be 10-15 digits');`
     - `final byteLen = utf8.encode(content).length;`
     - `final len = byteLen.toRadixString(16).padLeft(4, '0').toUpperCase();`
     - `return '[3G*$deviceId*$len*$content]';`
   - `({String deviceId, String command})? parsePacket(String raw)`:
     - Trim, require leading `[` & trailing `]`, slice body, split on `*`, require ≥ 4 parts.
     - `deviceId = parts[1]`, `content = parts.sublist(3).join('*')`, `command = content.split(',').first`.
2. **`log_entry.dart`**
   - `enum Status { offline, connecting, online }`
   - `enum LogDirection { sent, received, alert }` with extension/getter `String get glyph` → `→ ← !`.
   - `class LogEntry { final int id; final String ts; final LogDirection direction; final String raw; const LogEntry({...}); }`
   - `String formatTimestamp(DateTime now)` returning `HH:mm:ss` 24h (use `DateFormat('HH:mm:ss').format(now)` — but to avoid adding `intl`, hand-roll: `now.hour.toString().padLeft(2,'0')` etc.). KISS: hand-roll.
3. **`device_config.dart`**
   - `class DeviceConfig { final String host; final int port; final String deviceId; const DeviceConfig({...}); Map<String,dynamic> toJson(); factory DeviceConfig.fromJson(Map<String,dynamic>); static const defaults = DeviceConfig(host: '127.0.0.1', port: 12345, deviceId: '1378365340'); }`
4. Add a basic widget/unit test in `test/wonlex_protocol_test.dart`:
   - buildPacket round-trips through parsePacket.
   - Invalid deviceId throws.
   - Malformed parse returns null.
   - Byte-length hex is uppercase 4-digit.
5. Run `flutter test`. Run `flutter analyze`.

## Todo List

- [ ] Create `lib/services/wonlex_protocol.dart` with `buildPacket` + `parsePacket`
- [ ] Create `lib/models/log_entry.dart` with `Status`, `LogDirection`, `LogEntry`, `formatTimestamp`
- [ ] Create `lib/models/device_config.dart` with JSON serialization + `defaults`
- [ ] Add `test/wonlex_protocol_test.dart` covering build/parse/error paths
- [ ] `flutter test` passes
- [ ] `flutter analyze` clean

## Success Criteria

- `buildPacket('1378365340', 'LK,0,0,85')` → `'[3G*1378365340*0009*LK,0,0,85]'` (verify: `LK,0,0,85` = 9 bytes → hex `0009`).
- `parsePacket('[3G*123*0005*RESET]')` → `(deviceId: '123', command: 'RESET')`.
- `parsePacket('garbage')` → `null`.
- All unit tests pass.

## Risk Assessment

- **Unicode in content** — unlikely from gateway, but `utf8.encode` correctly counts multi-byte. Mitigation: test with a non-ASCII string.
- **Command extraction from content with embedded `*`** — TS code rejoins `parts.slice(3).join('*')`; replicate exactly to avoid divergence.

## Security Considerations

- Input validation prevents malformed packets from propagating.
- No file/network I/O in this layer.

## Next Steps

- Unblocks Phase 3 (TCP service uses `buildPacket`/`parsePacket`) and Phase 4 (provider uses models).
