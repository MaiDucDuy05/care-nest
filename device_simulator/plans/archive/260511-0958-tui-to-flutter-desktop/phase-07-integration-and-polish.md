# Phase 07 — Integration, Keyboard Shortcuts, Polish & Manual Test

## Context Links

- Plan overview: `./plan.md`
- All preceding phases (1-6).
- Source TUI key handler: `tui-app.tsx` lines 171-218.

## Overview

- **Priority:** P2 (final phase)
- **Status:** complete
- **Description:** Wire everything together — Provider at app root, bootstrap that loads persisted config before deciding which screen to show, keyboard shortcuts mirroring the TUI hotkeys, window title, and end-to-end manual verification against a real gateway.

## Key Insights

- TUI hotkeys to preserve on desktop:
  - `C` Connect · `D` Disconnect · `L/B/O/T` send · `P` phbx OK · `F` phbx Fail · `X` Clear · `S` Settings.
  - Drop `Q` Quit — desktop has a window close button.
- Use Flutter's `Shortcuts` + `Actions` widgets wrapping `MainScreen`, OR a `Focus(autofocus: true, onKeyEvent: ...)` wrapper. `Focus.onKeyEvent` is the simplest and most KISS.
- Bootstrap: `main()` is now `async` — `WidgetsFlutterBinding.ensureInitialized()` then `ConfigStorage().load()` → pass result into provider.
- Initial provider state:
  - If saved config exists → `_config = loaded; _showSettings = false;` (still requires user to press Connect; do NOT auto-connect on boot — matches TUI which starts OFFLINE).
  - If no saved config → `_showSettings = true`.
- Root widget reads `provider.showSettings` to choose `SetupScreen()` vs `MainScreen()`.
- Window title via `MaterialApp.title` ('Care Nest Device Simulator'). Optional: `package:window_manager` to set size — defer (YAGNI).

## Requirements

**Functional**
- `main()` loads persisted config (if any), seeds provider, runs app.
- Routing rule: `provider.showSettings ? SetupScreen() : MainScreen()`.
- Keyboard shortcuts active on MainScreen only:
  | Key | Action | Guard |
  |-----|--------|-------|
  | C | provider.connect() | status == offline |
  | D | provider.disconnect() | status != offline |
  | L | provider.sendLk() | status == online |
  | B | provider.sendBphrt() | status == online |
  | O | provider.sendOxygen() | status == online |
  | T | provider.sendBtemp2() | status == online |
  | P | provider.sendPhbxOk() | status == online |
  | F | provider.sendPhbxFail() | status == online |
  | X | provider.clearLogs() | always |
  | S | provider.openSettings() | always |
- All shortcuts case-insensitive (match TUI which accepted lower & upper).
- Don't fire shortcuts when a text field on SetupScreen has focus (SetupScreen owns its own focus; MainScreen shortcuts are scoped only when MainScreen is rendered → handled automatically by widget tree).

**Non-functional**
- App runs cleanly on macOS desktop with a real gateway.
- `flutter analyze` clean. `flutter test` passes.

## Architecture

```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storage = ConfigStorage();
  final saved = await storage.load();
  final provider = DeviceProvider();
  if (saved != null) provider.applyConfig(saved);
  runApp(ChangeNotifierProvider.value(value: provider, child: const CareNestDeviceSimulatorApp()));
}
```

```dart
// CareNestDeviceSimulatorApp -> MaterialApp(home: _Root())
// _Root: Consumer<DeviceProvider>(builder: (_, p, __) => p.showSettings ? const SetupScreen() : const MainScreen())
```

```dart
// In MainScreen: wrap body with Focus(autofocus: true, onKeyEvent: _handleKey)
KeyEventResult _handleKey(FocusNode node, KeyEvent event) {
  if (event is! KeyDownEvent) return KeyEventResult.ignored;
  final ch = event.character?.toLowerCase();
  switch (ch) {
    case 'c': provider.connect(); return KeyEventResult.handled;
    // ... etc
  }
  return KeyEventResult.ignored;
}
```

## Related Code Files

**Create**
- (none new — only modifications)

**Modify**
- `lib/main.dart` — async bootstrap + Provider root + theme + routing.
- `lib/screens/main_screen.dart` — wrap body in `Focus` + key handler.

**Delete**
- None.

## Implementation Steps

1. Rewrite `main.dart`:
   - `WidgetsFlutterBinding.ensureInitialized()`.
   - Load saved config via `ConfigStorage().load()`.
   - Construct `DeviceProvider`, seed via `applyConfig` if saved.
   - Wrap with `ChangeNotifierProvider.value`.
   - Define `CareNestDeviceSimulatorApp` with dark theme.
   - `_Root` consumes provider → returns `SetupScreen()` or `MainScreen()`.
2. Update `MainScreen` to wrap body with `Focus(autofocus: true, onKeyEvent: _handleKey)`. Read provider once via `context.read<DeviceProvider>()` at start of `_handleKey`. Use `LogicalKeyboardKey` if `event.character` is null for special keys (not needed here — all shortcuts are letters).
3. Verify `applyConfig` from SetupScreen returns user to MainScreen (since it sets `_showSettings = false`).
4. Run `flutter analyze`. Fix issues.
5. Run `flutter test`. Confirm Phase 2 protocol tests still pass.
6. **Manual end-to-end test**:
   - Start gateway (TCP echo server) at `127.0.0.1:12345`.
   - `flutter run -d macos`.
   - Setup screen appears (first launch). Submit defaults.
   - MainScreen appears, status = OFFLINE.
   - Press `C`. Status → CONNECTING → ONLINE. Log shows `[connected]` then `→ [3G*1378365340*0009*LK,0,0,85]`.
   - Have gateway send `[3G*1378365340*0005*RESET]`. App receives, auto-replies with `RESET` packet. Log shows both arrows.
   - Press `L`, `B`, `O`, `T`, `P`, `F` → each produces a Sent log row.
   - Press `X` → log clears.
   - Press `D` → status → OFFLINE.
   - Press `S` → SetupScreen. Change deviceId. Start. MainScreen returns with new deviceId visible in header.
   - Close & relaunch app → boots straight into MainScreen (config persisted).
7. **Manual error-path test**:
   - Stop gateway. Press `C`. After ~10s, status → OFFLINE with `! [disconnected: connect timeout]` (or `connection failed` depending on OS reject behavior).
   - Send a malformed packet from a small test script → expect `! [parse error] ...` log entry.
8. Build release: `flutter build macos --release`. Verify it opens.

## Todo List

- [ ] Rewrite `main.dart` with async bootstrap + Provider root + dark theme + `_Root` routing
- [ ] Wrap MainScreen body in `Focus` + implement `_handleKey` for all 10 shortcuts
- [ ] `flutter analyze` clean
- [ ] `flutter test` passes
- [ ] Manual end-to-end test with real gateway — all happy paths
- [ ] Manual error-path test — timeout, parse error, "not connected" send
- [ ] `flutter build macos --release` succeeds
- [ ] Smoke-test Linux and/or Windows build (best effort)

## Success Criteria

- Fresh install: SetupScreen → Start → MainScreen. Connect → ONLINE. Send commands. Disconnect. Settings.
- Re-launch: opens straight to MainScreen with persisted config.
- All 10 keyboard shortcuts produce same effect as their corresponding button.
- Auto-reply behavior matches TUI: gateway sends RESET/POWEROFF/VERNO/phbx → app auto-replies.
- Log buffer capped at 500 entries (verify by stress-test of 600 manual sends → first 100 should be evicted).
- Zero analyzer errors; all unit tests pass.

## Risk Assessment

- **macOS entitlement missing** → outbound connect fails. Mitigation: Phase 1 added it; double-check at test time.
- **Focus stealing**: if a button takes focus on click, subsequent key shortcuts may not fire. Mitigation: wrap MainScreen body in `Focus(autofocus: true)` and explicitly request focus on tap-up if observed.
- **Provider not seeded before runApp** — bootstrap awaits `load()` before constructing app; safe.
- **Auto-scroll vs user scroll** — acceptable trade-off (always scrolls to bottom); can be refined later.

## Security Considerations

- Confirm release build still includes network.client entitlement (Phase 1 covered both Debug & Release files).
- No secrets persisted.

## Next Steps (post-completion)

- Add CI: `flutter analyze` + `flutter test` on PR.
- Update `docs/codebase-summary.md` to describe the new app layout.
- Optional follow-ups (deferred — YAGNI):
  - Per-command parameter dialog (currently uses hardcoded defaults).
  - Multi-device support (multiple tabs).
  - Export log to file.

## Unresolved Questions

- Should the app auto-connect after applying a config (TUI does not — user must press C). Plan assumes NO auto-connect; confirm with user if behavior should differ.
- Should `[D] Disconnect` be enabled during `CONNECTING` (to cancel an in-flight connect)? TUI rule is `status != OFFLINE` so yes. Confirm desired UX on cancel-during-connecting.
- Linux/Windows: any sandbox/permission concerns? None known, but smoke-test recommended.
