import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/device_config.dart';
import '../providers/device_provider.dart';
import '../services/config_storage.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _host = TextEditingController();
  final _port = TextEditingController();
  final _device = TextEditingController();
  final _storage = ConfigStorage();
  bool _loading = false;
  DeviceType _deviceType = DeviceType.wonlex;
  List<DeviceConfig> _history = [];

  @override
  void initState() {
    super.initState();
    final cfg = context.read<DeviceProvider>().config ?? DeviceConfig.defaults;
    _fillForm(cfg);
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final history = await _storage.loadHistory();
    if (mounted) setState(() => _history = history);
  }

  void _fillForm(DeviceConfig cfg) {
    _host.text = cfg.host;
    _port.text = cfg.port.toString();
    _device.text = cfg.deviceId;
    setState(() => _deviceType = cfg.deviceType);
  }

  @override
  void dispose() {
    _host.dispose();
    _port.dispose();
    _device.dispose();
    super.dispose();
  }

  Future<void> _onStart() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final cfg = DeviceConfig(
      host: _host.text.trim(),
      port: int.parse(_port.text.trim()),
      deviceId: _device.text.trim(),
      deviceType: _deviceType,
    );
    await _storage.save(cfg);
    if (!mounted) return;
    final provider = context.read<DeviceProvider>();
    provider.applyConfig(cfg);
    provider.connect();
  }

  String _historyLabel(DeviceConfig cfg) =>
      '${cfg.host}:${cfg.port} · ${cfg.deviceId} (${cfg.deviceType.name})';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mock Device Simulator — Setup')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Card(
            margin: const EdgeInsets.all(24),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_history.isNotEmpty) ...[
                      DropdownButtonFormField<int>(
                        decoration: const InputDecoration(
                          labelText: 'Recent configs',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.history),
                        ),
                        isExpanded: true,
                        initialValue: null,
                        hint: const Text('Select a past config…'),
                        items: List.generate(
                          _history.length,
                          (i) => DropdownMenuItem(
                            value: i,
                            child: Text(
                              _historyLabel(_history[i]),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                        onChanged: (i) {
                          if (i != null) _fillForm(_history[i]);
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _host,
                      decoration: const InputDecoration(
                        labelText: 'Gateway Host',
                        border: OutlineInputBorder(),
                      ),
                      textInputAction: TextInputAction.next,
                      validator: DeviceConfig.validateHost,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _port,
                      decoration: const InputDecoration(
                        labelText: 'Gateway Port',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.next,
                      validator: DeviceConfig.validatePort,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _device,
                      decoration: const InputDecoration(
                        labelText: 'Device ID',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.next,
                      validator: DeviceConfig.validateDeviceId,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<DeviceType>(
                      initialValue: _deviceType,
                      decoration: const InputDecoration(
                        labelText: 'Device Type',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: DeviceType.wonlex,
                          child: Text('Wonlex'),
                        ),
                        DropdownMenuItem(
                          value: DeviceType.nanway,
                          child: Text('Nanway'),
                        ),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => _deviceType = v);
                      },
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Defaults: 34.68.90.149:12345 · 1378365340',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey,
                          ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _loading ? null : _onStart,
                      child: Text(_loading ? 'Starting…' : 'Start'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
