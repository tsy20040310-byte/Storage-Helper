import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../auth/login_page.dart';
import '../orders/create_order_page.dart';
import '../orders/orders_page.dart';
import '../profile/profile_page.dart';
import '../verification/identity_verification_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.appState});

  final AppState appState;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (!widget.appState.isLoggedIn) {
      return LoginPage(appState: widget.appState);
    }

    final pages = [
      CreateOrderPage(appState: widget.appState),
      OrdersPage(appState: widget.appState),
      IdentityVerificationPage(appState: widget.appState),
      ProfilePage(appState: widget.appState),
    ];

    return Scaffold(
      body: SafeArea(child: pages[currentIndex]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) => setState(() => currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.add_home_work_outlined), label: '发单'),
          NavigationDestination(icon: Icon(Icons.assignment_outlined), label: '订单'),
          NavigationDestination(icon: Icon(Icons.verified_user_outlined), label: '认证'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: '我的'),
        ],
      ),
    );
  }
}
