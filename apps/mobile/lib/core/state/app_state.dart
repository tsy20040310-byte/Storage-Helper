import 'package:flutter/foundation.dart';
import '../api/api_client.dart';

class AppState extends ChangeNotifier {
  AppState(this.api);

  final ApiClient api;
  Map<String, dynamic>? user;
  String languageCode = 'zh';
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
    String genderPreference = 'no_preference',
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
        'genderPreference': genderPreference,
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

  Future<Map<String, dynamic>> fetchOrderDetail(String orderId) async {
    final response = await api.get('/orders/$orderId');
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchServiceContract(String orderId) async {
    final response = await api.get('/orders/$orderId/service-contract');
    return response['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> fetchOrderPayments(String orderId) async {
    final response = await api.get('/orders/$orderId/payments');
    return response['data'] as List<dynamic>;
  }

  Future<List<dynamic>> fetchOrderRefunds(String orderId) async {
    final response = await api.get('/orders/$orderId/refunds');
    return response['data'] as List<dynamic>;
  }

  Future<List<dynamic>> fetchOrderBreaches(String orderId) async {
    final response = await api.get('/orders/$orderId/breach-records');
    return response['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> mockPayOrder(String orderId) async {
    final response = await api.post('/orders/$orderId/payments/mock-pay', {
      'autoEscrow': true,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> requestRefund({
    required String orderId,
    required String reason,
  }) async {
    final response = await api.post('/orders/$orderId/refunds', {
      'reason': reason,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> fetchEmergencyContacts() async {
    final response = await api.get('/emergency-contacts/me');
    return response['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> createEmergencyContact({
    required String name,
    required String phone,
    required String relation,
  }) async {
    final response = await api.post('/emergency-contacts', {
      'name': name,
      'phone': phone,
      'relation': relation,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateEmergencyContact({
    required String id,
    required String name,
    required String phone,
    required String relation,
  }) async {
    final response = await api.patch('/emergency-contacts/$id', {
      'name': name,
      'phone': phone,
      'relation': relation,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<void> deleteEmergencyContact(String id) async {
    await api.delete('/emergency-contacts/$id');
  }

  Future<Map<String, dynamic>> triggerSos({
    required String orderId,
    required double latitude,
    required double longitude,
    String? description,
  }) async {
    final response = await api.post('/orders/$orderId/sos', {
      'latitude': latitude,
      'longitude': longitude,
      'description': description,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> fetchSosEvents(String orderId) async {
    final response = await api.get('/orders/$orderId/sos-events');
    return response['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> createShareLink(String orderId) async {
    final response = await api.post('/orders/$orderId/share-link', {});
    return response['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> fetchDisputes(String orderId) async {
    final response = await api.get('/orders/$orderId/disputes');
    return response['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> createDispute({
    required String orderId,
    required String subject,
    required String description,
  }) async {
    final response = await api.post('/orders/$orderId/disputes', {
      'subject': subject,
      'description': description,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createDisputeMessage({
    required String disputeId,
    required String message,
  }) async {
    final response = await api.post('/disputes/$disputeId/messages', {
      'message': message,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createDisputeEvidence({
    required String disputeId,
    required String evidenceType,
    required String url,
    String? description,
  }) async {
    final response = await api.post('/disputes/$disputeId/evidences', {
      'evidenceType': evidenceType,
      'url': url,
      'description': description,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> fetchMyPortfolioItems() async {
    final response = await api.get('/portfolios/me');
    return response['data'] as List<dynamic>;
  }

  Future<void> createPortfolioItem({
    required String title,
    required String description,
    String? roomType,
    String? styleTagsText,
  }) async {
    await _run(() async {
      await api.post('/portfolios', {
        'title': title,
        'description': description,
        'roomType': roomType,
        'styleTagsText': styleTagsText,
        'coverImageUrl': 'https://example.com/portfolio-cover.jpg',
        'status': 'published',
      });
    });
  }

  Future<List<dynamic>> fetchMyCaseStudies() async {
    final response = await api.get('/case-studies/me');
    return response['data'] as List<dynamic>;
  }

  Future<void> createCaseStudy({
    required String portfolioId,
    required String title,
    required String problemSummary,
    required String solutionSummary,
    String? resultSummary,
  }) async {
    await _run(() async {
      await api.post('/portfolios/$portfolioId/case-studies', {
        'title': title,
        'problemSummary': problemSummary,
        'solutionSummary': solutionSummary,
        'resultSummary': resultSummary,
        'coverImageUrl': 'https://example.com/case-cover.jpg',
        'status': 'published',
      });
    });
  }

  Future<Map<String, dynamic>> fetchOrganizerReviews(String organizerUserId) async {
    final response = await api.get('/organizers/$organizerUserId/reviews');
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchOrganizerProfile(String organizerUserId) async {
    final response = await api.get('/organizers/$organizerUserId/profile');
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchMyOrganizerProfile() async {
    final response = await api.get('/organizer-profile/me');
    return response['data'] as Map<String, dynamic>;
  }

  Future<void> upsertMyOrganizerProfile({
    String? displayName,
    String? headline,
    List<String>? styleTags,
    List<String>? serviceTags,
    List<String>? badges,
    String? servicePromiseText,
  }) async {
    await _run(() async {
      await api.put('/organizer-profile/me', {
        'displayName': displayName,
        'headline': headline,
        'servicePromiseText': servicePromiseText,
        'tags': [
          ...(styleTags ?? []).map((item) => {'type': 'style', 'value': item}),
          ...(serviceTags ?? []).map((item) => {'type': 'service', 'value': item}),
          ...(badges ?? []).map((item) => {'type': 'badge', 'value': item}),
        ],
      });
    });
  }

  Future<List<dynamic>> fetchCandidatePool(String orderId) async {
    final response = await api.get('/orders/$orderId/candidate-pool');
    return response['data'] as List<dynamic>;
  }

  Future<List<dynamic>> styleMatching({
    String? query,
    List<String>? styleTags,
    List<String>? serviceTags,
    String? roomType,
  }) async {
    final response = await api.post('/style-matching', {
      'query': query,
      'styleTags': styleTags,
      'serviceTags': serviceTags,
      'roomType': roomType,
    });
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

  void setLanguage(String value) {
    languageCode = value;
    notifyListeners();
  }
}
