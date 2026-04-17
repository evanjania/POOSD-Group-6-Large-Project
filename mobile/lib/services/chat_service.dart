import 'dart:convert';
import 'token_service.dart';

class ChatService {
  // ─── Load chat history (GET /api/chat/:currentUserId/:friendId) ───────────
  // Returns messages sorted oldest → newest
  static Future<Map<String, dynamic>> loadHistory({
    required String friendId,
  }) async {
    try {
      final currentUserId = await TokenService.getUserId();

      final response = await TokenService.authRequest(
        'GET',
        '/api/messages/$currentUserId/$friendId',
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data}; // List of message objects
      } else {
        return {'success': false, 'message': data['error'] ?? 'Failed to load messages'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Could not connect to server'};
    }
  }

  // ─── Mark messages as read (POST /api/chat/mark-read) ────────────────────
  // Call this when the user opens a conversation
  static Future<void> markAsRead({required String friendId}) async {
    try {
      final currentUserId = await TokenService.getUserId();

      await TokenService.authRequest(
        'POST',
        '/api/messages/mark-read',
        body: {
          'currentUserId': currentUserId,
          'friendId': friendId,
        },
      );
    } catch (_) {
      // Non-critical — fail silently
    }
  }
}

// ─── Note on real-time messaging (Socket.IO) ─────────────────────────────────
// Your backend uses Socket.IO for sending messages live.
// The HTTP routes above only cover loading history and marking messages read.
// For real-time, add this package to pubspec.yaml:
//   socket_io_client: ^2.0.3+1
//
// Then connect like this:
//
// import 'package:socket_io_client/socket_io_client.dart' as IO;
//
// final socket = IO.io('https://ugotta.space', <String, dynamic>{
//   'transports': ['websocket'],
//   'auth': {'token': await TokenService.getAccessToken()},
// });
//
// socket.emit('send_message', {
//   'senderId': currentUserId,
//   'receiverId': friendId,
//   'content': messageText,
// });
//
// socket.on('receive_message', (data) {
//   // update your message list in setState()
// });