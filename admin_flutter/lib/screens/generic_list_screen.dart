import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/action_button.dart';

class GenericListScreen extends StatefulWidget {
  final String title;
  final String subtitle;
  final String table;
  final List<String> columns;

  const GenericListScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.table,
    required this.columns,
  });

  @override
  State<GenericListScreen> createState() => _GenericListScreenState();
}

class _GenericListScreenState extends State<GenericListScreen> {
  List<dynamic> _list = [];
  bool _loading = false;
  String? _error;

  String _select() => widget.columns.join(',');

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await SupabaseService.get(
        widget.table,
        select: _select(),
        order: 'created_at.desc',
        limit: 100,
      );
      setState(() {
        _list = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _updateStatus(String id, String status) async {
    try {
      await SupabaseService.patch(widget.table, id, {'status': status});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated to $status'), backgroundColor: Colors.green),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _deleteItem(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Item'),
        content: const Text('Are you sure you want to delete this item? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await SupabaseService.delete(widget.table, id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Item deleted successfully'), backgroundColor: Colors.green),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  List<Widget> _getActions(dynamic item) {
    final List<Widget> actions = [];
    final hasId = item['id'] != null;
    final hasStatus = item['status'] != null;

    if (widget.table == 'apps' && hasStatus) {
      final status = item['status']?.toString().toLowerCase() ?? '';
      if (status != 'approved') {
        actions.add(ActionButton(
          label: 'Approve',
          icon: Icons.check,
          backgroundColor: Colors.green,
          onPressed: () => _updateStatus(item['id'], 'approved'),
        ));
      }
      if (status != 'rejected') {
        actions.add(ActionButton(
          label: 'Reject',
          icon: Icons.close,
          backgroundColor: Colors.red,
          onPressed: () => _updateStatus(item['id'], 'rejected'),
        ));
      }
    }

    if (hasId) {
      actions.add(ActionButton(
        label: 'Delete',
        icon: Icons.delete,
        backgroundColor: Colors.red,
        onPressed: () => _deleteItem(item['id']),
      ));
    }

    return actions;
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.title, style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(widget.subtitle, style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
                  ],
                ),
                ActionButton(
                  label: 'Refresh',
                  icon: Icons.refresh,
                  onPressed: _loading ? null : _load,
                  isLoading: _loading,
                ),
              ],
            ),
          ),
          if (_error != null)
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade800),
                  const SizedBox(width: 12),
                  Expanded(child: Text(_error!, style: TextStyle(color: Colors.red.shade800))),
                ],
              ),
            ),
          Expanded(
            child: _loading && _list.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : _list.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text('No data found. Click Refresh to load.', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _list.length,
                        itemBuilder: (context, i) {
                          final row = _list[i] as Map<String, dynamic>;
                          final hasStatus = row['status'] != null;
                          final status = row['status']?.toString() ?? '';

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 1,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: ExpansionTile(
                              tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                              childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                              leading: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(8)),
                                child: Icon(_getIconForTable(), color: theme.colorScheme.primary),
                              ),
                              title: Text(_getPrimaryValue(row), style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: hasStatus ? Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: StatusBadge(status),
                              ) : null,
                              children: [
                                const Divider(),
                                ...widget.columns.map((col) => Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 4),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          SizedBox(
                                            width: 140,
                                            child: Text(
                                              col.replaceAll('_', ' ').toUpperCase(),
                                              style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey.shade700, fontSize: 12),
                                            ),
                                          ),
                                          Expanded(
                                            child: Text(
                                              _formatValue(row[col]),
                                              style: TextStyle(color: Colors.grey.shade800),
                                            ),
                                          ),
                                        ],
                                      ),
                                    )),
                                if (_getActions(row).isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: _getActions(row),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  IconData _getIconForTable() {
    switch (widget.table) {
      case 'apps':
        return Icons.apps;
      case 'ratings':
        return Icons.star;
      case 'forex_signals':
        return Icons.trending_up;
      case 'photography_photos':
        return Icons.photo_library;
      default:
        return Icons.list;
    }
  }

  String _getPrimaryValue(Map<String, dynamic> row) {
    if (row.containsKey('name')) return row['name']?.toString() ?? 'N/A';
    if (row.containsKey('title')) return row['title']?.toString() ?? 'N/A';
    if (row.containsKey('email')) return row['email']?.toString() ?? 'N/A';
    if (row.containsKey('user_email')) return row['user_email']?.toString() ?? 'N/A';
    return row.values.first?.toString() ?? 'N/A';
  }

  String _formatValue(dynamic value) {
    if (value == null) return 'N/A';
    if (value is DateTime) return value.toLocal().toString().split('.')[0];
    if (value is String && value.contains('T') && value.contains('Z')) {
      final dt = DateTime.tryParse(value);
      if (dt != null) return dt.toLocal().toString().split('.')[0];
    }
    return value.toString();
  }
}
