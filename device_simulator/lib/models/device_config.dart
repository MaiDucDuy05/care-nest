enum DeviceType { wonlex, nanway }

class DeviceConfig {
  final String host;
  final int port;
  final String deviceId;
  final DeviceType deviceType;

  const DeviceConfig({
    required this.host,
    required this.port,
    required this.deviceId,
    this.deviceType = DeviceType.wonlex,
  });

  static const defaults = DeviceConfig(
    host: '34.68.90.149',
    port: 12345,
    deviceId: '1378365340',
    deviceType: DeviceType.wonlex,
  );

  Map<String, dynamic> toJson() => {
        'host': host,
        'port': port,
        'deviceId': deviceId,
        'deviceType': deviceType.name,
      };

  factory DeviceConfig.fromJson(Map<String, dynamic> json) => DeviceConfig(
        host: json['host'] as String,
        port: json['port'] as int,
        deviceId: json['deviceId'] as String,
        deviceType: DeviceType.values.firstWhere(
          (e) => e.name == json['deviceType'],
          orElse: () => DeviceType.wonlex,
        ),
      );

  static String? validateHost(String? v) =>
      (v?.trim().isEmpty ?? true) ? 'Host cannot be empty' : null;

  static String? validatePort(String? v) {
    final n = int.tryParse(v?.trim() ?? '');
    return (n == null || n < 1 || n > 65535) ? 'Port must be 1-65535' : null;
  }

  static String? validateDeviceId(String? v) =>
      RegExp(r'^\d{10,15}$').hasMatch(v?.trim() ?? '')
          ? null
          : 'Must be 10-15 digits';
}
