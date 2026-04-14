import 'package:flutter/material.dart';
// 1. Change your import to the webview file
import 'package:ugotta_mobile/webview_screen.dart'; 

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ugotta App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      // 2. Change this line to start directly on the Web View
      // We pass an empty token since we aren't using the native login anymore
      home: const WebPageScreen(token: ""), 
    );
  }
}