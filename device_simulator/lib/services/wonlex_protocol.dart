import 'dart:convert';

// Packet format: [3G*{deviceId}*{LLLL}*{content}]
// LLLL = 4-digit uppercase hex of content byte length (UTF-8)

final _deviceIdRe = RegExp(r'^\d{10,15}$');

/// Build a packet the mock device sends to the server.
/// Throws [ArgumentError] for invalid deviceId.
String buildPacket(String deviceId, String content) {
  if (!_deviceIdRe.hasMatch(deviceId)) {
    throw ArgumentError('Invalid deviceId: "$deviceId" — must be 10-15 digits');
  }
  final byteLen = utf8.encode(content).length;
  final len = byteLen.toRadixString(16).padLeft(4, '0').toUpperCase();
  return '[3G*$deviceId*$len*$content]';
}

/// Parse a raw packet from the server. Returns null if malformed.
({String deviceId, String command})? parsePacket(String raw) {
  final trimmed = raw.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;
  final body = trimmed.substring(1, trimmed.length - 1);
  final parts = body.split('*');
  if (parts.length < 4) return null;
  final deviceId = parts[1];
  final content = parts.sublist(3).join('*');
  final command = content.split(',').first;
  return (deviceId: deviceId, command: command);
}
