# Phase 03 — TCP Client Service

## Context Links

- Plan overview: `./plan.md`
- Source: `/Volumes/work/Care-Nest-MVP/care-nest/mock-device/src/tcp-client.ts`
- Wonlex protocol (Phase 2): `lib/services/wonlex_protocol.dart`

## Overview

- **Priority:** P1 (blocks Phase 4)
- **Status:** complete
- **Description:** Port `TcpClient` (TS, EventEmitter-style) to a Dart service using `dart:io` `Socket` and `Stream<ClientEvent>`. Preserve packet framing, 10s connect timeout, 4096-byte buffer cap, and all `sendXxx()` commands.

## Key Insights

- `dart:io` `Socket.connect(host, port, timeout: Duration(seconds: 10))` natively supports connect timeout — no separate timer needed.
- Event stream pattern: `StreamController<ClientEvent>.broadcast()` exposed via `Stream<ClientEvent> get events`.
- Sealed class for `ClientEvent` (Dart 3) → exhaustive `switch` in consumer (provider).
- Incoming data: `Socket` is a `Stream<Uint8List>`. Accumulate into a String buffer (decode UTF-8 incrementally — `Utf8Decoder(allowMalformed: true).convert(chunk)` per chunk is OK because packet bytes are ASCII).
- `extractPackets` lives here (owns buffer).
- Socket lifecycle: subscribe to `listen(onData, onError, onDone)` — `onDone` → emit `disconnected('connection closed')`.
- Re-connect = call `disconnect()` first to destroy old socket. Replicate TS guard.

## Requirements

**Functional**
- Public API:
  - `TcpClientService({required String host, required int port, required String deviceId})`
  - `Stream<ClientEvent> get events`
  - `Future<void> connect()` — non-throwing; emits events. Catches `SocketException`/`TimeoutException` → emits `error` + `disconnected`.
  - `void disconnect()` — destroys socket; idempotent.
  - `void sendLK(int steps, int overturn, int battery)`
  - `void sendBPHRT(int highBp, int lowBp, int hr, int height, int gender, int age, int weight)`
  - `void sendRESET()`
  - `void sendPOWEROFF()`
  - `void sendOxygen(int flag, int value)`
  - `void sendVERNO()` — fixed payload: `VERNO,G29_BASE_V1.00_2014.04.23_17.46.49`
  - `void sendBtemp2(int type, double temp)` — `temp` may be fractional (TS used `36.6`).
  - `void sendPhbx(int status)` — 0 = fail, 1 = OK.
  - `void dispose()` — close stream controller.
- All `sendXxx` emit `error('not connected')` when socket null/destroyed.
- Connect timeout = 10s.
- Receive buffer cap = 4096 chars → on overflow emit `error('receive buffer overflow, flushing')` and reset buffer.

**Non-functional**
- File ≤ 200 LOC.
- No Flutter imports.
- Unit-testable by stubbing a local `ServerSocket` in tests (deferred to Phase 7 manual verification — KISS).

## Architecture

```dart
sealed class ClientEvent {}
class Connected extends ClientEvent {}
class Disconnected extends ClientEvent { final String reason; }
class Sent extends ClientEvent { final String raw; }
class Received extends ClientEvent { final String command; final String raw; }
class ParseError extends ClientEvent { final String raw; }
class ErrorEvent extends ClientEvent { final String message; }
```

`TcpClientService` internals:
- `Socket? _socket`
- `String _buffer = ''`
- `final _controller = StreamController<ClientEvent>.broadcast();`
- `_extractPackets(buffer)` private — same algorithm as TS `extractPackets`.
- `_write(String content)` helper: builds packet via `buildPacket`, writes, emits `Sent`. DRY helper for all `sendXxx`.

## Related Code Files

**Create**
- `lib/services/tcp_client_service.dart`

**Modify**
- None.

**Delete**
- None.

## Implementation Steps

1. Define sealed `ClientEvent` hierarchy at top of file (or in a sibling `client_event.dart` if file grows > 200 LOC).
2. Implement `TcpClientService`:
   ```dart
   Future<void> connect() async {
     disconnect(); // destroy any existing socket
     try {
       final s = await Socket.connect(_host, _port, timeout: const Duration(seconds: 10));
       _socket = s;
       _emit(Connected());
       s.listen(
         _onData,
         onError: (e) => _emit(ErrorEvent(message: e.toString())),
         onDone: () { _socket = null; _emit(Disconnected(reason: 'connection closed')); },
         cancelOnError: false,
       );
     } on TimeoutException {
       _emit(Disconnected(reason: 'connect timeout'));
     } on SocketException catch (e) {
       _emit(ErrorEvent(message: e.message));
       _emit(Disconnected(reason: 'connection failed'));
     }
   }
   ```
3. `_onData(Uint8List chunk)`:
   - Append `utf8.decode(chunk, allowMalformed: true)` to `_buffer`.
   - If `_buffer.length > 4096` → emit overflow error, reset, return.
   - Run `_extractPackets`. For each packet: `parsePacket(...)` → `Received` or `ParseError`.
4. `_write(String content)`:
   ```dart
   final sock = _socket;
   if (sock == null) { _emit(ErrorEvent(message: 'not connected')); return; }
   final raw = buildPacket(_deviceId, content);
   sock.write(raw);
   _emit(Sent(raw: raw));
   ```
5. Implement all `sendXxx` as one-liners calling `_write('...')`.
6. `disconnect()`: if `_socket != null`, call `_socket!.destroy()`, set null. Do NOT emit `Disconnected` here — `onDone` will fire.
   - Edge case: if `destroy()` doesn't trigger `onDone` immediately during a reconnect sequence, manually emit `Disconnected(reason: 'disconnected by user')`. Test in Phase 7; for now mirror TS behavior (let `onDone` handle).
7. `dispose()`: `_controller.close()`.
8. Compile check via `flutter analyze`.

## Todo List

- [ ] Create `lib/services/tcp_client_service.dart`
- [ ] Define sealed `ClientEvent` hierarchy
- [ ] Implement connect/disconnect with 10s timeout
- [ ] Implement `_extractPackets` (port from TS)
- [ ] Implement 4096-byte buffer overflow guard
- [ ] Implement all 8 `sendXxx` commands via `_write` helper
- [ ] `flutter analyze` clean
- [ ] Optional: unit test with a real `ServerSocket` echoing a packet

## Success Criteria

- Compiles cleanly.
- Calling `connect()` against `127.0.0.1:12345` (when gateway not running) emits `error` + `disconnected('connection failed')` within ~10s.
- Calling any `sendXxx` while disconnected emits `error('not connected')` without crashing.
- File ≤ 200 LOC (split events into sibling file if needed).

## Risk Assessment

- **TLS/encoding**: gateway uses plain TCP, ASCII payloads → safe.
- **Buffer encoding edge cases**: `utf8.decode` may throw on partial multi-byte at chunk boundary. Mitigation: `allowMalformed: true`. Acceptable for ASCII payloads.
- **Socket.destroy vs close**: `destroy()` immediately closes both directions, triggers `onDone`. Mirror TS `socket.destroy()` semantics.
- **Double-disconnect**: idempotent — guarded by null check.

## Security Considerations

- No TLS — matches existing protocol. Out of scope.
- Outbound only — matches macOS entitlement granted in Phase 1.

## Next Steps

- Unblocks Phase 4 (DeviceProvider consumes `events` stream).
