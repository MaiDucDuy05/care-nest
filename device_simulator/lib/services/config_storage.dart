import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/device_config.dart';

class ConfigStorage {
  static const _key = 'device_config_v1';
  static const _historyKey = 'device_config_history_v1';
  static const _maxHistory = 10;

  Future<DeviceConfig?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return null;
    try {
      return DeviceConfig.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<List<DeviceConfig>> loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_historyKey);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => DeviceConfig.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> save(DeviceConfig cfg) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(cfg.toJson()));
    await _addToHistory(prefs, cfg);
  }

  Future<void> _addToHistory(SharedPreferences prefs, DeviceConfig cfg) async {
    final history = await loadHistory();
    // Remove duplicate (same host+port+deviceId+type)
    history.removeWhere((e) =>
        e.host == cfg.host &&
        e.port == cfg.port &&
        e.deviceId == cfg.deviceId &&
        e.deviceType == cfg.deviceType);
    history.insert(0, cfg);
    if (history.length > _maxHistory) history.removeLast();
    await prefs.setString(
      _historyKey,
      jsonEncode(history.map((e) => e.toJson()).toList()),
    );
  }
}
