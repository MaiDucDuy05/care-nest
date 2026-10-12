# Phase 01 — Project Setup

## Context Links

- Plan overview: `./plan.md`
- Source TUI: `/Volumes/work/Care-Nest-MVP/care-nest/mock-device/src/`
- Flutter root: `/Volumes/work/care_nest_device_simulator/`

## Overview

- **Priority:** P1 (blocks all other phases)
- **Status:** complete
- **Description:** Add required deps, enable macOS network client entitlement, replace counter template with empty dark-themed shell wired to Provider. Establishes the scaffolding all later phases plug into.

## Key Insights

- Project already has `macos`, `linux`, `windows` folders → no platform bootstrap needed.
- macOS app-sandbox is ON; `network.server` already granted but `network.client` is NOT — outbound TCP fails without it.
- Linux & Windows require no entitlement file changes for outbound TCP.
- Provider tree must wrap MaterialApp so both SetupScreen and MainScreen access `DeviceProvider`.

## Requirements

**Functional**
- App launches into either SetupScreen (no saved config) or MainScreen (saved config present) — actual routing deferred to Phase 5/7; Phase 1 only needs an empty placeholder.
- Dark, terminal-like theme: dark background, monospace font in log areas, accent green/cyan/red for status/log directions.

**Non-functional**
- `flutter pub get` succeeds.
- `flutter analyze` passes (no errors).
- `flutter build macos --debug` succeeds.

## Architecture

- `main.dart` runs `runApp(ChangeNotifierProvider(create: (_) => DeviceProvider(), child: const CareNestDeviceSimulatorApp()))`.
- Root widget = `MaterialApp` with `ThemeData.dark()` customized: scaffold bg `#0E1116`, surface `#161B22`, primary `#22D3EE` (cyan).
- Home is a placeholder `Scaffold(body: Center(Text('Phase 1 OK')))` — replaced in Phase 5/7.
- Define a single color/text-style constants file later if reused (DRY) — defer until Phase 6.

## Related Code Files

**Create**
- (none new in Phase 1)

**Modify**
- `pubspec.yaml` — add `provider`, `shared_preferences`.
- `lib/main.dart` — rewrite from counter template to dark-themed placeholder + Provider root.
- `macos/Runner/DebugProfile.entitlements` — add `com.apple.security.network.client`.
- `macos/Runner/Release.entitlements` — add `com.apple.security.network.client`.

**Delete**
- None.

## Implementation Steps

1. Edit `pubspec.yaml` `dependencies:` block — add:
   ```yaml
   provider: ^6.1.2
   shared_preferences: ^2.3.2
   ```
2. Run `flutter pub get`.
3. Edit both entitlements files. Inside `<dict>` append:
   ```xml
   <key>com.apple.security.network.client</key>
   <true/>
   ```
4. Rewrite `lib/main.dart`:
   - Remove `MyApp`, `MyHomePage`, counter logic.
   - Define `CareNestDeviceSimulatorApp extends StatelessWidget`.
   - Wrap with `ChangeNotifierProvider` (use placeholder provider class stub until Phase 4 — OR comment-out the wrapping and add in Phase 4). KISS: skip Provider wrap until Phase 4; in Phase 1 just produce dark placeholder app.
   - `MaterialApp(title: 'Care Nest Device Simulator', theme: ThemeData.dark().copyWith(scaffoldBackgroundColor: Color(0xFF0E1116)), home: const _PlaceholderHome())`.
5. Run `flutter analyze`. Fix any warnings.
6. Run `flutter run -d macos` once to confirm window opens with dark placeholder.

## Todo List

- [ ] Add `provider` + `shared_preferences` to `pubspec.yaml`
- [ ] Run `flutter pub get`
- [ ] Add `network.client` entitlement to both `.entitlements` files
- [ ] Replace counter `main.dart` with dark-themed placeholder shell
- [ ] `flutter analyze` passes
- [ ] `flutter run -d macos` launches blank dark window

## Success Criteria

- `flutter analyze` reports 0 errors.
- App launches on macOS with a dark window and placeholder text.
- `pubspec.lock` contains `provider` and `shared_preferences`.
- Both entitlements files contain `com.apple.security.network.client`.

## Risk Assessment

- **macOS sandbox**: forgetting entitlement → silent `SocketException: Connection refused` in Phase 7. Mitigation: validate in Phase 7 manual test on macOS.
- **Provider version drift**: `^6.x` API stable; safe.

## Security Considerations

- Entitlement only grants outbound network — minimum needed.
- App sandbox remains ON.

## Next Steps

- Unblocks Phases 2 (models/protocol) and 3 (TCP client) — those two can run in parallel.
