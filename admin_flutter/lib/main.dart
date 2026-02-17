import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app.dart';
import 'config/env_config.dart';
import 'config/env_loader.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // 1. Try bundled asset first (assets/.env)
  try {
    final env = await rootBundle.loadString('assets/.env');
    EnvConfig.loadFromString(env);
  } catch (_) {
    EnvConfig.loadFromString('');
  }
  // 2. If still not configured, try .env / config.env / ../.env.local (desktop)
  if (!EnvConfig.isConfigured) {
    loadEnvFromFiles();
  }
  runApp(const AdminApp());
}
