import 'package:flutter/foundation.dart';
import '../api/api_client.dart';

class AppState extends ChangeNotifier {
  AppState(this.api);

  final ApiClient api;
  Map<String, dynamic>? user;
  bool loading = false;
  String? error;

  bool get isLoggedIn => api.accessToken != null;

  Future<void> login({
    required String phone,
    required String code,
    required String role,
  }) async {
    await _run(() async {
      final response = await api.post('/auth/login', {
        'phone': phone,
        'code': code,
        'role': role,
      });
      final data = response['data'] as Map<String, dynamic>;
      api.accessToken = data['accessToken'] as String;
      user = data['user'] as Map<String, dynamic>;
    });
  }

  Future<void> submitIdentity({
    required String fullName,
    required String idNumber,
    required String phone,
    required String gender,
  }) async {
    await _run(() async {
      await api.post('/verifications/identity', {
        'fullName': fullName,
        'idNumber': idNumber,
        'phone': phone,
        'gender': gender,
      });
    });
  }

  Future<void> createOrder({
    required String title,
    required String description,
    required String address,
    required String scheduledStartAt,
  }) async {
    await _run(() async {
      await api.post('/orders', {
        'title': title,
        'description': description,
        'cityCode': '110100',
        'addressLine': address,
        'floor': '1',
        'hasElevator': true,
        'scheduledStartAt': scheduledStartAt,
        'estimatedDurationMinutes': 120,
        'storageSupplyStatus': 'unknown',
        'sameGenderOnly': false,
        'latitude': 39.9042,
        'longitude': 116.4074,
        'media': [
          {'type': 'image', 'url': 'https://example.com/demo.jpg'}
        ],
      });
    });
  }

  Future<List<dynamic>> fetchOrders() async {
    final response = await api.get('/orders');
    return response['data'] as List<dynamic>;
  }

  Future<void> _run(Future<void> Function() action) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      await action();
    } catch (exception) {
      error = exception.toString();
      rethrow;
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}
