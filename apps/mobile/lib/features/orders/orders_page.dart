import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class OrdersPage extends StatelessWidget {
  const OrdersPage({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: '订单列表',
      child: FutureBuilder<List<dynamic>>(
        future: appState.fetchOrders(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Text('加载失败：${snapshot.error}');
          }
          final orders = snapshot.data ?? [];
          if (orders.isEmpty) {
            return const Text('暂无订单');
          }
          return Column(
            children: orders.map((item) {
              final order = item as Map<String, dynamic>;
              return Card(
                child: ListTile(
                  title: Text(order['title']?.toString() ?? '未命名订单'),
                  subtitle: Text('状态：${order['status']}'),
                ),
              );
            }).toList(),
          );
        },
      ),
    );
  }
}
