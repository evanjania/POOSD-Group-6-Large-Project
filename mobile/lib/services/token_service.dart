import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String baseUrl = 'https://ugotta.space';

class TokenService {
  // ─── Save tokens after login/register ─────────────────────────────────────
  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required String userId,
    required String username,
    required String fullname,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', accessToken);
    await prefs.setString('refreshToken', refreshToken);
    await prefs.setString('userId', userId);
    await prefs.setString('username', username);
    await prefs.setString('fullname', fullname);
  }

  // ─── Retrieve stored values ────────────────────────────────────────────────
  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('refreshToken');
  }

  static Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userId');
  }

  static Future<String?> getUsername() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('username');
  }

  static Future<String?> getFullname() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('fullname');
  }

  // ─── Clear everything on logout ───────────────────────────────────────────
  static Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  // ─── Use refresh token to get a new access token (POST /api/auth/refresh) ─
  static Future<bool> refresh() async {
    final refreshToken = await getRefreshToken();
    if (refreshToken == null) return false;

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('accessToken', data['accessToken']);
        return true;
      }
    } catch (_) {}
    return false;
  }

  // ─── Authenticated request with automatic token refresh on 401 ────────────
  // Use this instead of http.get/post/etc for any protected route.
  static Future<http.Response> authRequest(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    String? token = await getAccessToken();

    // No token at all — try refreshing before giving up
    if (token == null || token.isEmpty) {
      final refreshed = await refresh();
      if (refreshed) {
        token = await getAccessToken();
      }
    }

    final headers = {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty)
        'Authorization': 'Bearer $token',
    };

    http.Response response = await _send(method, path, headers, body);

    // Access token expired mid-session — refresh and retry once
    if (response.statusCode == 401 || response.statusCode == 403) {
      final refreshed = await refresh();
      if (refreshed) {
        final newToken = await getAccessToken();
        if (newToken != null && newToken.isNotEmpty) {
          headers['Authorization'] = 'Bearer $newToken';
          response = await _send(method, path, headers, body);
        }
      }
    }

    return response;
  }

  static Future<http.Response> _send(
    String method,
    String path,
    Map<String, String> headers,
    Map<String, dynamic>? body,
  ) {
    final uri = Uri.parse('$baseUrl$path');
    final encoded = body != null ? jsonEncode(body) : null;

    switch (method.toUpperCase()) {
      case 'GET':
        // GET requests must not include a body — headers only
        return http.get(uri, headers: headers);
      case 'POST':
        return http.post(uri, headers: headers, body: encoded);
      case 'PATCH':
        return http.patch(uri, headers: headers, body: encoded);
      case 'DELETE':
        return http.delete(uri, headers: headers, body: encoded);
      default:
        throw UnsupportedError('HTTP method $method not supported');
    }
  }
}