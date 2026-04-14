import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class WebPageScreen extends StatefulWidget {
  // 1. ADD THIS LINE: This defines the parameter 'token'
  final String token; 

  // 2. UPDATE THE CONSTRUCTOR: This tells Flutter it's required
  const WebPageScreen({super.key, required this.token});

  @override
  State<WebPageScreen> createState() => _WebPageScreenState();
}

class _WebPageScreenState extends State<WebPageScreen> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (url) {
            // 3. USE THE TOKEN: Access it via 'widget.token'
            controller.runJavaScript(
              "localStorage.setItem('token', '${widget.token}');"
            );
          },
        ),
      )
      ..loadRequest(Uri.parse('https://ugotta.space'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: WebViewWidget(controller: controller),
    );
  }
}