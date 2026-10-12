# Care Nest Device Simulator

A Flutter desktop app that simulates a Wonlex GPS watch device communicating with a backend server over TCP using the Wonlex binary protocol.

## Purpose

Used for development and testing of the Care Nest backend — sends realistic device telemetry (health metrics, heartbeat, status) without needing physical hardware.

## Features

- TCP client connecting to a configurable host/port
- Wonlex protocol packet builder and parser (`[3G*{deviceId}*{LLLL}*{content}]`)
- Sends: LK (heartbeat), BPHRT (blood pressure + heart rate), oxygen, body temperature, VERNO, RESET, POWEROFF
- Real-time log panel showing sent/received packets
- Persistent config via `shared_preferences`

## Supported Device Types

| Type    | Notes                      |
|---------|----------------------------|
| Wonlex  | Default, fully implemented |
| Nanway  | Config option (in progress)|

## Requirements

- Flutter SDK `^3.11.5`
- Dart SDK `^3.11.5`
- macOS 10.15+ (Catalina or later), Windows 10+, or Linux (x64)

## Getting Started

```bash
# Install dependencies
flutter pub get

# Run on macOS
flutter run -d macos

# Run on Windows
flutter run -d windows

# Run on Linux
flutter run -d linux
```

## Configuration

On first launch, enter:
- **Host** — server IP or hostname (default: `127.0.0.1`)
- **Port** — TCP port (default: `12345`, range: 1–65535)
- **Device ID** — 10–15 digit numeric string (default: `1378365340`)
- **Device Type** — Wonlex or Nanway

Config is saved automatically and restored on next launch.

## Protocol

Packet format: `[3G*{deviceId}*{LLLL}*{content}]`

- `LLLL` — 4-digit uppercase hex of content byte length (UTF-8)
- Content examples: `LK,0,0,85`, `bphrt,120,80,72,170,1,30,65`, `oxygen,1,98`

## Project Structure

```
lib/
├── main.dart
├── models/
│   ├── device_config.dart    # Config model + validation
│   └── log_entry.dart        # Log entry model
├── providers/
│   └── device_provider.dart  # State management
├── screens/
│   ├── setup_screen.dart     # Config form
│   ├── main_screen.dart      # Main simulator UI
│   └── widgets/              # Log panel, status header, action buttons
├── services/
│   ├── tcp_client_service.dart  # TCP socket + event stream
│   ├── wonlex_protocol.dart     # Packet build/parse
│   └── config_storage.dart     # Persistence
└── theme/
    └── app_colors.dart
```
