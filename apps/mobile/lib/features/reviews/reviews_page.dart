import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class ReviewsPage extends StatefulWidget {
  const ReviewsPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<ReviewsPage> createState() => _ReviewsPageState();
}

class _ReviewsPageState extends State<ReviewsPage> {
  @override
  Widget build(BuildContext context) {
    final organizerId = widget.appState.user?['id']?.toString() ?? '';
    return AppScaffold(
      title: '我的评价',
      subtitle: '整理师可查看客户侧累计评分与评论内容。',
      child: FutureBuilder<Map<String, dynamic>>(
        future: widget.appState.fetchOrganizerReviews(organizerId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Text('加载失败：${snapshot.error}');
          }
          final data = snapshot.data ?? {};
          final items = (data['items'] as List<dynamic>?) ?? [];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '平均分：${data['averageRating'] ?? 0} / 共 ${data['totalReviews'] ?? 0} 条',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              if (items.isEmpty) const Text('当前还没有客户评价'),
              ...items.map((item) {
                final map = item as Map<String, dynamic>;
                final reviewer = map['reviewer'] as Map<String, dynamic>?;
                final profile = reviewer?['profile'] as Map<String, dynamic>?;
                return Card(
                  child: ListTile(
                    title: Text(profile?['nickname']?.toString() ?? reviewer?['phone']?.toString() ?? '匿名用户'),
                    subtitle: Text(map['content']?.toString() ?? '暂无文字评价'),
                    trailing: Text('${map['overallRating'] ?? '-'} 分'),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
