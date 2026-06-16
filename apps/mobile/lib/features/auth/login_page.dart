import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final phoneController = TextEditingController(text: '13800000000');
  final codeController = TextEditingController(text: '123456');
  String role = 'client';

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: '收纳帮登录',
      subtitle: '输入手机号和验证码后进入系统。当前开发环境默认验证码为 123456。',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: '手机号'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: codeController,
            decoration: const InputDecoration(labelText: '验证码，开发环境默认 123456'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: role,
            decoration: const InputDecoration(labelText: '角色'),
            items: const [
              DropdownMenuItem(value: 'client', child: Text('单主')),
              DropdownMenuItem(value: 'organizer', child: Text('整理师')),
            ],
            onChanged: (value) => setState(() => role = value ?? 'client'),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Text(
              '默认账号\n单主：13800000000\n整理师：13900000000',
              style: TextStyle(height: 1.7, color: Color(0xFF475569)),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: widget.appState.loading
                ? null
                : () async {
                    await widget.appState.login(
                      phone: phoneController.text,
                      code: codeController.text,
                      role: role,
                    );
                  },
            child: Text(widget.appState.loading ? '登录中...' : '登录'),
          ),
          if (widget.appState.error != null) ErrorText(widget.appState.error!),
        ],
      ),
    );
  }
}
