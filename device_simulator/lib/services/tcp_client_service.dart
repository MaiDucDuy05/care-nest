import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'wonlex_protocol.dart';

sealed class ClientEvent {}

class Connected extends ClientEvent {}

class Disconnected extends ClientEvent {
  final String reason;
  Disconnected(this.reason);
}

class Sent extends ClientEvent {
  final String raw;
  Sent(this.raw);
}

class Received extends ClientEvent {
  final String command;
  final String raw;
  Received(this.command, this.raw);
}

class ParseError extends ClientEvent {
  final String raw;
  ParseError(this.raw);
}

class ErrorEvent extends ClientEvent {
  final String message;
  ErrorEvent(this.message);
}

const _maxBuffer = 4096;

class TcpClientService {
  final String _host;
  final int _port;
  final String _deviceId;

  Socket? _socket;
  String _buffer = '';
  final _controller = StreamController<ClientEvent>.broadcast();

  TcpClientService({
    required String host,
    required int port,
    required String deviceId,
  })  : _host = host,
        _port = port,
        _deviceId = deviceId;

  Stream<ClientEvent> get events => _controller.stream;

  Future<void> connect() async {
    disconnect();
    try {
      final s = await Socket.connect(
        _host,
        _port,
        timeout: const Duration(seconds: 10),
      );
      _socket = s;
      _emit(Connected());
      s.listen(
        _onData,
        onError: (e) => _emit(ErrorEvent(e.toString())),
        onDone: () {
          _socket = null;
          _emit(Disconnected('connection closed'));
        },
        cancelOnError: false,
      );
    } on TimeoutException {
      _emit(Disconnected('connect timeout'));
    } on SocketException catch (e) {
      _emit(ErrorEvent(e.message));
      _emit(Disconnected('connection failed'));
    }
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.destroy();
      _socket = null;
    }
  }

  void sendLK(int steps, int overturn, int battery) =>
      _write('LK,$steps,$overturn,$battery');

  void sendBPHRT(
          int highBp, int lowBp, int hr, int height, int gender, int age, int weight) =>
      _write('bphrt,$highBp,$lowBp,$hr,$height,$gender,$age,$weight');

  void sendEcho(String command) => _write(command);

  void sendOxygen(int type, double oxy) => _write('oxygen,$type,$oxy');

  void sendVERNO() => _write('VERNO,G29_BASE_V1.00_2014.04.23_17.46.49');

  void sendBtemp2(int type, double temp) => _write('btemp2,$type,$temp');

  void sendPhbx(int status) => _write('phbx,$status');

  void sendUD({
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
    final now = DateTime.now().toUtc();
    final date =
        '${now.day.toString().padLeft(2, '0')}${now.month.toString().padLeft(2, '0')}${(now.year % 100).toString().padLeft(2, '0')}';
    final time =
        '${now.hour.toString().padLeft(2, '0')}${now.minute.toString().padLeft(2, '0')}${now.second.toString().padLeft(2, '0')}';
    final fix = gpsFix ? 'A' : 'V';
    final absLat = lat.abs();
    final absLon = lon.abs();
    final latDir = lat >= 0 ? 'N' : 'S';
    final lonDir = lon >= 0 ? 'E' : 'W';
    _write(
      'UD,$date,$time,$fix,'
      '$absLat,$latDir,$absLon,$lonDir,'
      '$speed,$direction,$altitude,$satellites,'
      '$gsmSignal,$battery,$steps,'
      '0,00000000,0,0,0',
    );
  }

  void sendRaw(String command) => _write(command.trim());

  void dispose() => _controller.close();

  void _emit(ClientEvent event) {
    if (!_controller.isClosed) _controller.add(event);
  }

  void _write(String content) {
    final sock = _socket;
    if (sock == null) {
      _emit(ErrorEvent('not connected'));
      return;
    }
    final raw = buildPacket(_deviceId, content);
    sock.write(raw);
    _emit(Sent(raw));
  }

  void _onData(List<int> chunk) {
    _buffer += utf8.decode(chunk, allowMalformed: true);
    if (_buffer.length > _maxBuffer) {
      _emit(ErrorEvent('receive buffer overflow, flushing'));
      _buffer = '';
      return;
    }
    final result = _extractPackets(_buffer);
    _buffer = result.$2;
    for (final raw in result.$1) {
      final parsed = parsePacket(raw);
      if (parsed == null) {
        _emit(ParseError(raw));
      } else {
        _emit(Received(parsed.command, raw));
      }
    }
  }

  (List<String>, String) _extractPackets(String buffer) {
    final packets = <String>[];
    var i = 0;
    while (i < buffer.length) {
      final start = buffer.indexOf('[', i);
      if (start == -1) break;
      final end = buffer.indexOf(']', start);
      if (end == -1) return (packets, buffer.substring(start));
      packets.add(buffer.substring(start, end + 1));
      i = end + 1;
    }
    return (packets, '');
  }
}
