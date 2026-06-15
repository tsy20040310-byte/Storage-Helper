import 'package:flutter/material.dart';
import '../core/api/api_client.dart';
import '../core/state/app_state.dart';
import '../features/home/home_shell.dart';

class StorageHelperApp extends StatefulWidget {
  const StorageHelperApp({super.key});

  @override
  State<StorageHelperApp> createState() => _StorageHelperAppState();
}

class _StorageHelperAppState extends State<StorageHelperApp> {
  late final AppState appState;

  @override
  void initState() {
    super.initState();
    appState = AppState(ApiClient(baseUrl: 'http://10.0.2.2:3000/api/v1'));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) {
        return MaterialApp(
          title: '收纳帮',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFB7791F)),
            useMaterial3: true,
          ),
          home: HomeShell(appState: appState),
        );
      },
    );
  }
}
