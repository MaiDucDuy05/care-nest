import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/log_entry.dart';
import '../../providers/device_provider.dart';

class ActionButtons extends StatefulWidget {
  const ActionButtons({super.key});

  @override
  State<ActionButtons> createState() => _ActionButtonsState();
}

class _ActionButtonsState extends State<ActionButtons> {
  final _rawCmd = TextEditingController(text: 'LK,0,0,85');
  // BPHRT — persisted between dialog opens
  final _bpHigh = TextEditingController(text: '120');
  final _bpLow = TextEditingController(text: '80');
  final _bpHr = TextEditingController(text: '72');
  final _bpHeight = TextEditingController(text: '170');
  final _bpGender = TextEditingController(text: '1');
  final _bpAge = TextEditingController(text: '30');
  final _bpWeight = TextEditingController(text: '65');
  // Oxygen
  final _oxType = TextEditingController(text: '0');
  final _oxOxy = TextEditingController(text: '98.0');
  // Btemp2
  final _tmpType = TextEditingController(text: '0');
  final _tmpTemp = TextEditingController(text: '36.6');
  // RYIMEI
  final _ryimeiImei = TextEditingController(text: '355913786386594');
  // UD
  final _udLat = TextEditingController(text: '21.020414');
  final _udLon = TextEditingController(text: '105.791226');
  final _udFix = TextEditingController(text: 'V');
  final _udSpeed = TextEditingController(text: '0');
  final _udDir = TextEditingController(text: '0');
  final _udAlt = TextEditingController(text: '0');
  final _udSats = TextEditingController(text: '0');
  final _udGsm = TextEditingController(text: '74');
  final _udBattery = TextEditingController(text: '85');
  final _udSteps = TextEditingController(text: '0');

  @override
  void dispose() {
    for (final c in [
      _rawCmd,
      _bpHigh, _bpLow, _bpHr, _bpHeight, _bpGender, _bpAge, _bpWeight,
      _oxType, _oxOxy, _tmpType, _tmpTemp,
      _ryimeiImei,
      _udLat, _udLon, _udFix, _udSpeed, _udDir, _udAlt, _udSats, _udGsm, _udBattery, _udSteps,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
    );
  }

  int? _parseInt(TextEditingController c, String label) {
    final v = int.tryParse(c.text.trim());
    if (v == null) _showError('$label must be an integer');
    return v;
  }

  double? _parseDouble(TextEditingController c, String label) {
    final v = double.tryParse(c.text.trim());
    if (v == null) _showError('$label must be a number');
    return v;
  }

  void _showBatteryPopup(BuildContext btnCtx, DeviceProvider p) {
    final box = btnCtx.findRenderObject()! as RenderBox;
    final offset = box.localToGlobal(Offset.zero);
    final size = box.size;
    final screenWidth = MediaQuery.of(btnCtx).size.width;

    showMenu<void>(
      context: btnCtx,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      position: RelativeRect.fromLTRB(
        offset.dx,
        offset.dy,
        screenWidth - (offset.dx + size.width),
        0,
      ),
      items: [
        _BatteryMenuItem(
          initialValue: p.batteryLevel.toDouble(),
          onSet: (v) => p.setBatteryLevel(v),
        ),
      ],
    );
  }

  void _showParamDialog({
    required String title,
    required List<_Field> fields,
    required VoidCallback onSend,
  }) {
    showDialog<void>(
      context: context,
      builder: (ctx) => _ParamDialog(
        title: title,
        fields: fields,
        onSend: () {
          onSend();
          Navigator.pop(ctx);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = context.watch<DeviceProvider>();
    final online = p.status == DeviceStatus.online;
    final offline = p.status == DeviceStatus.offline;

    return Container(
      color: const Color(0xFF161B22),
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _Btn('Connect', offline ? p.connect : null),
              _Btn('Disconnect', !offline ? p.disconnect : null),
              _Btn('Clear Log', p.clearLogs),
              _Btn('Settings', p.openSettings),
            ],
          ),
          const Divider(height: 16, color: Color(0xFF30363D)),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Builder(
                builder: (btnCtx) => _Btn(
                  'LK Battery',
                  () => _showBatteryPopup(btnCtx, p),
                ),
              ),
              _Btn(
                'Raw',
                online
                    ? () => _showParamDialog(
                          title: 'Raw Command',
                          fields: [_Field('Command', _rawCmd)],
                          onSend: () {
                            final cmd = _rawCmd.text.trim();
                            if (cmd.isNotEmpty) p.sendRaw(cmd);
                          },
                        )
                    : null,
              ),
              _Btn(
                'BPHRT',
                online
                    ? () => _showParamDialog(
                          title: 'BPHRT',
                          fields: [
                            _Field('High', _bpHigh),
                            _Field('Low', _bpLow),
                            _Field('HR', _bpHr),
                            _Field('Height', _bpHeight),
                            _Field('Gender', _bpGender),
                            _Field('Age', _bpAge),
                            _Field('Weight', _bpWeight),
                          ],
                          onSend: () {
                            final vals = [
                              _parseInt(_bpHigh, 'High'),
                              _parseInt(_bpLow, 'Low'),
                              _parseInt(_bpHr, 'HR'),
                              _parseInt(_bpHeight, 'Height'),
                              _parseInt(_bpGender, 'Gender'),
                              _parseInt(_bpAge, 'Age'),
                              _parseInt(_bpWeight, 'Weight'),
                            ];
                            if (vals.every((v) => v != null)) {
                              p.sendBphrt(
                                high: vals[0]!, low: vals[1]!, hr: vals[2]!,
                                height: vals[3]!, gender: vals[4]!,
                                age: vals[5]!, weight: vals[6]!,
                              );
                            }
                          },
                        )
                    : null,
              ),
              _Btn(
                'Oxygen',
                online
                    ? () => _showParamDialog(
                          title: 'Oxygen',
                          fields: [
                            _Field('type', _oxType),
                            _Field('oxy', _oxOxy),
                          ],
                          onSend: () {
                            final t = _parseInt(_oxType, 'type');
                            final o = _parseDouble(_oxOxy, 'oxy');
                            if (t != null && o != null) p.sendOxygen(type: t, oxy: o);
                          },
                        )
                    : null,
              ),
              _Btn(
                'Btemp2',
                online
                    ? () => _showParamDialog(
                          title: 'Btemp2',
                          fields: [
                            _Field('Type', _tmpType),
                            _Field('Temp', _tmpTemp),
                          ],
                          onSend: () {
                            final t = _parseInt(_tmpType, 'Type');
                            final temp = _parseDouble(_tmpTemp, 'Temp');
                            if (t != null && temp != null) p.sendBtemp2(type: t, temp: temp);
                          },
                        )
                    : null,
              ),
              _Btn(
                'RYIMEI',
                online
                    ? () => _showParamDialog(
                          title: 'RYIMEI',
                          fields: [_Field('IMEI', _ryimeiImei)],
                          onSend: () {
                            final imei = _ryimeiImei.text.trim();
                            if (imei.isNotEmpty) p.sendRaw('RYIMEI,$imei');
                          },
                        )
                    : null,
              ),
              _Btn(
                'UD',
                online
                    ? () => _showParamDialog(
                          title: 'UD (Location)',
                          fields: [
                            _Field('Lat', _udLat),
                            _Field('Lon', _udLon),
                            _Field('Fix (A/V)', _udFix),
                            _Field('Speed', _udSpeed),
                            _Field('Direction', _udDir),
                            _Field('Altitude', _udAlt),
                            _Field('Satellites', _udSats),
                            _Field('GSM Signal', _udGsm),
                            _Field('Battery', _udBattery),
                            _Field('Steps', _udSteps),
                          ],
                          onSend: () {
                            final lat = _parseDouble(_udLat, 'Lat');
                            final lon = _parseDouble(_udLon, 'Lon');
                            final speed = _parseDouble(_udSpeed, 'Speed');
                            final dir = _parseDouble(_udDir, 'Direction');
                            final alt = _parseDouble(_udAlt, 'Altitude');
                            final sats = _parseInt(_udSats, 'Satellites');
                            final gsm = _parseInt(_udGsm, 'GSM Signal');
                            final bat = _parseInt(_udBattery, 'Battery');
                            final steps = _parseInt(_udSteps, 'Steps');
                            if (lat != null && lon != null && speed != null &&
                                dir != null && alt != null && sats != null &&
                                gsm != null && bat != null && steps != null) {
                              p.sendUd(
                                lat: lat, lon: lon,
                                gpsFix: _udFix.text.trim().toUpperCase() == 'A',
                                speed: speed, direction: dir, altitude: alt,
                                satellites: sats, gsmSignal: gsm,
                                battery: bat, steps: steps,
                              );
                            }
                          },
                        )
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Field {
  final String label;
  final TextEditingController controller;
  const _Field(this.label, this.controller);
}

class _ParamDialog extends StatelessWidget {
  final String title;
  final List<_Field> fields;
  final VoidCallback onSend;

  const _ParamDialog({
    required this.title,
    required this.fields,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        title,
        style: const TextStyle(fontFamily: 'monospace', fontSize: 14),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: fields
              .map(
                (f) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: TextField(
                    controller: f.controller,
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                    decoration: InputDecoration(
                      labelText: f.label,
                      labelStyle: const TextStyle(fontSize: 12),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel', style: TextStyle(fontFamily: 'monospace')),
        ),
        FilledButton(
          onPressed: onSend,
          child: const Text('Send', style: TextStyle(fontFamily: 'monospace')),
        ),
      ],
    );
  }
}

class _BatteryMenuItem extends PopupMenuEntry<Never> {
  final double initialValue;
  final ValueChanged<int> onSet;

  const _BatteryMenuItem({required this.initialValue, required this.onSet});

  @override
  double get height => 48;

  @override
  bool represents(Never? value) => false;

  @override
  State<_BatteryMenuItem> createState() => _BatteryMenuItemState();
}

class _BatteryMenuItemState extends State<_BatteryMenuItem> {
  late double _value;

  @override
  void initState() {
    super.initState();
    _value = widget.initialValue;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 280,
      height: 48,
      child: Row(
        children: [
          const SizedBox(width: 12),
          const Text(
            'Bat',
            style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: Color(0xFF8B949E)),
          ),
          Expanded(
            child: Slider(
              value: _value,
              min: 0,
              max: 100,
              divisions: 100,
              onChanged: (v) => setState(() => _value = v),
            ),
          ),
          SizedBox(
            width: 32,
            child: Text(
              '${_value.round()}%',
              style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
              textAlign: TextAlign.right,
            ),
          ),
          TextButton(
            onPressed: () {
              widget.onSet(_value.round());
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(
              minimumSize: const Size(0, 28),
              padding: const EdgeInsets.symmetric(horizontal: 10),
              textStyle: const TextStyle(fontFamily: 'monospace', fontSize: 11),
            ),
            child: const Text('OK'),
          ),
          const SizedBox(width: 4),
        ],
      ),
    );
  }
}

class _Btn extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;

  const _Btn(this.label, this.onPressed);

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
        minimumSize: const Size(60, 36),
        textStyle: const TextStyle(fontFamily: 'monospace', fontSize: 11),
      ),
      child: Text(label),
    );
  }
}
