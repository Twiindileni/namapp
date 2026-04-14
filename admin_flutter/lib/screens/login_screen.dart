import 'package:flutter/material.dart';
import '../config/env_config.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onSuccess;

  const LoginScreen({super.key, required this.onSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  String? _error;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() => _error = null);
    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    final expectedUser = EnvConfig.loginUsername;
    final expectedPass = EnvConfig.loginPassword;

    if (username.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please enter username and password');
      return;
    }
    if (username != expectedUser || password != expectedPass) {
      setState(() => _error = 'Invalid username or password');
      return;
    }
    widget.onSuccess();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background image
          Image.asset(
            'assets/images/login_bg.jpg',
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: const Color(0xFFE8EAF6)),
          ),
          // Dark overlay for readability
          Container(
            color: Colors.black.withOpacity(0.45),
          ),
          // Login form
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Card(
                      elevation: 8,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                'Purpose Technology',
                                style: theme.textTheme.headlineMedium?.copyWith(
                                  color: const Color(0xFF4F46E5),
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Admin sign in',
                                style: theme.textTheme.titleMedium?.copyWith(color: Colors.grey.shade600),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 28),
                              TextFormField(
                                controller: _usernameController,
                                decoration: const InputDecoration(
                                  labelText: 'Username',
                                  border: OutlineInputBorder(),
                                  prefixIcon: Icon(Icons.person_outline),
                                  filled: true,
                                  fillColor: Colors.white,
                                ),
                                textInputAction: TextInputAction.next,
                                onFieldSubmitted: (_) => FocusScope.of(context).nextFocus(),
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                decoration: InputDecoration(
                                  labelText: 'Password',
                                  border: const OutlineInputBorder(),
                                  prefixIcon: const Icon(Icons.lock_outline),
                                  filled: true,
                                  fillColor: Colors.white,
                                  suffixIcon: IconButton(
                                    icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                  ),
                                ),
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _submit(),
                              ),
                              if (_error != null) ...[
                                const SizedBox(height: 16),
                                Text(
                                  _error!,
                                  style: TextStyle(color: theme.colorScheme.error, fontSize: 13),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                              const SizedBox(height: 24),
                              FilledButton(
                                onPressed: _submit,
                                style: FilledButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  backgroundColor: const Color(0xFF4F46E5),
                                ),
                                child: const Text('Sign in'),
                              ),
                              if (EnvConfig.adminUsername == null || EnvConfig.adminPassword == null) ...[
                                const SizedBox(height: 20),
                                Text(
                                  'Using default credentials. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env for production.',
                                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
