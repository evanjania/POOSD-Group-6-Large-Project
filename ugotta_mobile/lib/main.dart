import 'package:flutter/material.dart';

//landing page for ugotta mobile
void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.blue,
          title: const Text('ugotta mobile'),
        ),
        body: const Center(
          child: Column(
            children: [
              TextField(),
              TextField(),
            ],
          ),
          
        )
      ),
    );
  }
}