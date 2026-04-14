import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/bookings_screen.dart';
import 'screens/contacts_screen.dart';
import 'screens/products_screen.dart';
import 'screens/devices_screen.dart';
import 'screens/loans_screen.dart';
import 'screens/users_screen.dart';
import 'screens/login_screen.dart';
import 'screens/generic_list_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AdminApp());
}

class AdminApp extends StatelessWidget {
  const AdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Purpose Technology Admin',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5), brightness: Brightness.light),
        useMaterial3: true,
        fontFamily: 'Segoe UI',
      ),
      home: const _AuthGate(),
    );
  }
}

/// Shows login until successful, then the admin shell. No new windows — all navigation stays in the shell.
class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  bool _loggedIn = false;

  @override
  Widget build(BuildContext context) {
    if (!_loggedIn) {
      return LoginScreen(onSuccess: () => setState(() => _loggedIn = true));
    }
    return AdminShell(onLogout: () => setState(() => _loggedIn = false));
  }
}

class AdminShell extends StatefulWidget {
  final VoidCallback? onLogout;

  const AdminShell({super.key, this.onLogout});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  static const int _kDashboardIndex = 0;
  static const int _kOrdersIndex = 1;
  static const int _kBookingsIndex = 2;
  static const int _kContactsIndex = 3;
  static const int _kUsersIndex = 4;
  static const int _kAppsIndex = 5;
  static const int _kProductsIndex = 6;
  static const int _kLoansIndex = 7;
  static const int _kRatingsIndex = 8;
  static const int _kSignalsIndex = 9;
  static const int _kPhotographyIndex = 10;
  static const int _kDevicesIndex = 11;

  int _selectedIndex = _kDashboardIndex;

  List<Widget> get _screens => [
        DashboardScreen(onQuickAction: _navigateTo),
        const OrdersScreen(),
        const BookingsScreen(),
        const ContactsScreen(),
        const UsersScreen(),
        GenericListScreen(
          title: 'App Management',
          subtitle: 'Manage apps',
          table: 'apps',
          columns: const ['name', 'category', 'version', 'status'],
        ),
        const ProductsScreen(),
        const LoansScreen(),
        GenericListScreen(
          title: 'Ratings & Reviews',
          subtitle: 'Manage ratings',
          table: 'ratings',
          columns: const ['user_email', 'rating', 'comment'],
        ),
        GenericListScreen(
          title: 'Signals',
          subtitle: 'Manage signals',
          table: 'forex_signals',
          columns: const ['title', 'signal_type', 'status'],
        ),
        GenericListScreen(
          title: 'Photography Portfolio',
          subtitle: 'Manage photos',
          table: 'photography_photos',
          columns: const ['title', 'category_id', 'is_featured', 'created_at'],
        ),
        const DevicesScreen(),
      ];

  void _navigateTo(String route) {
    final index = _routeToIndex(route);
    if (index != null) setState(() => _selectedIndex = index);
  }

  int? _routeToIndex(String route) {
    switch (route) {
      case 'users':
        return _kUsersIndex;
      case 'apps':
        return _kAppsIndex;
      case 'products':
        return _kProductsIndex;
      case 'orders':
        return _kOrdersIndex;
      case 'loans':
        return _kLoansIndex;
      case 'ratings':
        return _kRatingsIndex;
      case 'signals':
        return _kSignalsIndex;
      case 'contacts':
        return _kContactsIndex;
      case 'photography':
        return _kPhotographyIndex;
      case 'devices':
        return _kDevicesIndex;
      case 'bookings':
        return _kBookingsIndex;
      case 'dashboard':
        return _kDashboardIndex;
      default:
        return null;
    }
  }

  static const _mainDestinations = [
    (icon: Icons.dashboard_outlined, iconSelected: Icons.dashboard, label: 'Dashboard', index: _kDashboardIndex),
    (icon: Icons.receipt_long_outlined, iconSelected: Icons.receipt_long, label: 'Orders', index: _kOrdersIndex),
    (icon: Icons.directions_car_outlined, iconSelected: Icons.directions_car, label: 'Driving Bookings', index: _kBookingsIndex),
    (icon: Icons.mail_outline, iconSelected: Icons.mail, label: 'Contact Messages', index: _kContactsIndex),
  ];

  static const _quickActions = [
    (route: 'users', icon: Icons.people_outline, iconSelected: Icons.people, label: 'Manage Users', index: _kUsersIndex),
    (route: 'apps', icon: Icons.apps_outlined, iconSelected: Icons.apps, label: 'Manage Apps', index: _kAppsIndex),
    (route: 'products', icon: Icons.inventory_2_outlined, iconSelected: Icons.inventory_2, label: 'Manage Products', index: _kProductsIndex),
    (route: 'orders', icon: Icons.shopping_cart_outlined, iconSelected: Icons.shopping_cart, label: 'Manage Orders', index: _kOrdersIndex),
    (route: 'loans', icon: Icons.account_balance_wallet_outlined, iconSelected: Icons.account_balance_wallet, label: 'Manage Loans', index: _kLoansIndex),
    (route: 'ratings', icon: Icons.star_outline, iconSelected: Icons.star, label: 'Manage Ratings', index: _kRatingsIndex),
    (route: 'signals', icon: Icons.trending_up_outlined, iconSelected: Icons.trending_up, label: 'Manage Signals', index: _kSignalsIndex),
    (route: 'contacts', icon: Icons.contact_mail_outlined, iconSelected: Icons.contact_mail, label: 'Manage Contacts', index: _kContactsIndex),
    (route: 'photography', icon: Icons.photo_library_outlined, iconSelected: Icons.photo_library, label: 'Photography Portfolio', index: _kPhotographyIndex),
    (route: 'devices', icon: Icons.devices_outlined, iconSelected: Icons.devices, label: 'Device Tracking', index: _kDevicesIndex),
    (route: 'bookings', icon: Icons.school_outlined, iconSelected: Icons.school, label: 'Driving School', index: _kBookingsIndex),
  ];

  Widget _sideMenu(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      width: 220,
      color: colorScheme.surfaceContainerLowest,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
            child: Text(
              'Purpose Technology',
              style: theme.textTheme.titleMedium?.copyWith(
                color: const Color(0xFF4F46E5),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: [
                for (final dest in _mainDestinations)
                  _NavItem(
                    icon: dest.icon,
                    selectedIcon: dest.iconSelected,
                    label: dest.label,
                    selected: _selectedIndex == dest.index,
                    onTap: () => setState(() => _selectedIndex = dest.index),
                  ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Divider(height: 1),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
                  child: Text(
                    'Quick Actions',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                for (final action in _quickActions)
                  _NavItem(
                    icon: action.icon,
                    selectedIcon: action.iconSelected,
                    label: action.label,
                    selected: _selectedIndex == action.index,
                    onTap: () => setState(() => _selectedIndex = action.index),
                  ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Divider(height: 1),
                ),
                _NavItem(
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                  label: 'Back to Home',
                  selected: _selectedIndex == _kDashboardIndex,
                  onTap: () => setState(() => _selectedIndex = _kDashboardIndex),
                ),
                if (widget.onLogout != null)
                  _NavItem(
                    icon: Icons.logout,
                    selectedIcon: Icons.logout,
                    label: 'Sign out',
                    selected: false,
                    onTap: widget.onLogout!,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          _sideMenu(context),
          const VerticalDivider(width: 1),
          Expanded(child: _screens[_selectedIndex]),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Material(
        color: selected ? colorScheme.primaryContainer.withOpacity(0.5) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Icon(
                  selected ? selectedIcon : icon,
                  size: 24,
                  color: selected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: selected ? colorScheme.primary : colorScheme.onSurface,
                      fontWeight: selected ? FontWeight.w600 : null,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
