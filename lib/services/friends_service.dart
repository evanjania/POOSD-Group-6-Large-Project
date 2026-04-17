import 'dart:convert';
import 'token_service.dart';

class FriendsService {
  // ─── Search users by username (GET /api/follow/users/search?q=) ───────────
  // Public route — no auth needed
  static Future<Map<String, dynamic>> searchUsers(String query) async {
    try {
      final response = await TokenService.authRequest(
        'GET',
        '/api/follow/users/search?q=${Uri.encodeComponent(query)}',
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data}; // List of user objects
      } else {
        return {'success': false, 'message': data['error'] ?? 'Search failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Send a follow request (POST /api/follow/request) ────────────────────
  // followerId comes from the JWT (req.user.userId) — just pass the target
  static Future<Map<String, dynamic>> sendFollowRequest({
    required String followingId,
  }) async {
    try {
      final response = await TokenService.authRequest(
        'POST',
        '/api/follow/request',
        body: {'followingId': followingId},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return {'success': true, 'id': data['id']};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Request failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Get pending follow requests (GET /api/follow/pending/) ──────────────
  // Returns requests sent TO the logged-in user
  static Future<Map<String, dynamic>> getPendingRequests() async {
    try {
      final response = await TokenService.authRequest('GET', '/api/follow/pending/');
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data}; // List of pending request objects
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to load requests'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Approve a follow request (POST /api/follow/approve) ─────────────────
  // requestId is the _id of the follows document
  static Future<Map<String, dynamic>> approveRequest({
    required String requestId,
  }) async {
    try {
      final response = await TokenService.authRequest(
        'POST',
        '/api/follow/approve',
        body: {'requestId': requestId},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to approve'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Deny a follow request (POST /api/follow/deny) ───────────────────────
  static Future<Map<String, dynamic>> denyRequest({
    required String requestId,
  }) async {
    try {
      final response = await TokenService.authRequest(
        'POST',
        '/api/follow/deny',
        body: {'requestId': requestId},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to deny'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Remove a friend (POST /api/follow/remove) ───────────────────────────
  static Future<Map<String, dynamic>> removeFriend({
    required String friendId,
  }) async {
    try {
      final response = await TokenService.authRequest(
        'POST',
        '/api/follow/remove',
        body: {'friendId': friendId},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to remove friend'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Get all accepted friends (GET /api/follow/friends/) ─────────────────
  // Returns: [{ id, username }, ...]
  static Future<Map<String, dynamic>> getFriends() async {
    try {
      final response = await TokenService.authRequest('GET', '/api/follow/friends/');
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data}; // List of { id, username }
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to load friends'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }
}