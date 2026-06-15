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
