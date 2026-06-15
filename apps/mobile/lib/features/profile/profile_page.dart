import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final user = appState.user;
    return AppScaffold(
      title: '我的',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('手机号：${user?['phone'] ?? '-'}'),
          const SizedBox(height: 8),
          Text('角色：${user?['role'] ?? '-'}'),
          const SizedBox(height: 8),
          Text('信誉分：${user?['trustScore'] ?? 100}'),
        ],
      ),
    );
  }
}
