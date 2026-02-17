import 'dart:io';
import 'env_config.dart';

/// Tries to load Supabase config from .env / config.env / ../.env.local (desktop only).
void loadEnvFromFiles() {
  try {
    final dir = Directory.current.path;
    final paths = [
      '$dir/.env',
      '$dir/config.env',
      '$dir/.env.local',
      '$dir/../.env.local',
      '$dir/../config.env',
      '$dir/assets/.env',
    ];
    for (final p in paths) {
      final file = File(p);
      if (file.existsSync()) {
        final content = file.readAsStringSync();
        EnvConfig.loadFromString(content);
        if (EnvConfig.isConfigured) return;
      }
    }
  } catch (_) {}
}
