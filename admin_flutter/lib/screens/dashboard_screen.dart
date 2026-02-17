import 'package:flutter/material.dart';
import '../config/env_config.dart';
import '../services/supabase_service.dart';

class DashboardScreen extends StatefulWidget {
  final void Function(String route)? onQuickAction;

  const DashboardScreen({super.key, this.onQuickAction});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    if (!EnvConfig.isConfigured) {
      setState(() {
        _loading = false;
        _error = 'Supabase not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to:\n'
            '• admin_flutter/assets/.env\n'
            '• or admin_flutter/.env / config.env\n'
            '• or project root .env.local (NEXT_PUBLIC_SUPABASE_URL works too)';
      });
      return;
    }
    setState(() => _loading = true);
    try {
      final products = await SupabaseService.get('products', select: 'status');
      final orders = await SupabaseService.get('orders', select: 'status,total_amount');
      final contacts = await SupabaseService.get('contact_messages', select: 'id,status');
      final bookings = await SupabaseService.get('driving_school_bookings', select: 'status');
      final packages = await SupabaseService.get('driving_school_packages', select: 'id');
      List<dynamic> ratings = [];
      try {
        ratings = await SupabaseService.get('ratings', select: 'rating');
      } catch (_) {}

      int totalOrderValue = 0;
      for (final o in orders) {
        final v = o['total_amount'];
        if (v != null) totalOrderValue += (v is int) ? v : (v is num ? v.toInt() : 0);
      }
      double avgRating = 0;
      if (ratings.isNotEmpty) {
        double sum = 0;
        for (final r in ratings) {
          final v = r['rating'];
          if (v != null) sum += (v is num) ? v.toDouble() : 0;
        }
        avgRating = sum / ratings.length;
      }

      setState(() {
        _stats = {
          'totalProducts': products.length,
          'pendingProducts': products.where((p) => p['status'] == 'pending').length,
          'totalOrders': orders.length,
          'pendingOrders': orders.where((o) => o['status'] == 'pending').length,
          'totalOrderValue': totalOrderValue,
          'totalRatings': ratings.length,
          'averageRating': avgRating,
          'totalContacts': contacts.length,
          'newContacts': contacts.where((c) => c['status'] == 'new').length,
          'drivingPackages': packages.length,
          'drivingBookings': bookings.length,
          'drivingPending': bookings.where((b) => b['status'] == 'pending').length,
        };
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
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Admin Dashboard', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Overview of your platform\'s performance and management tools', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
                ],
              ),
            ),
          ),
          if (_error != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Card(
                  color: Colors.red.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(_error!, style: TextStyle(color: Colors.red.shade800)),
                  ),
                ),
              ),
            ),
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else ...[
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 220,
                  childAspectRatio: 1.8,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                delegate: SliverChildListDelegate([
                  _StatCard('Total Products', '${_stats['totalProducts'] ?? 0}'),
                  _StatCard('Pending Products', '${_stats['pendingProducts'] ?? 0}'),
                  _StatCard('Total Orders', '${_stats['totalOrders'] ?? 0}'),
                  _StatCard('Pending Orders', '${_stats['pendingOrders'] ?? 0}'),
                  _StatCard('Total Order Value', 'N\$ ${_stats['totalOrderValue'] ?? 0}'),
                  _StatCard('Total Ratings', '${_stats['totalRatings'] ?? 0}'),
                  _StatCard('Average Rating', '${(_stats['averageRating'] ?? 0).toStringAsFixed(1)}'),
                  _StatCard('Total Contacts', '${_stats['totalContacts'] ?? 0}'),
                  _StatCard('New Contacts', '${_stats['newContacts'] ?? 0}'),
                  _StatCard('Driving Packages', '${_stats['drivingPackages'] ?? 0}'),
                  _StatCard('Driving Bookings', '${_stats['drivingBookings'] ?? 0}'),
                  _StatCard('Pending (Driving)', '${_stats['drivingPending'] ?? 0}'),
                ]),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Quick Actions', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        _QuickActionCard(title: 'Manage Users', icon: Icons.people, onTap: () => widget.onQuickAction?.call('users')),
                        _QuickActionCard(title: 'Manage Apps', icon: Icons.apps, onTap: () => widget.onQuickAction?.call('apps')),
                        _QuickActionCard(title: 'Manage Products', icon: Icons.shopping_bag, onTap: () => widget.onQuickAction?.call('products')),
                        _QuickActionCard(title: 'Manage Orders', icon: Icons.receipt_long, onTap: () => widget.onQuickAction?.call('orders')),
                        _QuickActionCard(title: 'Manage Loans', icon: Icons.savings, onTap: () => widget.onQuickAction?.call('loans')),
                        _QuickActionCard(title: 'Manage Ratings', icon: Icons.star, onTap: () => widget.onQuickAction?.call('ratings')),
                        _QuickActionCard(title: 'Manage Signals', icon: Icons.campaign, onTap: () => widget.onQuickAction?.call('signals')),
                        _QuickActionCard(title: 'Manage Contacts', icon: Icons.chat, onTap: () => widget.onQuickAction?.call('contacts')),
                        _QuickActionCard(title: 'Photography Portfolio', icon: Icons.photo_library, onTap: () => widget.onQuickAction?.call('photography')),
                        _QuickActionCard(title: 'Device Tracking', icon: Icons.phone_android, onTap: () => widget.onQuickAction?.call('devices')),
                        _QuickActionCard(title: 'Driving School', icon: Icons.directions_car, onTap: () => widget.onQuickAction?.call('bookings')),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;

  const _StatCard(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: Colors.grey.shade200)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600)),
            const SizedBox(height: 4),
            Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback? onTap;

  const _QuickActionCard({required this.title, required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 160,
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
          borderRadius: BorderRadius.circular(8),
          color: Colors.white,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: Colors.grey.shade600),
            const SizedBox(height: 12),
            Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
