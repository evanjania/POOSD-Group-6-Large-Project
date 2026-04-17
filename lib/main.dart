import 'package:flutter/material.dart';
import 'auth_page.dart'; // Make sure this import is correct

void main() {
  runApp(const UgottaApp());
}

class UgottaApp extends StatelessWidget {
  const UgottaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ugotta',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      // Start at the AuthPage
      home: const AuthPage(), 
    );
  }
}
