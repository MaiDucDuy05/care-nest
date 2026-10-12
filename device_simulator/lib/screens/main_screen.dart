import 'package:flutter/material.dart';
import 'widgets/status_header.dart';
import 'widgets/log_panel.dart';
import 'widgets/action_buttons.dart';

class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: const [
            StatusHeader(),
            Expanded(child: LogPanel()),
            ActionButtons(),
          ],
        ),
      ),
    );
  }
}
