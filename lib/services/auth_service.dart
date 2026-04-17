import 'dart:convert';
import 'package:http/http.dart' as http;
import 'token_service.dart';

const String baseUrl = 'https://ugotta.space';

class AuthService {
  // ─── Login (POST /api/auth/login) ─────────────────────────────────────────
  static Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      final data = jsonDecode(response.body);
      print('LOGIN STATUS: ${response.statusCode}');
      print('LOGIN BODY: ${response.body}');

      if (response.statusCode == 200) {
        // Save tokens and user info locally
        await TokenService.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
          userId: data['id'].toString(),
          username: data['username'],
          fullname: data['fullname'],
        );
        final check = await TokenService.getAccessToken();
        print('TOKEN SAVED: $check');
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Login failed'};
      }
    } catch (e) {
      print('LOGIN EXCEPTION: $e');
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Register (POST /api/register) ────────────────────────────────────────
  static Future<Map<String, dynamic>> register({
    required String fullname,
    required String username,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'fullname': fullname,
          'username': username,
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {
        await TokenService.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
          userId: data['id'].toString(),
          username: data['username'],
          fullname: fullname,
        );
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Signup failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Logout (DELETE /api/auth/logout) ─────────────────────────────────────
  static Future<void> logout() async {
    try {
      final refreshToken = await TokenService.getRefreshToken();
      await http.delete(
        Uri.parse('$baseUrl/api/auth/logout'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );
    } catch (_) {}
    // Always clear local tokens regardless of server response
    await TokenService.clearTokens();
  }

  // ─── Forgot password (POST /api/auth/forgot-pass) ─────────────────────────
  static Future<Map<String, dynamic>> forgotPassword({
    required String email,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/forgot-pass'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'message': data['message']};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Request failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Reset password (POST /api/auth/reset-pass) ───────────────────────────
  static Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/reset-pass'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': token, 'newPass': newPassword}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'message': data['message']};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Reset failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }
}