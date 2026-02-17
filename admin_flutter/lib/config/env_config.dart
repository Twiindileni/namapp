/// Loads Supabase URL and service role key from .env asset or from project/parent .env files.
/// Also supports optional ADMIN_USERNAME and ADMIN_PASSWORD for local login.
class EnvConfig {
  static String? _supabaseUrl;
  static String? _supabaseServiceRoleKey;
  static String? _adminUsername;
  static String? _adminPassword;

  static String? get supabaseUrl => _supabaseUrl;
  static String? get supabaseServiceRoleKey => _supabaseServiceRoleKey;
  static String? get adminUsername => _adminUsername;
  static String? get adminPassword => _adminPassword;

  static bool get isConfigured =>
      _supabaseUrl != null &&
      _supabaseUrl!.isNotEmpty &&
      _supabaseServiceRoleKey != null &&
      _supabaseServiceRoleKey!.isNotEmpty;

  /// Admin login: use env if set, otherwise default dev credentials (change in production).
  static String get loginUsername => _adminUsername ?? 'admin';
  static String get loginPassword => _adminPassword ?? 'admin';

  static void loadFromString(String envContent) {
    for (final line in envContent.split('\n')) {
      final trimmed = line.trim();
      if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
      final idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      final key = trimmed.substring(0, idx).trim();
      String value = trimmed.substring(idx + 1).trim();
      // Remove surrounding quotes if present
      if (value.length >= 2 && (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      if (key == 'SUPABASE_URL' || key == 'NEXT_PUBLIC_SUPABASE_URL') _supabaseUrl = value;
      if (key == 'SUPABASE_SERVICE_ROLE_KEY') _supabaseServiceRoleKey = value;
      if (key == 'ADMIN_USERNAME') _adminUsername = value.isEmpty ? null : value;
      if (key == 'ADMIN_PASSWORD') _adminPassword = value.isEmpty ? null : value;
    }
  }
}
