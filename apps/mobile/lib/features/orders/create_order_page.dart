import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class CreateOrderPage extends StatefulWidget {
  const CreateOrderPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<CreateOrderPage> createState() => _CreateOrderPageState();
}

class _CreateOrderPageState extends State<CreateOrderPage> {
  final titleController = TextEditingController(text: '整理衣柜和儿童玩具');
  final descriptionController = TextEditingController(text: '衣柜需要分类整理，儿童玩具需要收纳分区。');
  final addressController = TextEditingController(text: '北京市朝阳区示例地址');
  String? success;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: '发布整理需求',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: titleController, decoration: const InputDecoration(labelText: '标题')),
          TextField(
            controller: descriptionController,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(labelText: '需求描述'),
          ),
          TextField(controller: addressController, decoration: const InputDecoration(labelText: '详细地址')),
          const SizedBox(height: 12),
          const Text('素材上传 MVP 暂用示例图片 URL，正式版本接对象存储直传。'),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: widget.appState.loading
                ? null
                : () async {
                    final date = DateTime.now().add(const Duration(days: 1)).toUtc().toIso8601String();
                    await widget.appState.createOrder(
                      title: titleController.text,
                      description: descriptionController.text,
                      address: addressController.text,
                      scheduledStartAt: date,
                    );
                    setState(() => success = '订单已发布');
                  },
            child: const Text('发布订单'),
          ),
          if (success != null) SuccessText(success!),
          if (widget.appState.error != null) ErrorText(widget.appState.error!),
        ],
      ),
    );
  }
}
