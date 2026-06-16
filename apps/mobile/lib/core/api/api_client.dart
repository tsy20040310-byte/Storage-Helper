import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient({required this.baseUrl});

  final String baseUrl;
  String? accessToken;

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers(),
      body: jsonEncode(body),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> get(String path) async {
    final response = await http.get(Uri.parse('$baseUrl$path'), headers: _headers());
    return _decode(response);
  }

  Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body) async {
    final response = await http.put(
      Uri.parse('$baseUrl$path'),
      headers: _headers(),
      body: jsonEncode(body),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body) async {
    final response = await http.patch(
      Uri.parse('$baseUrl$path'),
      headers: _headers(),
      body: jsonEncode(body),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await http.delete(Uri.parse('$baseUrl$path'), headers: _headers());
    return _decode(response);
  }

  Map<String, String> _headers() {
    return {
      'Content-Type': 'application/json',
      if (accessToken != null) 'Authorization': 'Bearer $accessToken',
    };
  }

  Map<String, dynamic> _decode(http.Response response) {
    final json = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw ApiException(json['message']?.toString() ?? '请求失败');
    }
    return json;
  }
}

class ApiException implements Exception {
  ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
