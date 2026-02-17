import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/action_button.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<dynamic> _orders = [];
  bool _loading = false;
  String? _error;
  String _filter = 'all';

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
        'orders',
        select: 'id,name,phone,delivery_address,delivery_fee_option,preferred_contact,order_date,special_request,product_id,product_name,product_price,total_amount,status,created_at,updated_at',
        order: 'created_at.desc',
        limit: 100,
      );
      setState(() {
        _orders = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      await SupabaseService.patch('orders', orderId, {
        'status': newStatus,
        'updated_at': DateTime.now().toIso8601String(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order status updated to $newStatus'), backgroundColor: Colors.green),
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

  List<dynamic> get _filtered {
    if (_filter == 'all') return _orders;
    return _orders.where((o) => o['status'] == _filter).toList();
  }

  int _getStatusCount(String status) {
    if (status == 'all') return _orders.length;
    return _orders.where((o) => o['status'] == status).length;
  }

  List<Widget> _getActionButtons(dynamic order) {
    final status = order['status']?.toString().toLowerCase() ?? '';
    final List<Widget> buttons = [];

    if (status == 'pending') {
      buttons.add(ActionButton(
        label: 'Confirm',
        icon: Icons.check_circle,
        backgroundColor: Colors.blue,
        onPressed: () => _updateStatus(order['id'], 'confirmed'),
      ));
      buttons.add(ActionButton(
        label: 'Cancel',
        icon: Icons.cancel,
        backgroundColor: Colors.red,
        onPressed: () => _updateStatus(order['id'], 'cancelled'),
      ));
    } else if (status == 'confirmed') {
      buttons.add(ActionButton(
        label: 'Mark Shipped',
        icon: Icons.local_shipping,
        backgroundColor: Colors.purple,
        onPressed: () => _updateStatus(order['id'], 'shipped'),
      ));
    } else if (status == 'shipped') {
      buttons.add(ActionButton(
        label: 'Mark Delivered',
        icon: Icons.done_all,
        backgroundColor: Colors.green,
        onPressed: () => _updateStatus(order['id'], 'delivered'),
      ));
    }

    return buttons;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Order Management', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Manage and track all product orders', style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
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
                const SizedBox(height: 20),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterTab('all', 'All Orders', _getStatusCount('all'), _filter == 'all', () => setState(() => _filter = 'all')),
                      _FilterTab('pending', 'Pending', _getStatusCount('pending'), _filter == 'pending', () => setState(() => _filter = 'pending')),
                      _FilterTab('confirmed', 'Confirmed', _getStatusCount('confirmed'), _filter == 'confirmed', () => setState(() => _filter = 'confirmed')),
                      _FilterTab('shipped', 'Shipped', _getStatusCount('shipped'), _filter == 'shipped', () => setState(() => _filter = 'shipped')),
                      _FilterTab('delivered', 'Delivered', _getStatusCount('delivered'), _filter == 'delivered', () => setState(() => _filter = 'delivered')),
                      _FilterTab('cancelled', 'Cancelled', _getStatusCount('cancelled'), _filter == 'cancelled', () => setState(() => _filter = 'cancelled')),
                    ],
                  ),
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
            child: _loading && _orders.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text(_orders.isEmpty ? 'No orders found. Click Refresh to load.' : 'No orders match the selected filter.', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filtered.length,
                        itemBuilder: (context, i) {
                          final order = _filtered[i];
                          final total = (order['total_amount'] as num?)?.toDouble() ?? 0.0;
                          final orderId = order['id']?.toString() ?? '';
                          final shortId = orderId.length > 8 ? orderId.substring(0, 8) : orderId;
                          final status = order['status']?.toString() ?? '';

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
                                child: Icon(Icons.receipt_long, color: theme.colorScheme.primary),
                              ),
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Order #$shortId', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                        const SizedBox(height: 4),
                                        Text(order['product_name'] ?? 'Unknown Product', style: TextStyle(color: Colors.grey.shade700)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text('N\$${total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF4F46E5))),
                                      const SizedBox(height: 4),
                                      StatusBadge(status),
                                    ],
                                  ),
                                ],
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Customer: ${order['name'] ?? 'N/A'}', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                                    Text('Phone: ${order['phone'] ?? 'N/A'}', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                                  ],
                                ),
                              ),
                              children: [
                                const Divider(),
                                _OrderDetailRow('Delivery Address', order['delivery_address'] ?? 'N/A'),
                                _OrderDetailRow('Delivery Option', order['delivery_fee_option'] == 'windhoek' ? 'Windhoek (N\$40)' : 'Out of Windhoek (N\$70)'),
                                _OrderDetailRow('Preferred Contact', order['preferred_contact'] ?? 'N/A'),
                                if (order['special_request'] != null) _OrderDetailRow('Special Request', order['special_request']),
                                _OrderDetailRow('Order Date', order['order_date'] != null ? DateTime.tryParse(order['order_date'])?.toLocal().toString().split('.')[0] ?? 'N/A' : 'N/A'),
                                _OrderDetailRow('Created', order['created_at'] != null ? DateTime.tryParse(order['created_at'])?.toLocal().toString().split('.')[0] ?? 'N/A' : 'N/A'),
                                if (order['updated_at'] != null && order['updated_at'] != order['created_at'])
                                  _OrderDetailRow('Last Updated', DateTime.tryParse(order['updated_at'])?.toLocal().toString().split('.')[0] ?? 'N/A'),
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: _getActionButtons(order),
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

class _FilterTab extends StatelessWidget {
  final String filterKey;
  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  const _FilterTab(this.filterKey, this.label, this.count, this.selected, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF4F46E5) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: selected ? const Color(0xFF4F46E5) : Colors.grey.shade300),
          ),
          child: Text(
            '$label ($count)',
            style: TextStyle(
              color: selected ? Colors.white : Colors.grey.shade700,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}

class _OrderDetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _OrderDetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 140, child: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey.shade700))),
          Expanded(child: Text(value, style: TextStyle(color: Colors.grey.shade800))),
        ],
      ),
    );
  }
}
