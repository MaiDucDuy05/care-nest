enum DeviceStatus { offline, connecting, online }

enum LogDirection {
  sent,
  received,
  alert;

  String get glyph => switch (this) {
        LogDirection.sent => '→',
        LogDirection.received => '←',
        LogDirection.alert => '!',
      };
}

class LogEntry {
  final int id;
  final String ts;
  final LogDirection direction;
  final String raw;

  const LogEntry({
    required this.id,
    required this.ts,
    required this.direction,
    required this.raw,
  });
}

String formatTimestamp(DateTime now) {
  final h = now.hour.toString().padLeft(2, '0');
  final m = now.minute.toString().padLeft(2, '0');
  final s = now.second.toString().padLeft(2, '0');
  return '$h:$m:$s';
}
