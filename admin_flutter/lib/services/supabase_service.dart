import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/env_config.dart';

class SupabaseService {
  static String get _baseUrl => EnvConfig.supabaseUrl ?? '';
  static String get _key => EnvConfig.supabaseServiceRoleKey ?? '';

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': _key,
        'Authorization': 'Bearer $_key',
        'Prefer': 'return=representation',
      };

  static Future<List<dynamic>> get(String table, {String? select, String? order, int limit = 100}) async {
    if (!EnvConfig.isConfigured) throw Exception('Supabase not configured. Add .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    final query = <String>[];
    if (select != null) query.add('select=$select');
    if (order != null) query.add('order=$order');
    query.add('limit=$limit');
    final uri = Uri.parse('$_baseUrl/rest/v1/$table?${query.join('&')}');
    final res = await http.get(uri, headers: _headers);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('${res.statusCode}: ${res.body}');
  }

  static Future<void> patch(String table, String id, Map<String, dynamic> body) async {
    if (!EnvConfig.isConfigured) throw Exception('Supabase not configured');
    final uri = Uri.parse('$_baseUrl/rest/v1/$table?id=eq.$id');
    final res = await http.patch(uri, headers: _headers, body: jsonEncode(body));
    if (res.statusCode < 200 || res.statusCode >= 300) throw Exception('${res.statusCode}: ${res.body}');
  }

  static Future<void> delete(String table, String id) async {
    if (!EnvConfig.isConfigured) throw Exception('Supabase not configured');
    final uri = Uri.parse('$_baseUrl/rest/v1/$table?id=eq.$id');
    final res = await http.delete(uri, headers: _headers);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('${res.statusCode}: ${res.body}');
    }
  }

  static Future<Map<String, dynamic>?> getSingle(String table, String id, {String? select}) async {
    if (!EnvConfig.isConfigured) throw Exception('Supabase not configured');
    final query = <String>[];
    if (select != null) query.add('select=$select');
    final uri = Uri.parse('$_baseUrl/rest/v1/$table?id=eq.$id&${query.join('&')}');
    final res = await http.get(uri, headers: _headers);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final list = jsonDecode(res.body) as List<dynamic>;
      return list.isEmpty ? null : list.first as Map<String, dynamic>;
    }
    throw Exception('${res.statusCode}: ${res.body}');
  }
}
