import 'dart:convert';
import 'token_service.dart';

class RecommendationsService {
  // ─── Get all recommendations for logged-in user (GET /api/recommendations/search) ──
  // Protected route — uses req.user.username from JWT
  static Future<Map<String, dynamic>> getMyRecommendations() async {
    try {
      final response = await TokenService.authRequest('GET', '/api/recs/search');
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data}; // data is a List of recs
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to load recommendations'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Add recommendation (POST /api/recommendations/add) ───────────────────
  // category should be: "movie", "tv", or "music"
  // rating: 1–5
  static Future<Map<String, dynamic>> addRecommendation({
    required String title,
    required String category,
    required String rating,
    required String notes,
  }) async {
    try {
      final username = await TokenService.getUsername();

      final response = await TokenService.authRequest(
        'POST',
        '/api/recs/add',
        body: {
          'username': username,
          'title': title,
          'category': category,
          'rating': rating,
          'notes': notes,
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'id': data['id']};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to add recommendation'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Edit recommendation (PATCH /api/recommendations/edit) ────────────────
  // Only pass the fields you want to change — all optional except id
  static Future<Map<String, dynamic>> editRecommendation({
    required String id,
    String? title,
    String? category,
    String? rating,
    String? notes,
  }) async {
    try {
      final body = <String, dynamic>{'id': id};
      if (title != null) body['title'] = title;
      if (category != null) body['category'] = category;
      if (rating != null) body['rating'] = rating;
      if (notes != null) body['notes'] = notes;

      final response = await TokenService.authRequest(
        'PATCH',
        '/api/recs/edit',
        body: body,
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data}; // returns updated rec object
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to edit recommendation'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Delete recommendation (DELETE /api/recommendations/delete) ───────────
  static Future<Map<String, dynamic>> deleteRecommendation({
    required String id,
  }) async {
    try {
      final response = await TokenService.authRequest(
        'DELETE',
        '/api/recs/delete',
        body: {'id': id},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to delete recommendation'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }
}