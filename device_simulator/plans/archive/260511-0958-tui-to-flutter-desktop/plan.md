---
title: "Convert TUI mock-device app to Flutter desktop"
description: "Port Wonlex GPS-watch TUI simulator (TS/Ink) to Flutter desktop preserving protocol & UX."
status: complete
priority: P2
effort: 8h
branch: main
tags: [flutter, desktop, tcp, port, simulator]
created: 2026-05-11
completed: 2026-05-11
---

# Plan: TUI → Flutter Desktop

Port the existing TypeScript/Ink TUI mock device (`/Volumes/work/Care-Nest-MVP/care-nest/mock-device/src/`) to a Flutter desktop app at `/Volumes/work/care_nest_device_simulator`. Preserve exact Wonlex protocol behavior, command set, auto-replies, status FSM, and 500-entry log buffer. Dark terminal-like theme to match TUI aesthetic.

## Source / Target

- **Source:** TS/Ink TUI — DO NOT modify
- **Target:** Flutter desktop (macOS / Linux / Windows already scaffolded)
- **Current Flutter state:** vanilla counter template, only `cupertino_icons` + `flutter_lints` deps

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Project setup (deps, entitlements, theme, scaffold) | complete | `phase-01-project-setup.md` |
| 2 | Models + Wonlex protocol port | complete | `phase-02-models-and-protocol.md` |
| 3 | TCP client service (dart:io Socket) | complete | `phase-03-tcp-client-service.md` |
| 4 | DeviceProvider (ChangeNotifier state + business logic) | complete | `phase-04-state-provider.md` |
| 5 | SetupScreen (config form + persistence) | complete | `phase-05-setup-screen.md` |
| 6 | MainScreen + widgets (header, log panel, action buttons) | complete | `phase-06-main-screen-widgets.md` |
| 7 | Integration, keyboard shortcuts, polish, manual test | complete | `phase-07-integration-and-polish.md` |

## Key Dependencies

- Phase 1 unblocks all others.
- Phases 2 + 3 can run in parallel after 1.
- Phase 4 depends on 2 + 3.
- Phases 5 + 6 depend on 4.
- Phase 7 depends on 5 + 6.

## Architecture Snapshot

```
lib/
├── main.dart                     # MaterialApp w/ dark theme + Provider root
├── models/
│   ├── log_entry.dart            # LogEntry + Direction + Status enums
│   └── device_config.dart        # host, port, deviceId
├── services/
│   ├── wonlex_protocol.dart      # buildPacket / parsePacket / extractPackets
│   └── tcp_client_service.dart   # Socket wrapper + ClientEvent stream
├── providers/
│   └── device_provider.dart      # state + auto-reply business logic
└── screens/
    ├── setup_screen.dart
    ├── main_screen.dart
    └── widgets/
        ├── status_header.dart
        ├── log_panel.dart
        └── action_buttons.dart
```

## New Dependencies

- `provider: ^6.1.2` — state management
- `shared_preferences: ^2.3.2` — persist last DeviceConfig

## Validation Log

### Session 1 — 2026-05-11
**Trigger:** Pre-implementation validation interview
**Questions asked:** 6

#### Questions & Answers

1. **[Scope]** Which desktop platforms should be in scope for the initial delivery?
   - Options: macOS only | macOS + Linux | All three (macOS + Linux + Windows)
   - **Answer:** All three (macOS + Linux + Windows)
   - **Rationale:** Plan already scaffolds all three; no change needed. Linux/Windows require no entitlement changes.

2. **[Assumptions]** Command default values (BPHRT 120/80/72, LK 0/0/85, etc.) — how should they be handled?
   - Options: Hardcode in provider | Expose as editable fields in UI | Hardcode now, make configurable later
   - **Answer:** Expose as editable fields in UI
   - **Rationale:** Provider send methods must accept parameters; ActionButtons widget needs input fields per command.

3. **[Scope]** Automated unit tests: Phase 7 plans manual-only verification against a real gateway.
   - Options: Manual testing only | Unit test protocol + provider logic | Unit tests + widget tests
   - **Answer:** Manual testing only
   - **Rationale:** Confirms current plan. No test files needed.

4. **[Architecture]** Monospace font for the log panel.
   - Options: System monospace fallback | Bundle JetBrains Mono
   - **Answer:** System monospace fallback — `fontFamily: 'monospace'`
   - **Rationale:** Confirms current plan. Zero extra assets.

5. **[Architecture]** Auto-scroll behavior when user scrolls up.
   - Options: Always scroll to bottom | Pause when user scrolls up
   - **Answer:** Always scroll to bottom
   - **Rationale:** Confirms current plan. KISS.

6. **[Architecture]** State management approach.
   - Options: ChangeNotifier + provider | Riverpod | BLoC/Cubit
   - **Answer:** ChangeNotifier + provider
   - **Rationale:** Confirms current plan.

#### Confirmed Decisions
- Platforms: all three (macOS + Linux + Windows) — no plan change
- Command defaults: user-editable fields in UI — impacts Phase 04 + 06
- Tests: manual only — confirms plan
- Font: system monospace — confirms plan
- Auto-scroll: always bottom — confirms plan
- State: ChangeNotifier + provider — confirms plan

#### Action Items
- [x] Update Phase 04: provider send methods accept parameters instead of using hardcoded defaults
- [x] Update Phase 06: ActionButtons widget includes `TextEditingController` fields per command group

#### Impact on Phases
- Phase 04: send method signatures change — e.g. `sendLk({int steps=0, int overturn=0, int battery=85})`
- Phase 06: ActionButtons adds editable fields; consider grouping (LK row, BPHRT row, Oxygen row, Btemp2 row)

---

## Principles

- YAGNI / KISS / DRY
- Files under 200 LOC — split if needed
- Real TCP via `dart:io` Socket. No mocks.
- Dark theme; monospace font for log panel.
