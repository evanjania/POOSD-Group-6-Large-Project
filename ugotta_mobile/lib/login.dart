import 'package:flutter/material.dart';
import 'package:ugotta_mobile/webview_screen.dart'; 

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  
  // THE FUNCTION MUST LIVE INSIDE HERE
  void handleLoginSuccess(String userToken) {
    Navigator.pushReplacement(
      context, // Now 'context' is recognized because it's inside a State class
      MaterialPageRoute(
        builder: (context) => WebPageScreen(token: userToken),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Login")),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            // Example trigger:
            handleLoginSuccess("your_test_token");
          },
          child: const Text("Login"),
        ),
      ),
    );
  }
}