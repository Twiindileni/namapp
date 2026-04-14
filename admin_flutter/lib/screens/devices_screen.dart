import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/action_button.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  List<dynamic> _list = [];
  bool _loading = false;
  String? _error;
  String _filterStatus = 'all';
  String _filterTracking = 'all';
  dynamic _selectedDevice;
  bool _showDetailModal = false;
  String _adminNotes = '';
  String _adminStatus = 'pending';

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
        'registered_devices',
        select: 'id,device_name,imei_number,brand,model,color,serial_number,purchase_date,status,user_email,tracking_requested,tracking_request_date,incident_date,incident_location,incident_latitude,incident_longitude,police_report_number,description,admin_status,admin_notes,resolved_date,created_at',
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

  Future<void> _updateDevice() async {
    if (_selectedDevice == null) return;
    try {
      final updates = <String, dynamic>{
        'admin_notes': _adminNotes,
        'admin_status': _adminStatus,
      };
      if (_adminStatus == 'resolved' || _adminStatus == 'closed') {
        updates['resolved_date'] = DateTime.now().toIso8601String();
      }
      await SupabaseService.patch('registered_devices', _selectedDevice['id'], updates);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Device updated successfully'), backgroundColor: Colors.green),
        );
        setState(() {
          _showDetailModal = false;
          _selectedDevice = null;
        });
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

  Future<void> _deleteDevice(String deviceId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Device'),
        content: const Text('Are you sure you want to delete this device? This action cannot be undone.'),
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
      await SupabaseService.delete('registered_devices', deviceId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Device deleted successfully'), backgroundColor: Colors.green),
        );
        setState(() {
          _showDetailModal = false;
          _selectedDevice = null;
        });
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

  void _openDetailModal(dynamic device) {
    setState(() {
      _selectedDevice = device;
      _adminNotes = device['admin_notes'] ?? '';
      _adminStatus = device['admin_status'] ?? 'pending';
      _showDetailModal = true;
    });
  }

  List<dynamic> get _filtered {
    var filtered = _list;
    if (_filterStatus != 'all') {
      filtered = filtered.where((d) => d['status'] == _filterStatus).toList();
    }
    if (_filterTracking == 'requested') {
      filtered = filtered.where((d) => d['tracking_requested'] == true).toList();
    } else if (_filterTracking == 'not-requested') {
      filtered = filtered.where((d) => d['tracking_requested'] != true).toList();
    }
    return filtered;
  }

  Widget _buildDetailModal() {
    if (!_showDetailModal || _selectedDevice == null) {
      return const SizedBox.shrink();
    }
    return _DeviceDetailModal(
      device: _selectedDevice!,
      adminNotes: _adminNotes,
      adminStatus: _adminStatus,
      onNotesChanged: (v) => setState(() => _adminNotes = v),
      onStatusChanged: (v) => setState(() => _adminStatus = v),
      onUpdate: _updateDevice,
      onDelete: () => _deleteDevice(_selectedDevice!['id']),
      onClose: () => setState(() {
        _showDetailModal = false;
        _selectedDevice = null;
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final stats = {
      'total': _list.length,
      'tracking': _list.where((d) => d['tracking_requested'] == true).length,
      'pending': _list.where((d) => d['admin_status'] == 'pending' && d['tracking_requested'] == true).length,
      'investigating': _list.where((d) => d['admin_status'] == 'investigating').length,
      'resolved': _list.where((d) => d['admin_status'] == 'resolved').length,
    };

    return Stack(
      children: [
        Scaffold(
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Device Tracking', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Manage registered devices and tracking requests', style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
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
                    Row(
                      children: [
                        Expanded(
                          child: _StatCard('Total Devices', stats['total']!.toString(), Icons.devices, Colors.blue),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard('Tracking Requests', stats['tracking']!.toString(), Icons.location_on, Colors.red),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard('Pending', stats['pending']!.toString(), Icons.pending, Colors.yellow),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard('Investigating', stats['investigating']!.toString(), Icons.search, Colors.blue),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard('Resolved', stats['resolved']!.toString(), Icons.check_circle, Colors.green),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _filterStatus,
                            decoration: const InputDecoration(labelText: 'Device Status', border: OutlineInputBorder()),
                            items: const [
                              DropdownMenuItem(value: 'all', child: Text('All Statuses')),
                              DropdownMenuItem(value: 'active', child: Text('Active')),
                              DropdownMenuItem(value: 'lost', child: Text('Lost')),
                              DropdownMenuItem(value: 'stolen', child: Text('Stolen')),
                              DropdownMenuItem(value: 'found', child: Text('Found')),
                              DropdownMenuItem(value: 'recovered', child: Text('Recovered')),
                            ],
                            onChanged: (v) => setState(() => _filterStatus = v ?? 'all'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _filterTracking,
                            decoration: const InputDecoration(labelText: 'Tracking', border: OutlineInputBorder()),
                            items: const [
                              DropdownMenuItem(value: 'all', child: Text('All Devices')),
                              DropdownMenuItem(value: 'requested', child: Text('Tracking Requested')),
                              DropdownMenuItem(value: 'not-requested', child: Text('No Tracking Request')),
                            ],
                            onChanged: (v) => setState(() => _filterTracking = v ?? 'all'),
                          ),
                        ),
                      ],
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
                    : _filtered.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.devices_outlined, size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 16),
                                Text(_list.isEmpty ? 'No devices found. Click Refresh to load.' : 'No devices match the filters.', style: TextStyle(color: Colors.grey.shade600)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filtered.length,
                            itemBuilder: (context, i) {
                              final d = _filtered[i];
                              final status = d['status']?.toString() ?? '';
                              final adminStatus = d['admin_status']?.toString() ?? '';
                              final trackingRequested = d['tracking_requested'] == true;

                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                elevation: 1,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                child: ListTile(
                                  leading: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(8)),
                                    child: Icon(Icons.phone_android, color: theme.colorScheme.primary),
                                  ),
                                  title: Text(d['device_name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('IMEI: ${d['imei_number'] ?? 'N/A'}', style: TextStyle(fontSize: 12, fontFamily: 'monospace')),
                                      Text('${d['brand'] ?? ''} ${d['model'] ?? ''}'.trim(), style: TextStyle(color: Colors.grey.shade600)),
                                      Text('Owner: ${d['user_email'] ?? 'N/A'}', style: TextStyle(color: Colors.grey.shade600)),
                                      const SizedBox(height: 4),
                                      Wrap(
                                        spacing: 4,
                                        children: [
                                          StatusBadge(status),
                                          if (trackingRequested) StatusBadge(adminStatus, color: Colors.orange.shade100, textColor: Colors.orange.shade800),
                                          if (trackingRequested)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(color: Colors.red.shade100, borderRadius: BorderRadius.circular(8)),
                                              child: Text('TRACKING', style: TextStyle(color: Colors.red.shade800, fontSize: 10, fontWeight: FontWeight.bold)),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  trailing: ActionButton(
                                    label: 'View Details',
                                    icon: Icons.visibility,
                                    backgroundColor: Colors.blue,
                                    onPressed: () => _openDetailModal(d),
                                  ),
                                ),
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
        _buildDetailModal(),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DeviceDetailModal extends StatelessWidget {
  final dynamic device;
  final String adminNotes;
  final String adminStatus;
  final ValueChanged<String> onNotesChanged;
  final ValueChanged<String> onStatusChanged;
  final VoidCallback onUpdate;
  final VoidCallback onDelete;
  final VoidCallback onClose;

  const _DeviceDetailModal({
    required this.device,
    required this.adminNotes,
    required this.adminStatus,
    required this.onNotesChanged,
    required this.onStatusChanged,
    required this.onUpdate,
    required this.onDelete,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black54,
      child: Center(
        child: Container(
          width: 800,
          height: 600,
          margin: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF4F46E5),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.phone_android, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Device Details',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                    IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: onClose),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailSection('Device Information', [
                        _DetailRow('Name', device['device_name'] ?? 'N/A'),
                        _DetailRow('IMEI', device['imei_number'] ?? 'N/A'),
                        _DetailRow('Brand', device['brand'] ?? 'N/A'),
                        _DetailRow('Model', device['model'] ?? 'N/A'),
                        _DetailRow('Color', device['color'] ?? 'N/A'),
                        _DetailRow('Serial Number', device['serial_number'] ?? 'N/A'),
                        if (device['purchase_date'] != null) _DetailRow('Purchase Date', DateTime.tryParse(device['purchase_date'])?.toLocal().toString().split('.')[0] ?? 'N/A'),
                        _DetailRow('Status', device['status'] ?? 'N/A'),
                      ]),
                      const SizedBox(height: 20),
                      _DetailSection('Owner Information', [
                        _DetailRow('Email', device['user_email'] ?? 'N/A'),
                        _DetailRow('Registered', DateTime.tryParse(device['created_at'] ?? '')?.toLocal().toString().split('.')[0] ?? 'N/A'),
                      ]),
                      if (device['tracking_requested'] == true) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.warning, color: Colors.red.shade800),
                                  const SizedBox(width: 8),
                                  Text('Tracking Request', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red.shade900)),
                                ],
                              ),
                              const SizedBox(height: 12),
                              _DetailRow('Request Date', device['tracking_request_date'] != null ? DateTime.tryParse(device['tracking_request_date'])?.toLocal().toString().split('.')[0] ?? 'N/A' : 'N/A'),
                              _DetailRow('Incident Date', device['incident_date'] != null ? DateTime.tryParse(device['incident_date'])?.toLocal().toString().split('.')[0] ?? 'N/A' : 'N/A'),
                              _DetailRow('Location', device['incident_location'] ?? 'N/A'),
                              if (device['incident_latitude'] != null && device['incident_longitude'] != null)
                                _DetailRow('Coordinates', '${device['incident_latitude']}, ${device['incident_longitude']}'),
                              if (device['police_report_number'] != null) _DetailRow('Police Report', device['police_report_number']),
                              if (device['description'] != null) ...[
                                const SizedBox(height: 8),
                                Text('Description:', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.red.shade900)),
                                Text(device['description'], style: TextStyle(color: Colors.red.shade800)),
                              ],
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      DropdownButtonFormField<String>(
                        value: adminStatus,
                        decoration: const InputDecoration(labelText: 'Admin Status', border: OutlineInputBorder()),
                        items: const [
                          DropdownMenuItem(value: 'pending', child: Text('Pending')),
                          DropdownMenuItem(value: 'investigating', child: Text('Investigating')),
                          DropdownMenuItem(value: 'resolved', child: Text('Resolved')),
                          DropdownMenuItem(value: 'closed', child: Text('Closed')),
                        ],
                        onChanged: (v) => onStatusChanged(v ?? 'pending'),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        maxLines: 4,
                        decoration: const InputDecoration(labelText: 'Admin Notes', border: OutlineInputBorder()),
                        controller: TextEditingController(text: adminNotes)..selection = TextSelection.collapsed(offset: adminNotes.length),
                        onChanged: onNotesChanged,
                      ),
                    ],
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16))),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    ActionButton(
                      label: 'Update Device',
                      icon: Icons.save,
                      backgroundColor: Colors.blue,
                      onPressed: onUpdate,
                    ),
                    const SizedBox(width: 8),
                    ActionButton(
                      label: 'Delete',
                      icon: Icons.delete,
                      backgroundColor: Colors.red,
                      onPressed: onDelete,
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(onPressed: onClose, child: const Text('Close')),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailSection extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _DetailSection(this.title, this.children);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        ...children,
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 140, child: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey.shade700))),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
