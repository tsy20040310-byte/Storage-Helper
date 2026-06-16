import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class PortfolioPage extends StatefulWidget {
  const PortfolioPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<PortfolioPage> createState() => _PortfolioPageState();
}

class _PortfolioPageState extends State<PortfolioPage> {
  final titleController = TextEditingController(text: '玄关收纳改造');
  final descriptionController = TextEditingController(text: '突出动线优化、透明盒归类和换季物品分层。');
  final roomTypeController = TextEditingController(text: '玄关');
  final styleTagsController = TextEditingController(text: '温暖木质,日常高频');
  String? success;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: '作品集',
      subtitle: '整理师可在这里维护公开作品，用于后续候选池和风格匹配。',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: titleController, decoration: const InputDecoration(labelText: '标题')),
          TextField(
            controller: descriptionController,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(labelText: '作品描述'),
          ),
          TextField(controller: roomTypeController, decoration: const InputDecoration(labelText: '空间类型')),
          TextField(controller: styleTagsController, decoration: const InputDecoration(labelText: '风格标签')),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: widget.appState.loading
                ? null
                : () async {
                    await widget.appState.createPortfolioItem(
                      title: titleController.text,
                      description: descriptionController.text,
                      roomType: roomTypeController.text,
                      styleTagsText: styleTagsController.text,
                    );
                    setState(() => success = '作品已发布');
                  },
            child: Text(widget.appState.loading ? '提交中...' : '新增作品'),
          ),
          if (success != null) SuccessText(success!),
          if (widget.appState.error != null) ErrorText(widget.appState.error!),
          const SizedBox(height: 20),
          FutureBuilder<List<dynamic>>(
            future: widget.appState.fetchMyPortfolioItems(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Text('加载失败：${snapshot.error}');
              }
              final items = snapshot.data ?? [];
              if (items.isEmpty) {
                return const Text('当前还没有作品集内容');
              }
              return Column(
                children: items.map((item) {
                  final map = item as Map<String, dynamic>;
                  return Card(
                    child: ListTile(
                      title: Text(map['title']?.toString() ?? '未命名作品'),
                      subtitle: Text(map['styleTagsText']?.toString() ?? map['description']?.toString() ?? ''),
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
