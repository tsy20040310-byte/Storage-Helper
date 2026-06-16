import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class OrganizerProfilePage extends StatefulWidget {
  const OrganizerProfilePage({super.key, required this.appState});

  final AppState appState;

  @override
  State<OrganizerProfilePage> createState() => _OrganizerProfilePageState();
}

class _OrganizerProfilePageState extends State<OrganizerProfilePage> {
  final displayNameController = TextEditingController(text: '高效整理师');
  final headlineController = TextEditingController(text: '擅长儿童房、衣柜与玄关动线优化');
  final specialtiesController = TextEditingController(text: '衣柜,儿童房,玄关');
  final serviceModesController = TextEditingController(text: '上门整理,复盘维护');
  final stylePreferenceController = TextEditingController(text: '日常高频,家庭友好,温暖木质');
  final promiseController = TextEditingController(text: '先沟通再开工，确保可持续维持。');
  String? success;

  @override
  Widget build(BuildContext context) {
    final organizerId = widget.appState.user?['id']?.toString() ?? '';
    return AppScaffold(
      title: '整理师主页',
      subtitle: '展示整理师聚合主页，包含个人资料、作品、案例和最近评价。',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: displayNameController, decoration: const InputDecoration(labelText: '展示名称')),
          TextField(controller: headlineController, decoration: const InputDecoration(labelText: '主页文案')),
          TextField(controller: specialtiesController, decoration: const InputDecoration(labelText: '擅长领域')),
          TextField(controller: serviceModesController, decoration: const InputDecoration(labelText: '服务方式')),
          TextField(controller: stylePreferenceController, decoration: const InputDecoration(labelText: '风格偏好')),
          TextField(controller: promiseController, decoration: const InputDecoration(labelText: '服务承诺')),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: widget.appState.loading
                ? null
                : () async {
                    await widget.appState.upsertMyOrganizerProfile(
                      displayName: displayNameController.text,
                      headline: headlineController.text,
                      styleTags: stylePreferenceController.text.split(',').map((item) => item.trim()).where((item) => item.isNotEmpty).toList(),
                      serviceTags: serviceModesController.text.split(',').map((item) => item.trim()).where((item) => item.isNotEmpty).toList(),
                      badges: specialtiesController.text.split(',').map((item) => item.trim()).where((item) => item.isNotEmpty).toList(),
                      servicePromiseText: promiseController.text,
                    );
                    setState(() => success = '整理师主页已更新');
                  },
            child: Text(widget.appState.loading ? '保存中...' : '保存主页'),
          ),
          if (success != null) SuccessText(success!),
          if (widget.appState.error != null) ErrorText(widget.appState.error!),
          const SizedBox(height: 20),
          FutureBuilder<Map<String, dynamic>>(
            future: widget.appState.fetchOrganizerProfile(organizerId),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Text('加载失败：${snapshot.error}');
              }
              final data = snapshot.data ?? {};
              final reviews = (data['recentReviews'] as List<dynamic>?) ?? [];
              final portfolios = (data['portfolioItems'] as List<dynamic>?) ?? [];
              final cases = (data['caseStudies'] as List<dynamic>?) ?? [];
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('作品数：${portfolios.length} / 案例数：${cases.length} / 最近评价：${reviews.length}'),
                  const SizedBox(height: 12),
                  ...reviews.take(3).map((item) {
                    final map = item as Map<String, dynamic>;
                    return Card(
                      child: ListTile(
                        title: Text('评分 ${map['overallRating'] ?? '-'}'),
                        subtitle: Text(map['content']?.toString() ?? '暂无文字评价'),
                      ),
                    );
                  }),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
