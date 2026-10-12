# Phase 06 — MainScreen + Widgets

## Context Links

- Plan overview: `./plan.md`
- Sources:
  - `tui-app.tsx` lines 233-247 (main layout)
  - `tui-header.tsx` (status header)
  - `tui-log-line.tsx` (log row)
  - `tui-footer.tsx` (action buttons)
- Provider intents (Phase 4): `lib/providers/device_provider.dart`

## Overview

- **Priority:** P2 (blocks Phase 7)
- **Status:** complete
- **Description:** Build the runtime screen — three stacked regions: header (device ID + colored status), scrollable log panel (monospace, color-coded directions), footer button grid. UI consumes `DeviceProvider` via `context.watch` / `Selector`.

## Key Insights

- Mirror TUI button enablement rules:
  - `[C] Connect` enabled only when `status == offline`.
  - `[D] Disconnect` enabled when `status != offline`.
  - `[L] [B] [O] [T] [P] [F]` enabled only when `status == online`.
  - `[X] Clear log`, `[S] Settings` always enabled.
  - No `[Q] Quit` button (window close handles this on desktop).
- Status color: red=OFFLINE, amber=CONNECTING, green=ONLINE. Match TUI semantics.
- Log direction color: cyan=`sent (→)`, green=`received (←)`, red=`alert (!)`. Match TUI.
- Use monospace font (`fontFamily: 'monospace'`) for log lines & headers — terminal aesthetic.
- Auto-scroll log to bottom when new entry arrives (common terminal UX). Use `ScrollController` + `addPostFrameCallback` to `jumpTo(maxScrollExtent)` when list length grows. Pause auto-scroll if user has scrolled up (nice-to-have; skip for Phase 6, simple always-scroll-to-bottom is KISS sufficient).
- Performance: 500 entries is small. `ListView.builder` is enough.
- Selectors: use `Selector<DeviceProvider, Status>` for header (so log changes don't rebuild it). For log panel, use `Selector<DeviceProvider, int>` keyed on `logs.length` then read the list. KISS alternative: single `Consumer` at MainScreen level — 500 rebuilds is cheap. Start KISS; optimize only if profiling shows jank.

## Requirements

**Functional**
- `MainScreen` builds `Scaffold` body as `Column`:
  - `StatusHeader` (fixed height ~56px).
  - `Expanded(child: LogPanel())`.
  - `ActionButtons` (auto height, wraps on narrow window).
- `StatusHeader`:
  - Left: bold title `Mock Device Simulator`.
  - Middle: `Device: 1378365340` muted.
  - Right: colored dot `●` + status text (`OFFLINE` | `CONNECTING` | `ONLINE`).
- `LogPanel`:
  - Dark bg (`#0A0D11`), monospace.
  - Each row: `HH:MM:SS  →  raw...` with timestamp dim, glyph colored, raw default fg.
  - Auto-scrolls to bottom on new entry.
  - Empty state: dim text "No log entries yet — press C to connect".
- `ActionButtons`: <!-- Updated: Validation Session 1 - command params exposed as editable fields -->
  - Layout: scrollable `Column` of command rows. Simple commands (Connect, Disconnect, phbx OK/Fail, Clear, Settings) = button only. Parameterised commands have compact inline `TextFormField`s pre-filled with defaults.
  - LK row: fields `Steps`, `Overturn`, `Battery` + `[L] Send LK` button.
  - BPHRT row: fields `High`, `Low`, `HR`, `Height`, `Gender(0/1)`, `Age`, `Weight` + `[B] Send BPHRT` button.
  - Oxygen row: fields `Flag`, `Value` + `[O] Send Oxygen` button.
  - Btemp2 row: fields `Type`, `Temp` + `[T] Send Btemp2` button.
  - Simple buttons row: `[C] Connect`, `[D] Disconnect`, `[P] phbx OK`, `[F] phbx Fail`, `[X] Clear`, `[S] Settings`.
  - Field validation: parse int/double; show `SnackBar` error if invalid on send.
  - Each parameterised command button passes parsed field values to the matching provider send method.
  - Disabled state = greyed via `onPressed: null` (Flutter default).

**Non-functional**
- Each widget file ≤ 200 LOC. `action_buttons.dart` may need to extract parameterised command rows into sub-widgets (e.g. `lk_command_row.dart`) if it exceeds 200 LOC. <!-- Updated: Validation Session 1 - inline fields increase LOC -->
- No business logic in widgets — only state read + intent dispatch.

## Architecture

```
lib/screens/
├── main_screen.dart                # orchestrator
└── widgets/
    ├── status_header.dart
    ├── log_panel.dart
    └── action_buttons.dart
```

Optionally `lib/theme/app_colors.dart` for shared color constants (status dot, log direction) to keep DRY across widgets.

## Related Code Files

**Create**
- `lib/screens/main_screen.dart`
- `lib/screens/widgets/status_header.dart`
- `lib/screens/widgets/log_panel.dart`
- `lib/screens/widgets/action_buttons.dart`
- (optional) `lib/theme/app_colors.dart`

**Modify**
- None at this phase (wiring happens in Phase 7).

**Delete**
- None.

## Implementation Steps

1. **`app_colors.dart`** (small constants file)
   ```dart
   class AppColors {
     static const bgLogPanel = Color(0xFF0A0D11);
     static const statusOffline = Color(0xFFEF4444);   // red-500
     static const statusConnecting = Color(0xFFF59E0B); // amber-500
     static const statusOnline = Color(0xFF22C55E);    // green-500
     static const dirSent = Color(0xFF22D3EE);         // cyan-400
     static const dirReceived = Color(0xFF22C55E);     // green-500
     static const dirAlert = Color(0xFFEF4444);        // red-500
     static const timestamp = Color(0xFF6B7280);       // gray-500
   }
   ```
   Add helper `Color colorFor(Status s)` and `Color colorFor(LogDirection d)`.
2. **`status_header.dart`**: stateless. Reads `status` + `config.deviceId` from provider via `Selector` (or just `context.watch` if KISS). Layout: `Row(children: [Text('Mock Device Simulator', bold), Text('Device: $deviceId', muted), Spacer(), CircleAvatar/Icon(Icons.circle, color: ...), Text(status.name.toUpperCase())])` with horizontal padding.
3. **`log_panel.dart`**: `StatefulWidget` with `ScrollController`. In `build`, watch logs list. After build, schedule `_controller.jumpTo(_controller.position.maxScrollExtent)` if attached. `ListView.builder` rendering each `LogEntry` as a `Row` with three `Text` widgets and a monospace `TextStyle`.
4. **`action_buttons.dart`**: stateless. `Wrap(spacing: 8, runSpacing: 8, children: [...])`. Each button = `OutlinedButton(onPressed: enabled ? () => provider.sendXxx() : null, child: Text('[L] Send LK'))`. Compute `enabled` flags from `status` via a single selector to avoid 10 individual reads.
5. **`main_screen.dart`**: Scaffold with `appBar: null`, body wrapped in `SafeArea` containing the Column. Apply `DefaultTextStyle.merge(style: TextStyle(fontFamily: 'monospace'))` around the body.
6. `flutter analyze`.

## Todo List

- [ ] Create `lib/theme/app_colors.dart` with color constants + `colorFor` helpers
- [ ] Create `status_header.dart` (status dot + device id + title)
- [ ] Create `log_panel.dart` with `ListView.builder` + auto-scroll
- [ ] Create `action_buttons.dart` with 10 buttons + enabled rules
- [ ] Create `main_screen.dart` orchestrating the three widgets
- [ ] `flutter analyze` clean
- [ ] Manual: with mocked provider state, verify buttons enable/disable correctly per status

## Success Criteria

- All 10 buttons present, labeled with `[X]` prefix matching TUI.
- Status dot color matches: red/amber/green for offline/connecting/online.
- Log rows show timestamp + colored glyph + raw text in monospace.
- Auto-scroll keeps newest entry visible.
- Window resizes gracefully (`Wrap` handles narrow widths).

## Risk Assessment

- **Excessive rebuilds**: full-provider `watch` rebuilds the entire main screen on every log append. 500 entries with monospace text rows — Flutter should handle 60fps. If profiling shows jank, switch to `Selector` per region.
- **ScrollController detached**: ensure `_controller` not used before `ListView` attaches it. Guard with `if (_controller.hasClients)`.
- **Auto-scroll fights user scroll**: acceptable for now; can be refined later.

## Security Considerations

- N/A (pure UI).

## Next Steps

- Phase 7 wires routing + persistence bootstrap + keyboard shortcuts + manual end-to-end testing.
