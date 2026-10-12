# Care Nest Device Simulator - Code Standards & Guidelines

**Version:** 1.0.0  
**Last Updated:** 2026-05-11  
**Language:** Dart / Flutter

## Overview

This document defines coding standards, architectural patterns, and best practices for the Care Nest Device Simulator project. All contributors must adhere to these standards to maintain code quality, readability, and maintainability.

---

## 1. Naming Conventions

### Files

| Category | Convention | Example |
|----------|-----------|---------|
| **Dart Files** | snake_case | `device_provider.dart`, `tcp_client_service.dart` |
| **Directories** | snake_case | `lib/services/`, `lib/screens/widgets/` |
| **Tests** | `_test.dart` suffix | `wonlex_protocol_test.dart` |
| **Asset Files** | snake_case | `app_icon.png`, `logo_full.svg` |

### Classes & Types

```dart
// PascalCase for classes, enums, typedefs
class DeviceProvider { }
enum DeviceStatus { offline, connecting, online }
sealed class ClientEvent { }
class Connected extends ClientEvent { }
typedef OnEventCallback = void Function(ClientEvent);

// Private classes (rarely used) — still PascalCase
class _InternalHelper { }
```

### Variables & Constants

```dart
// camelCase for variables, fields, and parameters
String deviceId = "12345678901";
final gatewayHost = "192.168.1.100";
var logEntry = LogEntry(...);

// SCREAMING_SNAKE_CASE for constants (compile-time const)
const String APP_NAME = "Care Nest Device Simulator";
const int MAX_BUFFER_SIZE = 4096;
const Duration CONNECT_TIMEOUT = Duration(seconds: 10);

// Private fields with leading underscore
class DeviceProvider {
  String _config;
  final List<LogEntry> _logs = [];
}
```

### Functions & Methods

```dart
// camelCase for functions and methods
void main() { }
String buildPacket(String deviceId, String content) { }
Future<void> connect() async { }
void _handleConnectionError(String reason) { }  // private method
```

### Enums

```dart
// Enum values are camelCase (lowercase with Pascal for multi-word)
enum DeviceStatus {
  offline,
  connecting,
  online,
}

enum LogDirection {
  sent,
  received,
}

// Use them as: DeviceStatus.online
```

---

## 2. Code Organization

### File Structure

Every `.dart` file should follow this structure:

```dart
// 1. License header (if applicable)
// © 2026 Care Nest

// 2. Imports (grouped and ordered)
// Dart imports
import 'dart:async';
import 'dart:io';
import 'dart:convert';

// Flutter imports
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

// Package imports
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Relative imports
import '../models/device_config.dart';
import '../services/tcp_client_service.dart';

// 3. Library declaration (if pub package)
// library device_provider;

// 4. Constants (module-level)
const Duration _DEFAULT_TIMEOUT = Duration(seconds: 10);
const int _MAX_RETRY_ATTEMPTS = 3;

// 5. Type definitions / typedefs
typedef EventCallback = void Function(ClientEvent event);

// 6. Enums and sealed classes
enum DeviceStatus { offline, connecting, online }

sealed class ClientEvent {}

// 7. Main class/widget
class DeviceProvider extends ChangeNotifier {
  // Fields
  // Constructors
  // Getters
  // Public methods
  // Private methods
}

// 8. Supporting classes (if small)
class _HelperClass {
  // ...
}

// 9. Extensions (if any)
extension StringExtensions on String {
  // ...
}
```

### Directory Organization

```
lib/
├── main.dart                          # App entry point
├── models/                            # Data models, validation
│   ├── device_config.dart            # Device configuration
│   └── log_entry.dart                # Event logging
├── services/                          # Business logic, external APIs
│   ├── wonlex_protocol.dart          # Packet codec
│   ├── tcp_client_service.dart       # Socket management
│   └── config_storage.dart           # Persistence
├── providers/                         # State management (ChangeNotifier)
│   └── device_provider.dart          # Main app state
├── screens/                           # UI screens
│   ├── setup_screen.dart             # Configuration UI
│   ├── main_screen.dart              # Connected device UI
│   └── widgets/                      # Reusable widgets
│       ├── status_header.dart
│       ├── log_panel.dart
│       └── action_buttons.dart
├── theme/                             # Theming
│   └── app_colors.dart               # Color palette
└── utils/                             # (future) Helpers, formatters

test/
├── unit/                              # Unit tests
│   ├── models/
│   ├── services/
│   └── providers/
└── widget/                            # Widget/UI tests
    └── screens/
```

---

## 3. Dart Language Conventions

### Variable Declaration

```dart
// Prefer final over var when type is clear
final config = DeviceConfig(...);
final String deviceId = "12345678901";

// Use var for types that are obvious from context
var status = DeviceStatus.offline;

// Avoid bare var if type is not immediately clear
// ❌ Bad: var result = fetchConfig();
// ✅ Good: DeviceConfig? config = await fetchConfig();

// Use late for lazy initialization
late final TcpClientService _service;

// Use dynamic only when necessary (rare)
// ❌ Bad: dynamic event = ClientEvent();
// ✅ Good: ClientEvent event = Connected();
```

### Null Safety

```dart
// Nullable types explicit
String? maybeId;
List<LogEntry>? logs;

// Non-null by default
String deviceId = "12345678901";
List<LogEntry> logs = [];

// Use ?? for null coalescing
String id = config?.deviceId ?? "unknown";

// Use ?. for safe navigation
config?.validate();

// Use ! only when certain (rare)
String id = config!.deviceId;  // Already checked for null above

// Avoid excessive null-coalescing chains
// ❌ Bad: config?.host ?? "localhost" ?? throw Error();
// ✅ Good: final host = config?.host ?? "localhost";
```

### Async/Await

```dart
// Prefer async/await over .then() chains
Future<void> connect() async {
  try {
    await socket.connect();
    _status = DeviceStatus.online;
  } catch (e) {
    _status = DeviceStatus.offline;
  }
}

// Use FutureOr for flexible returns
FutureOr<void> initializeConfig() {
  // Can return void or Future<void>
}

// Handle streams properly
final subscription = eventStream.listen((event) {
  _handleEvent(event);
});

// Always unsubscribe to prevent memory leaks
void dispose() {
  subscription?.cancel();
  super.dispose();
}
```

### Collection Literals

```dart
// Prefer literal syntax over constructors
final ids = ['id1', 'id2'];           // ✅
final ids = List<String>();          // ❌

final config = {'key': 'value'};      // ✅
final config = Map<String, String>(); // ❌

final set = {1, 2, 3};                // ✅
final set = Set<int>();              // ❌
```

### String Handling

```dart
// Use single quotes for non-interpolated strings
const String APP_NAME = 'Care Nest Device Simulator';

// Use double quotes only for interpolation
final packet = '[3G*$deviceId*$length*$content]';

// Prefer string interpolation over concatenation
// ✅ Good: 'Device: $deviceId'
// ❌ Bad: 'Device: ' + deviceId

// Use raw strings when needed
final regex = RegExp(r'^\d{10,15}$');

// Use triple quotes for multi-line strings
const String DESCRIPTION = '''
This is a multi-line
string literal that
preserves newlines.
''';
```

---

## 4. Class & Widget Patterns

### ChangeNotifier (State Management)

```dart
// Proper ChangeNotifier structure
class DeviceProvider extends ChangeNotifier {
  // 1. Private fields with underscores
  DeviceConfig? _config;
  DeviceStatus _status = DeviceStatus.offline;
  final List<LogEntry> _logs = [];

  // 2. Public getters (immutable where possible)
  DeviceConfig? get config => _config;
  DeviceStatus get status => _status;
  List<LogEntry> get logs => List.unmodifiable(_logs);  // immutable view

  // 3. Initialization (constructor or factory)
  DeviceProvider();

  // 4. Public methods with clear intent
  void applyConfig(DeviceConfig cfg) {
    _config = cfg;
    _logs.clear();
    notifyListeners();
  }

  // 5. Private helper methods
  void _resetClient(DeviceConfig cfg) {
    _service?.disconnect();
    _service = TcpClientService(...);
  }

  // 6. Cleanup (if needed)
  @override
  void dispose() {
    _service?.disconnect();
    _sub?.cancel();
    super.dispose();
  }
}
```

### Stateless Widgets

```dart
class StatusHeader extends StatelessWidget {
  // Final, immutable fields
  final DeviceStatus status;
  final String? deviceId;
  final String? gatewayAddr;

  // Constructor with named parameters and super.key
  const StatusHeader({
    super.key,
    required this.status,
    this.deviceId,
    this.gatewayAddr,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      // Implementation
    );
  }
}

// Usage
StatusHeader(
  status: status,
  deviceId: config?.deviceId,
  gatewayAddr: '${config?.gatewayHost}:${config?.gatewayPort}',
)
```

### Stateful Widgets (Rare)

```dart
// Only use for widgets that need lifecycle management
class MyStatefulWidget extends StatefulWidget {
  const MyStatefulWidget({super.key});

  @override
  State<MyStatefulWidget> createState() => _MyStatefulWidgetState();
}

class _MyStatefulWidgetState extends State<MyStatefulWidget> {
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
```

### Sealed Classes (Type-Safe Events)

```dart
// Define base sealed class
sealed class ClientEvent {}

// Concrete implementations
class Connected extends ClientEvent {}

class Disconnected extends ClientEvent {
  final String reason;
  Disconnected(this.reason);
}

class Received extends ClientEvent {
  final String command;
  final String raw;
  Received(this.command, this.raw);
}

// Usage with exhaustiveness checking
void handleEvent(ClientEvent event) {
  // Dart won't allow fall-through; compiler enforces all cases
  if (event is Connected) {
    print('Connected');
  } else if (event is Disconnected) {
    print('Disconnected: ${event.reason}');
  } else if (event is Received) {
    print('Received: ${event.command}');
  }
}

// Or with pattern matching (Dart 3.0+)
void handleEventPatternMatch(ClientEvent event) {
  switch (event) {
    case Connected():
      print('Connected');
    case Disconnected(:final reason):
      print('Disconnected: $reason');
    case Received(:final command, :final raw):
      print('Received: $command - $raw');
  }
}
```

### Data Classes / Models

```dart
class DeviceConfig {
  final String deviceId;
  final String gatewayHost;
  final int gatewayPort;
  final bool autoReply;

  // Constructor
  DeviceConfig({
    required this.deviceId,
    required this.gatewayHost,
    required this.gatewayPort,
    this.autoReply = true,
  });

  // JSON serialization
  factory DeviceConfig.fromJson(Map<String, dynamic> json) {
    return DeviceConfig(
      deviceId: json['deviceId'] as String,
      gatewayHost: json['gatewayHost'] as String,
      gatewayPort: json['gatewayPort'] as int,
      autoReply: json['autoReply'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'deviceId': deviceId,
    'gatewayHost': gatewayHost,
    'gatewayPort': gatewayPort,
    'autoReply': autoReply,
  };

  // Validation
  static String? validateDeviceId(String value) {
    if (!RegExp(r'^\d{10,15}$').hasMatch(value)) {
      return 'Device ID must be 10-15 digits';
    }
    return null;
  }

  static String? validatePort(int value) {
    if (value < 1 || value > 65535) {
      return 'Port must be between 1 and 65535';
    }
    return null;
  }

  // Optional: equality and hashCode for testing
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DeviceConfig &&
          runtimeType == other.runtimeType &&
          deviceId == other.deviceId &&
          gatewayHost == other.gatewayHost &&
          gatewayPort == other.gatewayPort &&
          autoReply == other.autoReply;

  @override
  int get hashCode =>
      deviceId.hashCode ^
      gatewayHost.hashCode ^
      gatewayPort.hashCode ^
      autoReply.hashCode;
}
```

---

## 5. Error Handling

### Try-Catch Patterns

```dart
// Specific exception types
try {
  await socket.connect();
} on SocketException catch (e) {
  print('Socket error: ${e.message}');
  _emitEvent(ErrorEvent(e.message));
} on TimeoutException {
  print('Connection timeout');
  _emitEvent(Disconnected('connect timeout'));
} catch (e) {
  print('Unknown error: $e');
  _emitEvent(ErrorEvent(e.toString()));
} finally {
  // Cleanup (always executed)
}

// Avoid catching Exception if you can be specific
// ❌ Bad: catch (e) { /* ... */ }
// ✅ Good: catch (e) on SpecificException { /* ... */ }
```

### Result Types (Future Enhancement)

```dart
// For better error handling (Dart 3.0+ records)
typedef Result<T> = ({T value, String? error});

Result<DeviceConfig> loadConfig() {
  try {
    final config = _loadFromStorage();
    return (value: config, error: null);
  } catch (e) {
    return (value: null, error: e.toString());
  }
}

// Usage
final result = loadConfig();
if (result.error != null) {
  print('Error: ${result.error}');
} else {
  print('Loaded: ${result.value}');
}
```

### Custom Exceptions

```dart
// Define meaningful exception types
class DeviceSimulatorException implements Exception {
  final String message;
  DeviceSimulatorException(this.message);

  @override
  String toString() => 'DeviceSimulatorException: $message';
}

class ProtocolException extends DeviceSimulatorException {
  ProtocolException(String message) : super('Protocol error: $message');
}

class ConnectionException extends DeviceSimulatorException {
  ConnectionException(String message) : super('Connection error: $message');
}

// Usage
throw ProtocolException('Invalid packet format');
```

---

## 6. Documentation

### Code Comments

```dart
// Use /// for public API documentation
/// Builds a Wonlex protocol packet.
///
/// Encodes the device ID and content as:
/// [3G*{deviceId}*{LLLL}*{content}]
///
/// Throws [ArgumentError] if deviceId is invalid (not 10-15 digits).
///
/// Example:
/// ```dart
/// final packet = buildPacket('12345678901', 'LK,100,0,85');
/// // Returns: '[3G*12345678901*000E*LK,100,0,85]'
/// ```
String buildPacket(String deviceId, String content) {
  // Implementation
}

// Use // for single-line comments within functions
// Store the packet in the buffer for processing
_buffer += packet;

// Use TODO/FIXME for notes
// TODO: Add support for protocol version negotiation
// FIXME: Handle edge case when packet arrives mid-split

// Avoid obvious comments
// ❌ Bad: // Increment the counter
// counter++;

// ✅ Good: // Increment log ID for next entry
// _nextLogId++;
```

### Documentation Comments Rules

```dart
// 1. Public members: Use /// documentation
/// Public method description
void publicMethod() { }

// 2. Private members: Use // comments (optional)
// This is a helper for internal use
void _privateHelper() { }

// 3. Complex logic: Explain the WHY, not the WHAT
// Device ID validation follows Wonlex spec: 10-15 digits only
if (!RegExp(r'^\d{10,15}$').hasMatch(deviceId)) {
  throw ArgumentError('Invalid device ID');
}

// 4. Parameters and return types
/// Sends a sensor reading to the gateway.
///
/// Args:
///   - [deviceId]: The 10-15 digit device identifier
///   - [content]: The comma-separated command and parameters
///
/// Returns:
///   True if sent successfully, false if offline
///
/// Throws:
///   - [ProtocolException] if deviceId is invalid
Future<bool> send(String deviceId, String content) async {
  // Implementation
}
```

---

## 7. Testing Standards

### Unit Tests

```dart
// File: test/unit/services/wonlex_protocol_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:care_nest_device_simulator/services/wonlex_protocol.dart';

void main() {
  group('WonlexProtocol', () {
    group('buildPacket', () {
      test('should encode valid packet correctly', () {
        final packet = buildPacket('12345678901', 'LK,100,0,85');
        expect(packet, '[3G*12345678901*000E*LK,100,0,85]');
      });

      test('should calculate correct UTF-8 byte length', () {
        // Multi-byte UTF-8 character
        final packet = buildPacket('12345678901', '你好');
        expect(packet, '[3G*12345678901*0006*你好]');
      });

      test('should throw on invalid device ID', () {
        expect(
          () => buildPacket('123', 'content'),
          throwsA(isA<ArgumentError>()),
        );
      });
    });

    group('parsePacket', () {
      test('should parse valid packet', () {
        final result = parsePacket('[3G*12345678901*000E*LK,100,0,85]');
        expect(result, isNotNull);
        expect(result!.deviceId, '12345678901');
        expect(result.command, 'LK');
      });

      test('should return null for malformed packet', () {
        expect(parsePacket('[3G*broken'), isNull);
        expect(parsePacket('no brackets'), isNull);
      });
    });
  });
}
```

### Mock/Stub Patterns

```dart
// Mock Socket for TcpClientService testing
class MockSocket extends Mock implements Socket {}

void main() {
  group('TcpClientService', () {
    late MockSocket mockSocket;
    late TcpClientService service;

    setUp(() {
      mockSocket = MockSocket();
      service = TcpClientService(
        host: 'localhost',
        port: 9999,
        deviceId: '12345678901',
      );
    });

    test('should emit Connected event on successful connection', () async {
      when(mockSocket.connect(...)).thenAnswer((_) async {});
      
      expect(
        service.events,
        emits(isA<Connected>()),
      );
    });
  });
}
```

---

## 8. Performance & Optimization

### Memory Management

```dart
// 1. Avoid creating objects in tight loops
// ❌ Bad
for (int i = 0; i < logs.length; i++) {
  final LogEntry entry = logs[i];  // Creates new variable each iteration
}

// ✅ Good
for (final entry in logs) {
  // Use entry directly
}

// 2. Use const constructors where possible
class LogEntry {
  const LogEntry({required this.id, required this.timestamp});
}

// 3. Unsubscribe from streams
StreamSubscription? _subscription;

void _subscribe() {
  _subscription = stream.listen((_) { });
}

void dispose() {
  _subscription?.cancel();  // Prevent memory leak
}
```

### Lazy Initialization

```dart
// Use late final for expensive one-time initialization
late final TcpClientService _service = _initializeService();

TcpClientService _initializeService() {
  // Expensive initialization here
  return TcpClientService(...);
}
```

### Hot Reload Considerations

```dart
// Avoid static state in dev (doesn't hot reload)
// ❌ Bad in development
static final List<LogEntry> _allLogs = [];

// ✅ Good: Keep state in ChangeNotifier
class DeviceProvider extends ChangeNotifier {
  final List<LogEntry> _logs = [];
}
```

---

## 9. Code Review Checklist

Before submitting code for review:

- [ ] **Naming:** All variables, functions, classes follow conventions
- [ ] **Formatting:** Code is properly indented (2 spaces in Flutter)
- [ ] **Imports:** Organized and ordered (dart, flutter, packages, relative)
- [ ] **Comments:** Complex logic documented, public API has ///
- [ ] **Error Handling:** All exceptions caught and logged appropriately
- [ ] **Null Safety:** No unchecked null accesses, proper use of ? and !
- [ ] **Tests:** Unit tests written for new functions/classes
- [ ] **Performance:** No obvious inefficiencies (tight loops, memory leaks)
- [ ] **Accessibility:** Widget text is readable, colors have contrast
- [ ] **Security:** No hardcoded secrets, input validated
- [ ] **Consistency:** Matches existing codebase patterns
- [ ] **Documentation:** README updated if behavior changes

---

## 10. Linting Rules (analysis_options.yaml)

Current configuration enables:

```yaml
linter:
  rules:
    # Error rules
    - avoid_empty_else
    - avoid_null_checks_in_equality_operators
    - avoid_relative_lib_imports
    - avoid_returning_null
    - avoid_returning_null_for_future
    - avoid_returning_this
    - avoid_slow_async_io
    - cancel_subscriptions
    - close_sinks
    - comment_references
    - control_flow_in_finally
    - empty_statements
    - hash_and_equals
    - invariant_booleans
    - iterable_contains_unrelated_type
    - list_remove_unrelated_type
    - literal_only_boolean_expressions
    - no_adjacent_strings_in_list
    - no_duplicate_case_values
    - prefer_void_to_null
    - throw_in_finally
    - unnecessary_statements
    - unrelated_type_equality_checks

    # Style rules
    - always_declare_return_types
    - always_put_control_body_on_new_line
    - always_put_required_named_parameters_first
    - always_require_non_null_named_parameters
    - annotate_overrides
    - avoid_bool_literals_in_conditional_expressions
    - avoid_catches
    - avoid_catching_errors
    - avoid_classes_with_only_static_members
    - avoid_double_and_int_checks
    - avoid_field_initializers_in_const_classes
    - avoid_function_literals_in_foreach_calls
    - avoid_init_to_null
    - avoid_null_checks_in_equality_operators
    - avoid_positional_boolean_parameters
    - avoid_print
    - avoid_private_typedef_functions
    - avoid_redundant_argument_values
    - avoid_renaming_method_parameters
    - avoid_returning_null
    - avoid_returning_null_for_future
    - avoid_returning_this
    - avoid_setters_without_getters
    - avoid_shadowing_type_parameters
    - avoid_slow_async_io
    - avoid_types_as_parameter_names
    - avoid_types_on_closure_parameters
    - avoid_unnecessary_containers
    - avoid_unnecessary_parenthesis
    - avoid_unnecessary_to_list_in_spreads
    - avoid_web_libraries_in_flutter
    - await_only_futures
    - camel_case_extensions
    - camel_case_types
    - cascade_invocations
    - cast_nullable_to_non_nullable
    - close_sinks
    - collection_methods_unrelated_type
    - combinators_ordering
    - comment_references
    - conditional_uri_does_not_exist
    - constant_identifier_names
    - curly_braces_in_flow_control_structures
    - dangling_library_doc_comments
    - depend_on_referenced_packages
    - deprecated_consistency
    - directives_ordering
    - empty_catches
    - empty_constructor_bodies
    - eol_only_unix_line_endings
    - file_names
    - implementation_imports
    - leading_newlines_in_multiline_strings
    - library_names
    - library_prefixes
    - library_private_types_in_public_api
    - lines_longer_than_80_chars
    - no_leading_underscores_for_library_prefixes
    - no_leading_underscores_for_local_variables
    - null_closures
    - omit_local_variable_types
    - one_member_abstracts
    - only_throw_errors
    - overridden_fields
    - package_api_docs
    - package_names
    - package_prefixed_library_names
    - parameter_assignments
    - prefer_asserts_in_initializer_lists
    - prefer_asserts_with_message
    - prefer_adjacent_string_concatenation
    - prefer_collection_literals
    - prefer_conditional_assignment
    - prefer_const_constructors
    - prefer_const_constructors_in_immutables
    - prefer_const_declarations
    - prefer_const_literals_to_create_immutables
    - prefer_constructors_over_static_methods
    - prefer_contains
    - prefer_equal_for_default_values
    - prefer_expression_function_bodies
    - prefer_final_fields
    - prefer_final_in_for_each
    - prefer_final_locals
    - prefer_for_elements_to_map_fromIterable
    - prefer_foreach
    - prefer_function_declarations_over_variables
    - prefer_generic_function_type_aliases
    - prefer_if_elements_to_conditional_expressions
    - prefer_if_null_to_conditional_expressions
    - prefer_if_on_single_line_is_else
    - prefer_initializing_formals
    - prefer_inlined_adds
    - prefer_int_literals
    - prefer_interpolation_to_compose_strings
    - prefer_int_literals
    - prefer_is_empty
    - prefer_is_not_empty
    - prefer_is_not_operator
    - prefer_is_null_check_on_value_equality
    - prefer_iterable_whereType
    - prefer_null_aware_operators
    - prefer_null_coalescing_operator
    - prefer_relative_import_uri_to_library_packages
    - prefer_relative_imports
    - prefer_single_quotes
    - prefer_spread_collections
    - prefer_typing_uninitialized_variables
    - provide_deprecation_message
    - recursive_getters
    - sized_box_for_whitespace
    - sized_box_shrink_expand
    - sized_box_to_constrained_box
    - sort_child_properties_last
    - sort_constructors_first
    - sort_pub_dependencies
    - sort_unnamed_constructors_first
    - tighten_type_of_initializing_formals
    - type_annotate_public_apis
    - type_init_formals
    - unawaited_futures
    - unnecessary_await_in_return
    - unnecessary_brace_in_string_interps
    - unnecessary_const
    - unnecessary_constructor_name
    - unnecessary_getters_setters
    - unnecessary_lambdas
    - unnecessary_null_aware_assignments
    - unnecessary_null_checks
    - unnecessary_null_in_if_null_operators
    - unnecessary_null_to_getter_conversions
    - unnecessary_overrides
    - unnecessary_parenthesis
    - unnecessary_string_escapes
    - unnecessary_string_interpolations
    - unnecessary_to_list_in_spreads
    - unnecessary_wait_in_stream_literals
    - unrelated_type_equality_checks
    - unsafe_html
    - use_build_context_synchronously
    - use_full_hex_values_for_flutter_colors
    - use_function_type_syntax_for_parameters
    - use_getters_to_return_fields
    - use_if_null_to_convert_nullability
    - use_is_even_rather_than_modulo
    - use_key_in_widget_constructors
    - use_late_for_private_fields_and_variables
    - use_named_constants
    - use_raw_strings
    - use_rethrow_when_possible
    - use_setters_to_change_properties
    - use_string_buffers
    - use_test_throws_matchers
    - use_to_close_annotated_classes
    - use_to_parse_environment_declaration
    - void_checks
```

Run lint checks:

```bash
flutter analyze
dart analyze
```

---

## 11. Git Commit Standards

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation only
- **style:** Code style changes (formatting, semicolons, etc.)
- **refactor:** Code refactoring without feature changes
- **perf:** Performance improvement
- **test:** Adding or updating tests
- **chore:** Build, dependencies, tooling

### Examples

```
feat(tcp-client): add reconnection logic with exponential backoff

- Implement automatic reconnection on disconnect
- Add configurable retry attempts and delay
- Log reconnection attempts

Closes #42
```

```
fix(wonlex-protocol): correct UTF-8 byte length calculation

The previous implementation used string length instead of byte length,
causing incorrect packets for multi-byte UTF-8 characters.

Fixes #38
```

```
docs: update architecture documentation

- Add data flow diagrams
- Clarify module responsibilities
- Add security considerations
```

---

## 12. Version Management

### Versioning Scheme

Follow [Semantic Versioning](https://semver.org/):

```
<MAJOR>.<MINOR>.<PATCH>+<BUILD>
1.0.0+1
```

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)
- **BUILD:** Build metadata (incremented for each release)

Current version: **1.0.0**

---

## 13. Dependency Management

### Adding Dependencies

```bash
# Add stable package
flutter pub add provider

# Add dev dependency
flutter pub add --dev flutter_test

# Update packages
flutter pub upgrade

# Check for updates
flutter pub outdated
```

### Current Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
  provider: ^6.1.2
  shared_preferences: ^2.3.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0
```

### Dependency Standards

- Use stable, well-maintained packages only
- Pin major versions for stability
- Regular dependency audits for security
- Avoid vendoring (use pub packages)
- Prefer platform-native solutions over cross-platform alternatives when appropriate

---

## 14. Accessibility & Internationalization

### Accessibility (a11y)

```dart
// Always provide semantic labels
Tooltip(
  message: 'Clear all logs',
  child: IconButton(
    icon: const Icon(Icons.delete),
    onPressed: _clearLogs,
    tooltip: 'Clear logs (Ctrl+L)',
    semanticLabel: 'Clear device logs',
  ),
)

// Use meaningful text instead of icons alone
// ❌ Bad: IconButton(icon: Icons.circle)
// ✅ Good: IconButton(icon: Icons.circle, tooltip: 'Disconnect')

// Ensure color contrast (WCAG AA standard)
// ❌ Bad: Color(0xFFCCCCCC) on Color(0xFFDDDDDD)
// ✅ Good: AppColors.primary on AppColors.bgSurface
```

### Internationalization (i18n) - Future

When adding i18n:

```dart
// Use localization delegates
// Create lib/l10n/app_en.arb, app_es.arb, etc.
// Generate translation classes with: flutter gen-l10n

// Example usage:
Text(AppLocalizations.of(context)!.deviceId)
```

---

## 15. Common Pitfalls to Avoid

| Pitfall | Why Bad | Solution |
|---------|---------|----------|
| **Mutable globals** | State unpredictable, hard to test | Use ChangeNotifier, providers |
| **Catching Exception broadly** | Masks real bugs | Catch specific exception types |
| **Forgetting to unsubscribe** | Memory leaks, listeners pile up | Call `.cancel()` in `dispose()` |
| **Modifying lists while iterating** | IndexOutOfBoundsException | Create new list or use `.toList()` |
| **Hardcoded constants** | Not maintainable, repeated elsewhere | Use final consts at module level |
| **Widget rebuild on every frame** | Performance degradation | Use `const` constructors |
| **Async gaps in UI** | Stale data, race conditions | Use `.mounted` check in callbacks |
| **No error handling** | Crashes silently | Wrap futures in try-catch, listen to streams |
| **Deep nesting** | Hard to read and maintain | Extract to functions/widgets |
| **Magic numbers** | Intent unclear | Use named constants |

---

## Appendix: Tool Setup

### IDE Configuration (VS Code)

**.vscode/settings.json:**
```json
{
  "[dart]": {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.dart": true
    },
    "editor.defaultFormatter": "Dart-Code.dart-code"
  }
}
```

### IDE Configuration (Android Studio / IntelliJ)

- Install "Dart" and "Flutter" plugins
- Enable "Format code on save"
- Enable "Analyze on save"

### Command Line Tools

```bash
# Format all Dart files
dart format lib/

# Analyze codebase
dart analyze

# Run linter
flutter analyze

# Generate coverage
dart run coverage:test_with_coverage
```

---

## Change Log

### v1.0.0 (2026-05-11)
- Initial code standards document
- Dart/Flutter naming and organization conventions
- Class patterns (ChangeNotifier, sealed classes, models)
- Error handling strategies
- Testing patterns and mocks
- Documentation standards
- Commit message format
- Git and dependency management guidelines
