import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/device_config.dart';
import '../models/log_entry.dart';
import '../services/tcp_client_service.dart';

class DeviceProvider extends ChangeNotifier {
  DeviceConfig? _config;
  DeviceStatus _status = DeviceStatus.offline;
  final List<LogEntry> _logs = [];
  bool _showSettings = true;
  int _nextLogId = 0;
  int _batteryLevel = 85;

  TcpClientService? _service;
  StreamSubscription<ClientEvent>? _sub;
  Timer? _lkTimer;

  DeviceConfig? get config => _config;
  DeviceStatus get status => _status;
  List<LogEntry> get logs => List.unmodifiable(_logs);
  bool get showSettings => _showSettings;
  int get batteryLevel => _batteryLevel;

  void setBatteryLevel(int level) {
    _batteryLevel = level.clamp(0, 100);
    notifyListeners();
  }

  void applyConfig(DeviceConfig cfg) {
    _config = cfg;
    _logs.clear();
    _showSettings = false;
    _resetClient(cfg);
    notifyListeners();
  }

  Future<void> connect() async {
    if (_status == DeviceStatus.offline && _service != null) {
      _status = DeviceStatus.connecting;
      notifyListeners();
      await _service!.connect();
    }
  }

  void disconnect() => _service?.disconnect();

  void openSettings() {
    disconnect();
    _showSettings = true;
    notifyListeners();
  }

  void clearLogs() {
    _logs.clear();
    notifyListeners();
  }

  void sendLk({int steps = 0, int overturn = 0, int battery = 85}) {
    if (_status == DeviceStatus.online) _service?.sendLK(steps, overturn, battery);
  }

  void sendBphrt({
    int high = 120,
    int low = 80,
    int hr = 72,
    int height = 170,
    int gender = 1,
    int age = 30,
    int weight = 65,
  }) {
    if (_status == DeviceStatus.online) {
      _service?.sendBPHRT(high, low, hr, height, gender, age, weight);
    }
  }

  void sendOxygen({int type = 0, double oxy = 98.0}) {
    if (_status == DeviceStatus.online) _service?.sendOxygen(type, oxy);
  }

  void sendBtemp2({int type = 0, double temp = 36.6}) {
    if (_status == DeviceStatus.online) _service?.sendBtemp2(type, temp);
  }

  void sendUd({
    required double lat,
    required double lon,
    bool gpsFix = false,
    double speed = 0,
    double direction = 0,
    double altitude = 0,
    int satellites = 0,
    int gsmSignal = 74,
    int battery = 85,
    int steps = 0,
  }) {
    if (_status == DeviceStatus.online) {
      _service?.sendUD(
        lat: lat, lon: lon, gpsFix: gpsFix,
        speed: speed, direction: direction, altitude: altitude,
        satellites: satellites, gsmSignal: gsmSignal,
        battery: battery, steps: steps,
      );
    }
  }

  void sendPhbxOk() {
    if (_status == DeviceStatus.online) _service?.sendPhbx(1);
  }

  void sendPhbxFail() {
    if (_status == DeviceStatus.online) _service?.sendPhbx(0);
  }

  void sendRaw(String command) {
    if (_status == DeviceStatus.online) _service?.sendRaw(command);
  }

  void _resetClient(DeviceConfig cfg) {
    _sub?.cancel();
    _service?.dispose();
    _service = TcpClientService(
      host: cfg.host,
      port: cfg.port,
      deviceId: cfg.deviceId,
    );
    _sub = _service!.events.listen(_onEvent);
  }

  void _onEvent(ClientEvent e) {
    switch (e) {
      case Connected():
        _status = DeviceStatus.online;
        _appendLog(LogDirection.sent, '[connected]');
        _service?.sendLK(0, 0, _batteryLevel);
        _lkTimer = Timer.periodic(const Duration(minutes: 1), (_) {
          if (_status == DeviceStatus.online) _service?.sendLK(0, 0, _batteryLevel);
        });
        notifyListeners();
      case Disconnected(:final reason):
        _lkTimer?.cancel();
        _lkTimer = null;
        _status = DeviceStatus.offline;
        _appendLog(LogDirection.alert, '[disconnected: $reason]');
        notifyListeners();
      case Sent(:final raw):
        _appendLog(LogDirection.sent, raw);
      case Received(:final command, :final raw):
        _appendLog(LogDirection.received, raw);
        const echoCommands = {
          'RESET', 'POWEROFF', 'SILENCETIME2', 'WALKTIME',
          'FALLDOWN', 'LSSET', 'hrtstart', 'BTTIMESET', 'BTWARNSET',
          'bodytemp', 'bodytemp2', 'profile', 'FLOWER', 'FACTORY',
          'MESSAGE', 'TKQ', 'TKQ2', 'SCHEDULE', 'REMIND', 'FIND',
          'SLEEPTIME', 'CR', 'REMOVE', 'REMOVESMS', 'LOWBAT', 'SOSSMS',
          'CENTER', 'ZONE', 'LANG', 'SOS', 'MONITOR', 'UPLOAD',
        };
        if (echoCommands.contains(command)) {
          _service?.sendEcho(command);
        } else if (command == 'VERNO') {
          _service?.sendVERNO();
        } else if (command == 'phbx') {
          _service?.sendPhbx(1);
        }
      case ParseError(:final raw):
        _appendLog(LogDirection.alert, '[parse error] $raw');
      case ErrorEvent(:final message):
        _appendLog(LogDirection.alert, '[error] $message');
    }
  }

  void _appendLog(LogDirection dir, String raw) {
    if (_logs.length >= 500) _logs.removeAt(0);
    _logs.add(LogEntry(
      id: _nextLogId++,
      ts: formatTimestamp(DateTime.now()),
      direction: dir,
      raw: raw,
    ));
    notifyListeners();
  }

  @override
  void dispose() {
    _lkTimer?.cancel();
    _sub?.cancel();
    _service?.dispose();
    super.dispose();
  }
}
