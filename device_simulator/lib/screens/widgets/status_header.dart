import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/device_provider.dart';
import '../../theme/app_colors.dart';

class StatusHeader extends StatelessWidget {
  const StatusHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeviceProvider>();
    final status = provider.status;
    final config = provider.config;
    final deviceId = config?.deviceId ?? '—';
    final host = config?.host ?? '—';
    final port = config?.port;
    final deviceType = config?.deviceType.name.toUpperCase() ?? '—';

    return Container(
      height: 56,
      color: AppColors.bgSurface,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Text(
            'Mock Device Simulator',
            style: const TextStyle(
              fontFamily: 'monospace',
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 24),
          _InfoChip(label: 'ID', value: deviceId),
          const SizedBox(width: 12),
          _InfoChip(label: 'Host', value: port != null ? '$host:$port' : host),
          const SizedBox(width: 12),
          _InfoChip(label: 'Type', value: deviceType),
          const Spacer(),
          Icon(Icons.circle, size: 10, color: AppColors.forStatus(status)),
          const SizedBox(width: 6),
          Text(
            status.name.toUpperCase(),
            style: TextStyle(
              fontFamily: 'monospace',
              fontSize: 13,
              color: AppColors.forStatus(status),
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final String value;

  const _InfoChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$label: ',
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: 12,
            color: Colors.grey[400],
          ),
        ),
      ],
    );
  }
}
