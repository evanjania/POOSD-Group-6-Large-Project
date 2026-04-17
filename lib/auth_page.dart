import 'package:flutter/material.dart';
import 'services/auth_service.dart';
import 'dashboard.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  bool isLogin = true;
  bool isLoading = false;
  String errorMessage = '';

  // Controllers
  final TextEditingController fullnameController = TextEditingController();
  final TextEditingController usernameController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController emailController = TextEditingController();

  final Color blueColor = const Color(0xFF1149A8);
  final Color inputBgColor = const Color(0xFFFAFAFA);

  Future<void> handleSubmit() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    Map<String, dynamic> result;

    if (isLogin) {
      result = await AuthService.login(
        username: usernameController.text.trim(),
        password: passwordController.text.trim(),
      );
    } else {
      // Passes all 4 required named parameters
      result = await AuthService.register(
        fullname: fullnameController.text.trim(),
        username: usernameController.text.trim(),
        email: emailController.text.trim(),
        password: passwordController.text.trim(),
      );
    }

    setState(() {
      isLoading = false;
    });

    if (!mounted) return;

    if (result['success']) {
      // Navigate to dashboard on success
      final String? name = result['data']?['fullname'] ?? fullnameController.text;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => DashboardPage(fullname: name),
        ),
      );
    } else {
      setState(() {
        errorMessage = result['message'] ?? 'An error occurred';
      });
    }
  }

  @override
  void dispose() {
    fullnameController.dispose();
    usernameController.dispose();
    passwordController.dispose();
    emailController.dispose();
    super.dispose();
  }

  Widget buildInputField({
    required String label,
    required TextEditingController controller,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword,
          style: const TextStyle(color: Colors.black87),
          decoration: InputDecoration(
            filled: true,
            fillColor: inputBgColor,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE7E5E4)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE7E5E4)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.blue.shade200, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget buildTabButton(String text, bool isActive, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isActive ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isActive
                ? [const BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1))]
                : [],
          ),
          child: Center(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isActive ? blueColor : Colors.white60,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: blueColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: ColorFiltered(
                  colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
                  child: Image.asset(
                    'logo-icon.png',
                    height: 112,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.all(6),
                child: Row(
                  children: [
                    buildTabButton('Sign In', isLogin, () {
                      setState(() {
                        isLogin = true;
                        errorMessage = '';
                      });
                    }),
                    buildTabButton('Sign Up', !isLogin, () {
                      setState(() {
                        isLogin = false;
                        errorMessage = '';
                      });
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              Text(
                isLogin
                    ? "Got something you need to tell your friends about?"
                    : "Tired of forgetting recommendations?",
                style: const TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isLogin
                    ? "Sign in to document it!"
                    : "Sign up and start tracking recommendations together",
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white.withOpacity(0.65),
                ),
              ),
              const SizedBox(height: 32),

              // Form Fields
              if (!isLogin) ...[
                buildInputField(label: 'Full Name', controller: fullnameController),
                const SizedBox(height: 20),
              ],
              
              buildInputField(label: 'Username', controller: usernameController),
              const SizedBox(height: 20),
              
              if (!isLogin) ...[
                buildInputField(label: 'Email', controller: emailController),
                const SizedBox(height: 20),
              ],
              
              buildInputField(label: 'Password', controller: passwordController, isPassword: true),
              const SizedBox(height: 24),

              if (errorMessage.isNotEmpty) ...[
                Text(
                  errorMessage,
                  style: TextStyle(color: Colors.red.shade300, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
              ],
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLoading ? null : handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: blueColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: isLoading
                      ? SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            color: blueColor,
                            strokeWidth: 3,
                          ),
                        )
                      : Text(
                          isLogin ? "Sign In" : "Sign Up",
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
              const SizedBox(height: 40),
              Text(
                "Large Project by Erkan A, Logan E, Kevin E, Evan J, Benjamin Q, and Siddanth R",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.35),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}