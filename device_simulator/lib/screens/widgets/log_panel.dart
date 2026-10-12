import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/log_entry.dart';
import '../../providers/device_provider.dart';
import '../../theme/app_colors.dart';

class LogPanel extends StatefulWidget {
  const LogPanel({super.key});

  @override
  State<LogPanel> createState() => _LogPanelState();
}

class _LogPanelState extends State<LogPanel> {
  final _scrollController = ScrollController();
  int _lastLogLength = 0;

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final logs = context.watch<DeviceProvider>().logs;

    if (logs.length != _lastLogLength) {
      _lastLogLength = logs.length;
      _scrollToBottom();
    }

    if (logs.isEmpty) {
      return Container(
        color: AppColors.bgLogPanel,
        alignment: Alignment.center,
        child: Text(
          'No log entries yet — press C to connect',
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: 13,
            color: Colors.grey[600],
          ),
        ),
      );
    }

    return Container(
      color: AppColors.bgLogPanel,
      child: ListView.builder(
        controller: _scrollController,
        itemCount: logs.length,
        itemBuilder: (context, index) => _LogRow(entry: logs[index]),
      ),
    );
  }
}

class _LogRow extends StatelessWidget {
  final LogEntry entry;

  const _LogRow({required this.entry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            entry.ts,
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 12,
              color: AppColors.timestamp,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            entry.direction.glyph,
            style: TextStyle(
              fontFamily: 'monospace',
              fontSize: 12,
              color: AppColors.forDirection(entry.direction),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              entry.raw,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
