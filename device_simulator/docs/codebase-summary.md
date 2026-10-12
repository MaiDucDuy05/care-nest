# Care Nest Device Simulator - Codebase Summary

**Project Type:** Flutter Desktop Application  
**Version:** 1.0.0  
**Language:** Dart / Flutter  
**Target Platform:** Desktop (Windows, macOS, Linux)  
**Last Updated:** 2026-05-11

## Project Overview

Care Nest Device Simulator is a Flutter desktop application that replicates a Wonlex GPS watch device. It simulates TCP connections to a gateway server, handles Wonlex protocol packet encoding/decoding, and provides an interactive UI for testing device communication and health sensor data transmission.

### Key Features
- **TCP Connection Simulation**: Connects to a configurable TCP gateway server
- **Wonlex Protocol Support**: Encodes/decodes device packets using Wonlex protocol format
- **Auto-Reply Mechanism**: Automatically responds to server commands (e.g., GPS location requests)
- **Health Sensor Data**: Simulates transmission of steps, heart rate, blood pressure, oxygen saturation, temperature
- **Persistent Configuration**: Saves device settings to SharedPreferences
- **Real-time Logging**: Displays all network events with timestamps and log direction
- **Dark Theme UI**: Modern Material Design dark interface with keyboard shortcuts

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | Flutter 3.11.5+ |
| **State Management** | Provider 6.1.2 |
| **Data Persistence** | SharedPreferences 2.3.2 |
| **Networking** | Dart native Socket (dart:io) |
| **Design** | Material Design + custom theme |
| **Build System** | Flutter CLI |

## Directory Structure

```
lib/
├── main.dart                              # App bootstrap & theme setup
├── models/
│   ├── device_config.dart                 # Device configuration model + validators
│   └── log_entry.dart                     # Event logging model & enums
├── services/
│   ├── wonlex_protocol.dart               # Packet builder & parser
│   ├── tcp_client_service.dart            # TCP socket wrapper + event stream
│   └── config_storage.dart                # SharedPreferences persistence layer
├── providers/
│   └── device_provider.dart               # ChangeNotifier state manager
├── screens/
│   ├── setup_screen.dart                  # Device configuration UI
│   ├── main_screen.dart                   # Connected device control UI
│   └── widgets/
│       ├── status_header.dart             # Connection status display
│       ├── log_panel.dart                 # Event log viewer
│       └── action_buttons.dart            # Sensor data action buttons
└── theme/
    └── app_colors.dart                    # Centralized color palette

test/                                      # Flutter test suite (empty)
pubspec.yaml                               # Dependency manifest
analysis_options.yaml                      # Linting rules
```

## Core Modules

### 1. Models (`lib/models/`)

#### `device_config.dart`
- **DeviceConfig**: Main configuration class with fields:
  - `deviceId` (String): 10-15 digit device identifier
  - `gatewayHost` (String): TCP server hostname
  - `gatewayPort` (int): TCP server port (1-65535)
  - `autoReply` (bool): Enable auto-response to commands
- **Validators**: Validate device ID format and port range
- **JSON Serialization**: `fromJson()` / `toJson()` for persistence

#### `log_entry.dart`
- **DeviceStatus**: Enum {offline, connecting, online}
- **LogDirection**: Enum {sent, received}
- **LogEntry**: Event record with ID, timestamp, direction, content, command
- **Utilities**: `formatTimestamp()` for display formatting

### 2. Services (`lib/services/`)

#### `wonlex_protocol.dart`
Implements Wonlex GPS watch protocol: `[3G*{deviceId}*{LLLL}*{content}]`
- **buildPacket(deviceId, content)**: Encodes outbound messages
  - Validates 10-15 digit device ID
  - Calculates 4-digit hex UTF-8 byte length
  - Returns formatted packet string
- **parsePacket(raw)**: Decodes inbound messages
  - Validates brackets and structure
  - Extracts device ID and command (first comma-separated token)
  - Returns `{deviceId, command}` or null if malformed

#### `tcp_client_service.dart`
Raw socket wrapper with event stream interface.
- **TcpClientService**: Manages Socket connection lifecycle
  - `connect()`: Establishes TCP connection with 10-second timeout
  - `disconnect()`: Closes socket gracefully
  - `send(raw)`: Writes string to socket
  - `events`: Broadcast stream of ClientEvent subclasses
- **Sealed ClientEvent Hierarchy**:
  - `Connected`: Socket established
  - `Disconnected(reason)`: Connection closed or timed out
  - `Sent(raw)`: Outbound packet logged
  - `Received(command, raw)`: Valid inbound packet parsed
  - `ParseError(raw)`: Malformed packet received
  - `ErrorEvent(message)`: Socket error
- **Buffer Management**: 4KB buffer for reassembling fragmented packets

#### `config_storage.dart`
Persistent storage via SharedPreferences.
- **ConfigStorage**: Async load/save DeviceConfig
  - `load()`: Returns saved config or null
  - `save(config)`: Persists config as JSON string
  - Uses 'device_config' key

### 3. State Management (`lib/providers/`)

#### `device_provider.dart`
ChangeNotifier managing device connection state and log history.
- **State Fields**:
  - `_config`: Current device configuration
  - `_status`: Connection status (offline/connecting/online)
  - `_logs`: Event log list (autoclearing on config change)
  - `_showSettings`: UI navigation flag
  - `_service`: Active TcpClientService instance
  - `_sub`: Event stream subscription
- **Public API**:
  - `applyConfig(cfg)`: Switch device + reconnect
  - `connect()`: Initiates TCP connection
  - `disconnect()`: Stops socket connection
  - `openSettings()`: Returns to setup screen
  - `clearLogs()`: Empties event history
  - **Sensor Send Methods**: `sendLk()`, `sendBphrt()`, `sendOxygen()`, `sendBtemp2()`, `sendPhbxOk()`
- **Auto-Reply**: When `autoReply` is enabled, responds to `PHONEBOK` commands with auto-acknowledged packet
- **Event Listening**: Subscribes to TCP events, updates status and logs, handles parsing

### 4. UI Layer (`lib/screens/`)

#### `setup_screen.dart`
Configuration form for device connection.
- Input fields: Device ID, Gateway Host, Gateway Port
- Toggle: Auto-reply on/off
- Actions: Save & Connect, Cancel
- Validation: Device ID format, port range

#### `main_screen.dart`
Primary connected device control interface.
- **Layout**: Header + Log Viewer + Action Buttons
- **Keyboard Shortcuts**: Quick-send sensor data (e.g., Ctrl+K for LK steps)
- **Navigation**: "Settings" button returns to setup
- **Focus Management**: Auto-focuses action inputs for quick keyboard entry

#### `widgets/status_header.dart`
Displays current connection state, device ID, server address.

#### `widgets/log_panel.dart`
Scrollable event log with timestamps, direction indicators (→/←), content preview.

#### `widgets/action_buttons.dart`
Buttons to trigger sensor data sends:
- **LK (Lifekey)**: Steps, overturn, battery
- **BPHRT**: Blood pressure, heart rate, height, gender, age, weight
- **Oxygen**: SpO2 flag and percentage
- **Btemp2**: Temperature reading
- **PHBX**: Phone book acknowledgment

### 5. Theme (`lib/theme/`)

#### `app_colors.dart`
Centralized Material Design dark theme colors:
- `bgScaffold`: Scaffold background
- `bgSurface`: Card and surface background
- `primary`: Primary action color
- Additional semantic colors

## Data Flow

```
SetupScreen (User Config Input)
          ↓
    DeviceProvider.applyConfig()
          ↓
    ConfigStorage.save() → SharedPreferences
          ↓
    DeviceProvider._resetClient() → TcpClientService
          ↓
    connect() → Socket.connect()
          ↓
    listen(events) ← ClientEvent stream
          ↓
    MainScreen (Display Status + Logs)
          ↓
    User Clicks Action
          ↓
    DeviceProvider.sendLk/BPHRT/etc()
          ↓
    TcpClientService.send() → wonlex_protocol.buildPacket()
          ↓
    Socket.write() → TCP Gateway
```

## Build & Run

### Desktop Development
```bash
flutter pub get
flutter run -d linux       # Linux
flutter run -d macos       # macOS
flutter run -d windows     # Windows
```

### Build Release
```bash
flutter build linux/macos/windows --release
```

## Dependencies & Versions
- **flutter**: SDK ^3.11.5
- **provider**: ^6.1.2 (state management)
- **shared_preferences**: ^2.3.2 (persistent storage)
- **cupertino_icons**: ^1.0.8 (iOS-style icons)
- **flutter_lints**: ^6.0.0 (linting)

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Sealed ClientEvent** | Type-safe event handling without pattern matching overhead |
| **ChangeNotifier** | Lightweight state management, familiar to Flutter devs |
| **Stream-based Networking** | Non-blocking I/O with natural async composition |
| **Broadcast StreamController** | Multiple listeners (UI + auto-reply logic) on socket events |
| **SharedPreferences** | Simple, synchronous config persistence for desktop |
| **Separated Protocol** | `wonlex_protocol.dart` reusable by other clients/tests |

## Testing

Test infrastructure in place via `flutter_test`. Key test areas:
- Packet encoding/decoding validation
- DeviceConfig validation and serialization
- Socket connection lifecycle (mock Socket)
- Provider state transitions
- UI widget rendering (golden tests, etc.)

Current status: Test suite structure created, tests pending implementation.

## Security & Compliance

- **Device ID Validation**: Regex enforces 10-15 digits only
- **Port Validation**: Ensures 1-65535 range
- **No Auth**: Assumes secure network (gateway handles auth)
- **UTF-8 Encoding**: Proper multi-byte character handling
- **Buffer Limit**: 4KB max packet buffer prevents DoS
- **Timeout**: 10-second connection timeout prevents hanging

## Future Enhancements

- [ ] Bulk action sequences (multi-step test scenarios)
- [ ] Packet history export (CSV/JSON)
- [ ] Command templates library
- [ ] Multiple device simulation (multi-instance support)
- [ ] Protocol version selector (Wonlex variants)
- [ ] Mock gateway server for testing
- [ ] Detailed metrics dashboard (sent/received counts)
