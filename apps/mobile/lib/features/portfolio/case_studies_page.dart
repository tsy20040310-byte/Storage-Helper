import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class CaseStudiesPage extends StatefulWidget {
  const CaseStudiesPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<CaseStudiesPage> createState() => _CaseStudiesPageState();
}

class _CaseStudiesPageState extends State<CaseStudiesPage> {
  final portfolioIdController = TextEditingController();
  final titleController = TextEditingController(text: '儿童玩具分区案例');
  final problemController = TextEditingController(text: '玩具混放严重，取放效率低，家长难以维持日常秩序。');
  final solutionController = TextEditingController(text: '按年龄和使用频率建立开放区、回收区和轮换区。');
  final resultController = TextEditingController(text: '每日收纳时间明显缩短，孩子可自主归位。');
  String? success;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: '案例库',
      subtitle: '输入已有作品集 ID，补充结构化案例，便于后续风格匹配与客户决策。',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: portfolioIdController, decoration: const InputDecoration(labelText: '作品集 ID')),
          TextField(controller: titleController, decoration: const InputDecoration(labelText: '案例标题')),
          TextField(
            controller: problemController,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(labelText: '问题描述'),
          ),
          TextField(
            controller: solutionController,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(labelText: '解决方案'),
          ),
          TextField(
            controller: resultController,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(labelText: '最终结果'),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: widget.appState.loading
                ? null
                : () async {
                    await widget.appState.createCaseStudy(
                      portfolioId: portfolioIdController.text,
                      title: titleController.text,
                      problemSummary: problemController.text,
                      solutionSummary: solutionController.text,
                      resultSummary: resultController.text,
                    );
                    setState(() => success = '案例已发布');
                  },
            child: Text(widget.appState.loading ? '提交中...' : '新增案例'),
          ),
          if (success != null) SuccessText(success!),
          if (widget.appState.error != null) ErrorText(widget.appState.error!),
          const SizedBox(height: 20),
          FutureBuilder<List<dynamic>>(
            future: widget.appState.fetchMyCaseStudies(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Text('加载失败：${snapshot.error}');
              }
              final items = snapshot.data ?? [];
              if (items.isEmpty) {
                return const Text('当前还没有案例内容');
              }
              return Column(
                children: items.map((item) {
                  final map = item as Map<String, dynamic>;
                  return Card(
                    child: ListTile(
                      title: Text(map['title']?.toString() ?? '未命名案例'),
                      subtitle: Text(map['problemSummary']?.toString() ?? ''),
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
