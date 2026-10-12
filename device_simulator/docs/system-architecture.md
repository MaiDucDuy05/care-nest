# Care Nest Device Simulator - System Architecture

**Version:** 1.0.0  
**Last Updated:** 2026-05-11  
**Platform:** Flutter Desktop

## Architecture Overview

Care Nest Device Simulator uses a **layered, modular architecture** with clean separation of concerns optimized for testability, maintainability, and cross-platform deployment.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  SetupScreen    MainScreen    Widgets (Header/Log/Buttons)  │
│                                                               │
│  • Navigation logic (settings toggle)                        │
│  • Theme application                                         │
│  • Widget composition                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ reads/updates
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   State Management Layer                     │
│                  (DeviceProvider)                            │
│                                                               │
│  • Connection lifecycle (connect/disconnect/reconnect)      │
│  • Sensor data sending (LK/BPHRT/Oxygen/Btemp2/PHBX)        │
│  • Event log management                                      │
│  • Configuration state                                       │
│  • Auto-reply logic                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ delegates to
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                      Services Layer                          │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ TcpClientService │  │ WonlexProtocol   │  │ConfigStorage
│  │                  │  │                  │  │            │ │
│  │ • Socket mgmt    │  │ • buildPacket()  │  │ • load()   │ │
│  │ • Event stream   │  │ • parsePacket()  │  │ • save()   │ │
│  │ • Buffering      │  │ • Validation     │  │            │ │
│  │ • Error handling │  │                  │  │            │ │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ uses
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                      Models Layer                            │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  DeviceConfig    │  │       LogEntry                   │ │
│  │                  │  │                                  │ │
│  │ • deviceId       │  │ • id                             │ │
│  │ • gatewayHost    │  │ • timestamp                      │ │
│  │ • gatewayPort    │  │ • direction (sent/received)      │ │
│  │ • autoReply      │  │ • content                        │ │
│  │ • JSON serializ. │  │ • command (parsed)               │ │
│  │ • Validators     │  │ • DeviceStatus enum              │ │
│  └──────────────────┘  │ • LogDirection enum              │ │
│                        │ • Formatting utilities           │ │
│                        └──────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ depends on
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                 Dart SDK & Plugins                           │
│                                                               │
│  • dart:io (Socket, SocketException)                        │
│  • dart:convert (jsonEncode/Decode, utf8)                   │
│  • dart:async (StreamController, StreamSubscription)        │
│  • provider (ChangeNotifier, ChangeNotifierProvider)        │
│  • shared_preferences (platform storage)                    │
│  • flutter (Material widgets, themes)                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Setup & Connection Flow

```
User Input
(Device ID, Host, Port, AutoReply)
    │
    ↓
SetupScreen validates input
    │
    ↓
DeviceProvider.applyConfig(DeviceConfig)
    │
    ├─→ ConfigStorage.save() ──→ SharedPreferences
    │
    ├─→ DeviceProvider._resetClient()
    │   │
    │   └─→ TcpClientService.connect()
    │       │
    │       └─→ Socket.connect(host, port)
    │           │
    │           ├─→ Connected event
    │           │   │
    │           │   └─→ DeviceProvider updates status=online
    │           │       │
    │           │       └─→ MainScreen renders
    │           │
    │           └─→ listen() sets up event stream
    │               │
    │               └─→ _onData() receives packets
    │                   │
    │                   ├─→ WonlexProtocol.parsePacket()
    │                   │   │
    │                   │   ├─→ Valid: Received event
    │                   │   │   │
    │                   │   │   ├─→ Auto-reply logic
    │                   │   │   │   (if autoReply && command=PHONEBOK)
    │                   │   │   │
    │                   │   │   └─→ Log entry created
    │                   │   │
    │                   │   └─→ Invalid: ParseError event
    │                   │       │
    │                   │       └─→ Log entry created
    │                   │
    │                   └─→ Error: ErrorEvent / Disconnected
    │                       │
    │                       └─→ status=offline
    │
    └─→ MainScreen displays status
```

### Sensor Data Send Flow

```
User clicks "Send LK" button
    │
    ↓
MainScreen calls DeviceProvider.sendLk(steps, overturn, battery)
    │
    ├─→ Check status == online
    │
    ├─→ Format command: "LK,{steps},{overturn},{battery}"
    │
    ├─→ TcpClientService.send(content)
    │   │
    │   ├─→ WonlexProtocol.buildPacket(deviceId, content)
    │   │   │
    │   │   ├─→ Validate deviceId (10-15 digits)
    │   │   │
    │   │   ├─→ UTF-8 encode content → byte array
    │   │   │
    │   │   ├─→ Calculate hex length: len = byteLen.toRadix(16)
    │   │   │
    │   │   └─→ Return "[3G*{deviceId}*{LLLL}*{content}]"
    │   │
    │   ├─→ Socket.write(packet)
    │   │   │
    │   │   └─→ Bytes sent to TCP gateway
    │   │
    │   └─→ Emit Sent(raw) event
    │       │
    │       └─→ DeviceProvider receives event
    │           │
    │           └─→ Create LogEntry(sent, timestamp, content)
    │
    └─→ LogPanel re-renders with new entry
```

### Auto-Reply Flow

```
Packet arrives from gateway
    │
    ↓
TcpClientService._onData() receives bytes
    │
    ├─→ Append to buffer
    │
    ├─→ Find '[' ... ']' delimiters
    │
    ├─→ Extract packet string
    │
    ├─→ WonlexProtocol.parsePacket(raw)
    │   │
    │   └─→ Extract {deviceId, command}
    │
    ├─→ Emit Received(command, raw)
    │
    ├─→ DeviceProvider._onClientEvent(Received event)
    │   │
    │   ├─→ Create LogEntry(received, ...)
    │   │
    │   ├─→ If autoReply && command == "PHONEBOK"
    │   │   │
    │   │   └─→ DeviceProvider.sendPhbxOk()
    │   │       │
    │   │       ├─→ Format: "PHBX,1"
    │   │       │
    │   │       └─→ TcpClientService.send(...)
    │   │           │
    │   │           └─→ [3G*{deviceId}*...PHBX,1...]
    │   │               │
    │   │               └─→ Socket.write()
    │   │
    │   └─→ Notify listeners
    │
    └─→ MainScreen re-renders with new log entry
```

---

## Module Responsibility Matrix

| Module | Responsibility | Dependencies | Dependents |
|--------|-----------------|--------------|-----------|
| **main.dart** | App bootstrap, theme setup, root routing | Provider, DeviceProvider, ConfigStorage | Everything |
| **DeviceConfig** | Configuration data model, validation, serialization | dart:convert | ConfigStorage, DeviceProvider |
| **LogEntry** | Event logging data model, formatting | none | DeviceProvider, LogPanel |
| **WonlexProtocol** | Packet encoding/decoding, protocol compliance | dart:convert | TcpClientService, DeviceProvider |
| **TcpClientService** | Socket lifecycle, event streaming, buffering | dart:io, dart:async, WonlexProtocol | DeviceProvider |
| **ConfigStorage** | Persistent configuration load/save | dart:convert, shared_preferences, DeviceConfig | main.dart, DeviceProvider |
| **DeviceProvider** | State management, orchestration, auto-reply | dart:async, TcpClientService, DeviceConfig, LogEntry | UI (all screens/widgets) |
| **SetupScreen** | Configuration form UI, input validation | DeviceProvider, DeviceConfig | _Root |
| **MainScreen** | Connected device control UI, keyboard shortcuts | DeviceProvider, StatusHeader, LogPanel, ActionButtons | _Root |
| **StatusHeader** | Connection status display widget | DeviceProvider | MainScreen |
| **LogPanel** | Event log viewer widget, scrolling | DeviceProvider, LogEntry | MainScreen |
| **ActionButtons** | Sensor data send UI, parameter inputs | DeviceProvider | MainScreen |
| **AppColors** | Centralized theme colors | none | All screens |

---

## Packet Flow & Protocol

### Wonlex Protocol Packet Structure

```
[3G*{deviceId}*{LLLL}*{content}]
 ││  │        │ │     │        │
 ││  │        │ │     │        └─ Closing bracket
 ││  │        │ │     └────────── Actual payload (command + args)
 ││  │        │ └─────────────── 4-digit uppercase hex UTF-8 byte length
 ││  │        └───────────────── Asterisk separator
 ││  └──────────────────────────- Device ID (10-15 digits)
 │└────────────────────────────── Asterisk separator
 └───────────────────────────────- Header "3G"

Example:
[3G*12345678901*000E*LK,1000,0,85]
  └─ Device ID: 12345678901
  └─ Length: 000E (hex) = 14 bytes
  └─ Content: "LK,1000,0,85" (14 bytes in UTF-8)
```

### Command Types (Wonlex Device→Server)

| Command | Parameters | Use Case |
|---------|-----------|----------|
| **LK** | `LK,steps,overturn,battery` | Life tracking (pedometer, falls, power) |
| **BPHRT** | `BPHRT,sys,dia,hr,h,g,a,w` | Health metrics (BP, HR, anthropometry) |
| **OXYGEN** | `OXYGEN,flag,value` | SpO2 percentage |
| **BTEMP2** | `BTEMP2,type,temp` | Body temperature |
| **PHBX** | `PHBX,status` | Phone book acknowledgment (1=ack) |

### Auto-Reply Logic

```
if (incomingCommand == "PHONEBOK" && config.autoReply)
  then send "PHBX,1"
```

This simulates device responding to server's phone book sync request.

---

## State Management Architecture

### DeviceProvider State Tree

```
DeviceProvider (ChangeNotifier)
├── config: DeviceConfig?
│   ├── deviceId: String
│   ├── gatewayHost: String
│   ├── gatewayPort: int
│   └── autoReply: bool
│
├── status: DeviceStatus (offline | connecting | online)
│
├── logs: List<LogEntry> (immutable view)
│   └── LogEntry
│       ├── id: int
│       ├── timestamp: DateTime
│       ├── direction: LogDirection (sent | received)
│       ├── content: String
│       └── command: String (parsed)
│
├── showSettings: bool (triggers navigation)
│
└── service: TcpClientService? (internal)
    └── events: Stream<ClientEvent>
        ├── Connected
        ├── Disconnected(reason)
        ├── Sent(raw)
        ├── Received(command, raw)
        ├── ParseError(raw)
        └── ErrorEvent(message)
```

### State Update Lifecycle

1. **User Input** (SetupScreen) → `applyConfig(cfg)`
2. **Notification** → `notifyListeners()`
3. **Widget Rebuild** (via `context.watch<DeviceProvider>()`)
4. **New Connection** → TcpClientService created
5. **Event Stream** → `_onClientEvent(ClientEvent)` handler
6. **State Update** → Status, logs modified
7. **Notification** → Listeners re-notified
8. **UI Render** → MainScreen updates

---

## Service Layer Contracts

### TcpClientService Interface

```dart
class TcpClientService {
  // Constructor
  TcpClientService({
    required String host,
    required int port,
    required String deviceId,
  });

  // Public API
  Stream<ClientEvent> get events;  // Broadcast stream
  Future<void> connect();          // Establish TCP connection
  void disconnect();               // Close socket
  Future<void> send(String raw);   // Send raw string
  
  // Sensor shortcuts
  Future<void> sendLK(int steps, int overturn, int battery);
  Future<void> sendBPHRT(int high, int low, int hr, 
                         int height, int gender, int age, int weight);
  Future<void> sendOxygen(int flag, int value);
  Future<void> sendBtemp2(int type, double temp);
  Future<void> sendPhbx(int status);
}
```

### WonlexProtocol Interface

```dart
// Encoding: DeviceId → Content → Packet
String buildPacket(String deviceId, String content)
  throws ArgumentError;

// Decoding: Packet → (DeviceId, Command)
({String deviceId, String command})? parsePacket(String raw);
```

### ConfigStorage Interface

```dart
class ConfigStorage {
  // Async persistence
  Future<DeviceConfig?> load();
  Future<void> save(DeviceConfig config);
}
```

---

## Error Handling Strategy

### Network Errors

| Error | Handling | Recovery |
|-------|----------|----------|
| **Connection Timeout** | Emit `Disconnected('connect timeout')` | User retries via `connect()` button |
| **Socket Exception** | Emit `ErrorEvent()` then `Disconnected()` | Automatic retry with backoff (future enhancement) |
| **Connection Closed** | Emit `Disconnected('connection closed')` | User can reconnect manually |
| **Send Failure** | Catch SocketException, emit `ErrorEvent()` | Log displayed, state remains online for retry |

### Protocol Errors

| Error | Handling | Recovery |
|-------|----------|----------|
| **Malformed Packet** | Emit `ParseError(raw)`, log entry created | Invalid packet ignored, connection remains active |
| **Invalid Device ID** | Throw `ArgumentError` on build, don't send | User corrects config and reconnects |
| **Buffer Overflow** | Drop if > 4KB, emit `ErrorEvent()` | Clear buffer, await next complete packet |

### Validation Errors

| Error | Handling | Recovery |
|-------|----------|----------|
| **Invalid Device ID** | `DeviceConfig.validateDeviceId()` returns error | SetupScreen shows validation message |
| **Invalid Port** | `DeviceConfig.validatePort()` returns error | SetupScreen shows validation message |
| **Missing Config** | Load returns null, show SetupScreen | User fills form completely |

---

## Concurrency & Threading

### Main Thread (UI Thread)
- All Flutter widget rendering
- State updates via `notifyListeners()`
- User input handling

### Socket I/O Thread (Background)
- `Socket.listen()` runs on background isolate
- Avoids blocking UI
- Events streamed back to main thread via `StreamController.broadcast()`

### Async Operations
- `Socket.connect()`: Awaited, timeout protection
- `ConfigStorage.load()`: Awaited in `main()` before app starts
- `ConfigStorage.save()`: Awaited, non-critical for UI

---

## Deployment & Platform Considerations

### Windows
- Socket API: `dart:io` Socket (full support)
- Storage: `shared_preferences` → Registry
- Theme: Dark theme, Material Design

### macOS
- Socket API: `dart:io` Socket (full support)
- Storage: `shared_preferences` → Defaults system
- Theme: Dark theme, Material Design (can adapt to system theme)

### Linux
- Socket API: `dart:io` Socket (full support)
- Storage: `shared_preferences` → ~/.config/<app_id>/
- Theme: Dark theme, Material Design

---

## Security Boundaries

### Trust Model
- **Assumed Secure Network:** No TLS/encryption (assumes trusted LAN)
- **No Authentication:** Device ID only, no credentials
- **No Authorization:** Server trusts all device IDs

### Input Validation

```
User Input
    ↓
DeviceConfig validator
    ├─→ deviceId: regex \d{10,15}
    ├─→ port: 1 ≤ port ≤ 65535
    └─→ host: non-empty string (hostname or IPv4)
    ↓
WonlexProtocol.buildPacket()
    ├─→ deviceId validation (same regex)
    └─→ UTF-8 encoding (safe multi-byte handling)
    ↓
Socket.write(packet)
    └─→ Raw bytes sent as-is (no escaping needed, binary safe)
```

---

## Testing Strategy (Planned)

### Unit Tests
- **WonlexProtocol:** Packet encode/decode with edge cases (UTF-8, long content)
- **DeviceConfig:** Validation, JSON serialization
- **LogEntry:** Timestamp formatting, direction enum

### Integration Tests
- **TcpClientService:** Mock socket with fake events
- **DeviceProvider:** State transitions, auto-reply logic
- **ConfigStorage:** Save/load with SharedPreferences mock

### Manual Testing
- Cross-platform (Windows, macOS, Linux)
- Connection timeout scenarios
- Malformed packet handling
- Long-running stability tests
- High-frequency sensor sends

---

## Future Architecture Enhancements

1. **Event Sourcing:** Log packets to disk for replay/audit
2. **Command Queueing:** Queue sends if offline, flush on reconnect
3. **Multi-Device:** Refactor to support spawning multiple TcpClientService instances
4. **Protocol Versioning:** Enum for Wonlex variants, dynamic packet builder
5. **Metrics Collection:** Send/receive counters, latency tracking
6. **Mock Gateway:** Built-in TCP server for offline testing
7. **BLoC Migration:** Consider BLoC pattern if state complexity grows

---

## Architecture Decision Records (ADRs)

### ADR-001: Sealed Classes for Events
**Decision:** Use sealed classes instead of union types or inheritance  
**Rationale:** Type-safe, compiler enforces exhaustiveness, clean syntax  
**Alternatives Considered:** Enum + data class pattern (more verbose)  
**Tradeoff:** No pattern matching `.when()` syntax (Dart limitation)

### ADR-002: ChangeNotifier vs BLoC
**Decision:** Use ChangeNotifier for single app-level provider  
**Rationale:** Lightweight, sufficient for simulator scope, familiar to team  
**Alternatives Considered:** BLoC, Redux, Riverpod  
**Tradeoff:** Less scalable if state grows exponentially

### ADR-003: Stream-based Socket Events
**Decision:** Use StreamController.broadcast() for async I/O  
**Rationale:** Non-blocking, composable with async/await, natural error propagation  
**Alternatives Considered:** Callbacks, futures, RxDart  
**Tradeoff:** Requires subscription management in provider

### ADR-004: SharedPreferences for Config
**Decision:** Use SharedPreferences instead of file I/O  
**Rationale:** Cross-platform, simple KV model, platform-level encryption  
**Alternatives Considered:** File-based JSON, Hive, database  
**Tradeoff:** Limited to string/primitive types (sufficient for config)

---

## Architecture Quality Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **Separation of Concerns** | Each module < 1 primary responsibility | ✅ Met |
| **Cyclic Dependency** | None detected | ✅ Met |
| **Module Coupling** | Low (via interfaces, not implementation) | ✅ Met |
| **Test Isolatability** | Core services mockable | ⏳ Pending (tests) |
| **Platform Abstraction** | Zero platform-specific code in logic | ✅ Met |
| **Code Duplication** | < 5% (DRY principle) | ✅ Met |
| **Comment Density** | Complex logic documented | ✅ Met |
