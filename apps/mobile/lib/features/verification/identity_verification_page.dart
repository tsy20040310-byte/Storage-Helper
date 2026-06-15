import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class IdentityVerificationPage extends StatefulWidget {
  const IdentityVerificationPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<IdentityVerificationPage> createState() => _IdentityVerificationPageState();
}

class _IdentityVerificationPageState extends State<IdentityVerificationPage> {
  final nameController = TextEditingController(text: '张三');
  final idController = TextEditingController(text: '110101199001011234');
  final phoneController = TextEditingController(text: '13800000000');
  String gender = 'female';
  String? success;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: '实名认证',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: nameController, decoration: const InputDecoration(labelText: '真实姓名')),
          TextField(controller: idController, decoration: const InputDecoration(labelText: '身份证号码')),
          TextField(controller: phoneController, decoration: const InputDecoration(labelText: '手机号')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: gender,
            decoration: const InputDecoration(labelText: '性别'),
            items: const [
              DropdownMenuItem(value: 'female', child: Text('女')),
              DropdownMenuItem(value: 'male', child: Text('男')),
              DropdownMenuItem(value: 'other', child: Text('其他')),
            ],
            onChanged: (value) => setState(() => gender = value ?? 'female'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: widget.appState.loading
                ? null
                : () async {
                    await widget.appState.submitIdentity(
                      fullName: nameController.text,
                      idNumber: idController.text,
                      phone: phoneController.text,
                      gender: gender,
                    );
                    setState(() => success = '已提交审核');
                  },
            child: const Text('提交认证'),
          ),
          if (success != null) SuccessText(success!),
          if (widget.appState.error != null) ErrorText(widget.appState.error!),
        ],
      ),
    );
  }
}
