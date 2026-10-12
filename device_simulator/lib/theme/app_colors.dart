import 'package:flutter/material.dart';
import '../models/log_entry.dart';

class AppColors {
  static const bgScaffold = Color(0xFF0E1116);
  static const bgSurface = Color(0xFF161B22);
  static const bgLogPanel = Color(0xFF0A0D11);
  static const primary = Color(0xFF22D3EE);

  static const statusOffline = Color(0xFFEF4444);
  static const statusConnecting = Color(0xFFF59E0B);
  static const statusOnline = Color(0xFF22C55E);

  static const dirSent = Color(0xFF22D3EE);
  static const dirReceived = Color(0xFF22C55E);
  static const dirAlert = Color(0xFFEF4444);
  static const timestamp = Color(0xFF6B7280);

  static Color forStatus(DeviceStatus s) => switch (s) {
        DeviceStatus.offline => statusOffline,
        DeviceStatus.connecting => statusConnecting,
        DeviceStatus.online => statusOnline,
      };

  static Color forDirection(LogDirection d) => switch (d) {
        LogDirection.sent => dirSent,
        LogDirection.received => dirReceived,
        LogDirection.alert => dirAlert,
      };
}
