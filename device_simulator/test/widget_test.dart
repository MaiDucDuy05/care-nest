import 'package:flutter_test/flutter_test.dart';
import 'package:care_nest_device_simulator/services/wonlex_protocol.dart';

void main() {
  group('buildPacket', () {
    test('produces correct format with uppercase hex length', () {
      final result = buildPacket('1378365340', 'LK,0,0,85');
      expect(result, '[3G*1378365340*0009*LK,0,0,85]');
    });

    test('throws ArgumentError for invalid deviceId', () {
      expect(() => buildPacket('123', 'LK'), throwsArgumentError);
    });

    test('throws for empty deviceId', () {
      expect(() => buildPacket('', 'LK'), throwsArgumentError);
    });
  });

  group('parsePacket', () {
    test('parses a valid packet', () {
      final result = parsePacket('[3G*123*0005*RESET]');
      expect(result, isNotNull);
      expect(result!.deviceId, '123');
      expect(result.command, 'RESET');
    });

    test('returns null for garbage input', () {
      expect(parsePacket('garbage'), isNull);
    });

    test('returns null for missing brackets', () {
      expect(parsePacket('3G*123*0005*RESET'), isNull);
    });

    test('returns null for too few parts', () {
      expect(parsePacket('[3G*123*RESET]'), isNull);
    });

    test('round-trips through buildPacket', () {
      final raw = buildPacket('1378365340', 'LK,0,0,85');
      final parsed = parsePacket(raw);
      expect(parsed, isNotNull);
      expect(parsed!.command, 'LK');
    });

    test('handles content with embedded asterisks', () {
      // command = first comma-separated token; asterisks in content are preserved
      final raw = buildPacket('1234567890', 'a*b*c');
      final parsed = parsePacket(raw);
      expect(parsed!.command, 'a*b*c');
    });
  });
}
