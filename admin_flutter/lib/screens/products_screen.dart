import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/action_button.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<dynamic> _list = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await SupabaseService.get(
        'products',
        select: 'id,name,description,price_nad,image_url,status,created_at',
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

  Future<void> _updateStatus(String productId, String status) async {
    try {
      await SupabaseService.patch('products', productId, {'status': status});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Product $status successfully'), backgroundColor: Colors.green),
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
                    Text('Product Management', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Approve or reject submitted products', style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
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
                            Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text('No products found. Click Refresh to load.', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.75,
                        ),
                        itemCount: _list.length,
                        itemBuilder: (context, i) {
                          final p = _list[i];
                          final price = (p['price_nad'] as num?)?.toDouble() ?? 0.0;
                          final status = p['status']?.toString() ?? 'pending';
                          final imageUrl = p['image_url']?.toString();

                          return Card(
                            elevation: 2,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                ClipRRect(
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                  child: imageUrl != null && imageUrl.isNotEmpty
                                      ? Image.network(
                                          imageUrl,
                                          height: 160,
                                          width: double.infinity,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) => Container(
                                            height: 160,
                                            color: Colors.grey.shade200,
                                            child: Icon(Icons.image_not_supported, color: Colors.grey.shade400),
                                          ),
                                        )
                                      : Container(
                                          height: 160,
                                          color: Colors.grey.shade200,
                                          child: Icon(Icons.image_not_supported, size: 48, color: Colors.grey.shade400),
                                        ),
                                ),
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                p['name'] ?? 'Unknown',
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            Text(
                                              'N\$${price.toStringAsFixed(2)}',
                                              style: TextStyle(fontWeight: FontWeight.bold, color: theme.colorScheme.primary, fontSize: 16),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Expanded(
                                          child: Text(
                                            p['description'] ?? '',
                                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                            maxLines: 3,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            StatusBadge(status),
                                            const Spacer(),
                                            Text(
                                              DateTime.tryParse(p['created_at'] ?? '')?.toLocal().toString().split('.')[0].split(' ')[0] ?? '',
                                              style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 12),
                                        Wrap(
                                          spacing: 6,
                                          runSpacing: 6,
                                          children: [
                                            ActionButton(
                                              label: 'Approve',
                                              icon: Icons.check,
                                              backgroundColor: Colors.green,
                                              onPressed: () => _updateStatus(p['id'], 'approved'),
                                            ),
                                            ActionButton(
                                              label: 'Reject',
                                              icon: Icons.close,
                                              backgroundColor: Colors.red,
                                              onPressed: () => _updateStatus(p['id'], 'rejected'),
                                            ),
                                            if (status != 'pending')
                                              ActionButton(
                                                label: 'Pending',
                                                icon: Icons.pending,
                                                backgroundColor: Colors.orange,
                                                onPressed: () => _updateStatus(p['id'], 'pending'),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
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
}
