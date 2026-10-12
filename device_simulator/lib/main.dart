import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/device_provider.dart';
import 'screens/setup_screen.dart';
import 'screens/main_screen.dart';
import 'services/config_storage.dart';
import 'theme/app_colors.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saved = await ConfigStorage().load();
  final provider = DeviceProvider();
  if (saved != null) {
    provider.applyConfig(saved);
    provider.connect();
  }
  runApp(
    ChangeNotifierProvider.value(
      value: provider,
      child: const CareNestDeviceSimulatorApp(),
    ),
  );
}

class CareNestDeviceSimulatorApp extends StatelessWidget {
  const CareNestDeviceSimulatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Care Nest Device Simulator',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: AppColors.bgScaffold,
        colorScheme: const ColorScheme.dark(
          surface: AppColors.bgSurface,
          primary: AppColors.primary,
        ),
        cardColor: AppColors.bgSurface,
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
      ),
      home: const _AppShell(),
    );
  }
}

class _AppShell extends StatelessWidget {
  const _AppShell();

  void _openNewWindow() {
    Process.start(Platform.resolvedExecutable, []);
  }

  @override
  Widget build(BuildContext context) {
    return PlatformMenuBar(
      menus: [
        PlatformMenu(
          label: 'File',
          menus: [
            PlatformMenuItem(
              label: 'New',
              shortcut: SingleActivator(
                LogicalKeyboardKey.keyN,
                meta: Platform.isMacOS,
                control: !Platform.isMacOS,
              ),
              onSelected: _openNewWindow,
            ),
          ],
        ),
      ],
      child: const _Root(),
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final showSettings = context.watch<DeviceProvider>().showSettings;
    return showSettings ? const SetupScreen() : const MainScreen();
  }
}
