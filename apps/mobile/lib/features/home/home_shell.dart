import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../auth/login_page.dart';
import '../orders/create_order_page.dart';
import '../orders/orders_page.dart';
import '../organizer/organizer_profile_page.dart';
import '../organizer/style_matching_page.dart';
import '../portfolio/case_studies_page.dart';
import '../portfolio/portfolio_page.dart';
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

    final isOrganizer = widget.appState.user?['role'] == 'organizer';

    final pages = isOrganizer
        ? [
            OrganizerProfilePage(appState: widget.appState),
            OrdersPage(appState: widget.appState),
            PortfolioPage(appState: widget.appState),
            CaseStudiesPage(appState: widget.appState),
            StyleMatchingPage(appState: widget.appState),
            ProfilePage(appState: widget.appState),
          ]
        : [
            CreateOrderPage(appState: widget.appState),
            OrdersPage(appState: widget.appState),
            StyleMatchingPage(appState: widget.appState),
            IdentityVerificationPage(appState: widget.appState),
            ProfilePage(appState: widget.appState),
          ];

    final destinations = isOrganizer
        ? const [
            NavigationDestination(icon: Icon(Icons.storefront_outlined), label: '主页'),
            NavigationDestination(icon: Icon(Icons.view_list_outlined), label: '订单'),
            NavigationDestination(icon: Icon(Icons.photo_library_outlined), label: '作品集'),
            NavigationDestination(icon: Icon(Icons.auto_stories_outlined), label: '案例库'),
            NavigationDestination(icon: Icon(Icons.tune_outlined), label: '匹配'),
            NavigationDestination(icon: Icon(Icons.account_circle_outlined), label: '我的'),
          ]
        : const [
            NavigationDestination(icon: Icon(Icons.edit_note_outlined), label: '发布订单'),
            NavigationDestination(icon: Icon(Icons.view_list_outlined), label: '订单列表'),
            NavigationDestination(icon: Icon(Icons.tune_outlined), label: '风格匹配'),
            NavigationDestination(icon: Icon(Icons.badge_outlined), label: '实名认证'),
            NavigationDestination(icon: Icon(Icons.account_circle_outlined), label: '个人中心'),
          ];

    if (currentIndex >= pages.length) {
      currentIndex = 0;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(child: pages[currentIndex]),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          height: 72,
          labelTextStyle: WidgetStateProperty.all(
            const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ),
        child: NavigationBar(
          backgroundColor: Colors.white,
          indicatorColor: const Color(0xFFE2E8F0),
          selectedIndex: currentIndex,
          onDestinationSelected: (index) => setState(() => currentIndex = index),
          destinations: destinations,
        ),
      ),
    );
  }
}
