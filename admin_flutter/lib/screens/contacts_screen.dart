import 'package:flutter/material.dart';
import '../services/supabase_service.dart';

class ContactsScreen extends StatefulWidget {
  const ContactsScreen({super.key});

  @override
  State<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  List<dynamic> _list = [];
  bool _loading = false;
  String? _error;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await SupabaseService.get(
        'contact_messages',
        select: 'name,email,subject,message,status,created_at',
        order: 'created_at.desc',
        limit: 50,
      );
      setState(() {
        _list = list;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Contact Messages', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('View and respond to customer inquiries', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
                  ],
                ),
                FilledButton.icon(
                  onPressed: _loading ? null : _load,
                  icon: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                ),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Card(color: Colors.red.shade50, child: Padding(padding: const EdgeInsets.all(12), child: Text(_error!, style: TextStyle(color: Colors.red.shade800)))),
            ),
          Expanded(
            child: _list.isEmpty
                ? const Center(child: Text('Click Refresh to load messages.'))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    itemCount: _list.length,
                    itemBuilder: (context, i) {
                      final c = _list[i];
                      final msg = (c['message'] ?? '').toString();
                      final preview = msg.length > 80 ? '${msg.substring(0, 80)}...' : msg;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text('${c['name'] ?? ''} · ${c['subject'] ?? ''}'),
                          subtitle: Text('${c['email'] ?? ''} · ${c['status'] ?? ''}\n$preview'),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
