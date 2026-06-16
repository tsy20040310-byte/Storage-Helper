import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class StyleMatchingPage extends StatefulWidget {
  const StyleMatchingPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<StyleMatchingPage> createState() => _StyleMatchingPageState();
}

class _StyleMatchingPageState extends State<StyleMatchingPage> {
  final queryController = TextEditingController(text: '儿童房 日常高频 温暖木质');

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: '风格匹配',
      subtitle: '基于风格关键词快速匹配适合的整理师。',
      child: FutureBuilder<List<dynamic>>(
        future: widget.appState.styleMatching(query: queryController.text),
        builder: (context, snapshot) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(controller: queryController, decoration: const InputDecoration(labelText: '匹配关键词')),
              const SizedBox(height: 16),
              if (snapshot.connectionState == ConnectionState.waiting) const Center(child: CircularProgressIndicator()),
              if (snapshot.hasError) Text('加载失败：${snapshot.error}'),
              ...((snapshot.data ?? []).map((item) {
                final map = item as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    title: Text(map['nickname']?.toString() ?? '整理师'),
                    subtitle: Text('匹配标签：${(map['matchedTags'] as List<dynamic>? ?? []).join(" / ")}\n原因：${((map['matchScoreBreakdown'] as Map<String, dynamic>?)?['styleScore'] ?? 0)} 风格 / ${((map['matchScoreBreakdown'] as Map<String, dynamic>?)?['serviceScore'] ?? 0)} 服务 / ${((map['matchScoreBreakdown'] as Map<String, dynamic>?)?['badgeScore'] ?? 0)} 徽章'),
                    trailing: Text('${map['score'] ?? 0}'),
                  ),
                );
              })),
            ],
          );
        },
      ),
    );
  }
}
