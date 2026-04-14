import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/action_button.dart';

/// Driving school stages (order matters for unlocking).
const List<({String key, String label, String pctKey, String doneKey})> kDrivingStages = [
  (key: 'stage_clutch', label: '1. Clutch balancing', pctKey: 'stage_clutch_pct', doneKey: 'stage_clutch_done'),
  (key: 'stage_gears', label: '2. Gears change', pctKey: 'stage_gears_pct', doneKey: 'stage_gears_done'),
  (key: 'stage_road_driving', label: '3. Road driving & road signs', pctKey: 'stage_road_driving_pct', doneKey: 'stage_road_driving_done'),
  (key: 'stage_parallel_parking', label: '4. Parallel parking', pctKey: 'stage_parallel_parking_pct', doneKey: 'stage_parallel_parking_done'),
  (key: 'stage_reverse_parking', label: '5. Reverse parking', pctKey: 'stage_reverse_parking_pct', doneKey: 'stage_reverse_parking_done'),
  (key: 'stage_ready_natis', label: '6. Ready for NATIS test drive', pctKey: 'stage_ready_natis_pct', doneKey: 'stage_ready_natis_done'),
];

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  List<dynamic> _list = [];
  bool _loading = false;
  String? _error;
  String _filterStatus = 'all';

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
        'driving_school_bookings',
        select: 'id,package_id,customer_name,customer_email,customer_phone,message,preferred_date,preferred_time,preferred_dates,status,admin_notes,clutch_switch_off_count,stage_clutch_pct,stage_gears_pct,stage_road_driving_pct,stage_parallel_parking_pct,stage_reverse_parking_pct,stage_ready_natis_pct,stage_clutch_done,stage_gears_done,stage_road_driving_done,stage_parallel_parking_done,stage_reverse_parking_done,stage_ready_natis_done,created_at',
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
      await SupabaseService.patch('driving_school_bookings', id, {'status': status});
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

  Future<void> _saveAdminNotes(String id, String notes) async {
    try {
      await SupabaseService.patch('driving_school_bookings', id, {'admin_notes': notes});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Admin notes saved'), backgroundColor: Colors.green),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save notes: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _saveProgress(String id, int clutchCount, Map<String, int> pct) async {
    try {
      final updates = <String, dynamic>{
        'clutch_switch_off_count': clutchCount,
        'stage_clutch_pct': (pct['stage_clutch_pct'] ?? 0).clamp(0, 100),
        'stage_gears_pct': (pct['stage_gears_pct'] ?? 0).clamp(0, 100),
        'stage_road_driving_pct': (pct['stage_road_driving_pct'] ?? 0).clamp(0, 100),
        'stage_parallel_parking_pct': (pct['stage_parallel_parking_pct'] ?? 0).clamp(0, 100),
        'stage_reverse_parking_pct': (pct['stage_reverse_parking_pct'] ?? 0).clamp(0, 100),
        'stage_ready_natis_pct': (pct['stage_ready_natis_pct'] ?? 0).clamp(0, 100),
        'stage_clutch_done': (pct['stage_clutch_pct'] ?? 0) >= 100,
        'stage_gears_done': (pct['stage_gears_pct'] ?? 0) >= 100,
        'stage_road_driving_done': (pct['stage_road_driving_pct'] ?? 0) >= 100,
        'stage_parallel_parking_done': (pct['stage_parallel_parking_pct'] ?? 0) >= 100,
        'stage_reverse_parking_done': (pct['stage_reverse_parking_pct'] ?? 0) >= 100,
        'stage_ready_natis_done': (pct['stage_ready_natis_pct'] ?? 0) >= 100,
      };
      await SupabaseService.patch('driving_school_bookings', id, updates);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Progress saved'), backgroundColor: Colors.green),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save progress: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  List<dynamic> get _filtered {
    if (_filterStatus == 'all') return _list;
    return _list.where((b) => b['status'] == _filterStatus).toList();
  }

  int _getStatusCount(String status) {
    if (status == 'all') return _list.length;
    return _list.where((b) => b['status'] == status).length;
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
                        Text('Driving School Bookings', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Manage driving lesson bookings, status and learner progress', style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
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
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChipTab('all', 'All', _getStatusCount('all'), _filterStatus == 'all', () => setState(() => _filterStatus = 'all')),
                      _FilterChipTab('pending', 'Pending', _getStatusCount('pending'), _filterStatus == 'pending', () => setState(() => _filterStatus = 'pending')),
                      _FilterChipTab('confirmed', 'Confirmed', _getStatusCount('confirmed'), _filterStatus == 'confirmed', () => setState(() => _filterStatus = 'confirmed')),
                      _FilterChipTab('cancelled', 'Cancelled', _getStatusCount('cancelled'), _filterStatus == 'cancelled', () => setState(() => _filterStatus = 'cancelled')),
                      _FilterChipTab('completed', 'Completed', _getStatusCount('completed'), _filterStatus == 'completed', () => setState(() => _filterStatus = 'completed')),
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
            child: _loading && _list.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.directions_car_outlined, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text(_list.isEmpty ? 'No bookings found. Click Refresh to load.' : 'No bookings match the filter.', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filtered.length,
                        itemBuilder: (context, i) {
                          final b = _filtered[i];
                          return _BookingCard(
                            booking: b,
                            onUpdateStatus: _updateStatus,
                            onSaveNotes: _saveAdminNotes,
                            onSaveProgress: _saveProgress,
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _FilterChipTab extends StatelessWidget {
  final String filterKey;
  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChipTab(this.filterKey, this.label, this.count, this.selected, this.onTap);

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

class _BookingCard extends StatefulWidget {
  final dynamic booking;
  final void Function(String id, String status) onUpdateStatus;
  final void Function(String id, String notes) onSaveNotes;
  final void Function(String id, int clutchCount, Map<String, int> pct) onSaveProgress;

  const _BookingCard({
    required this.booking,
    required this.onUpdateStatus,
    required this.onSaveNotes,
    required this.onSaveProgress,
  });

  @override
  State<_BookingCard> createState() => _BookingCardState();
}

class _BookingCardState extends State<_BookingCard> {
  bool _expanded = false;
  late TextEditingController _notesController;
  late TextEditingController _clutchController;
  late Map<String, TextEditingController> _stageControllers;

  @override
  void initState() {
    super.initState();
    _syncFromBooking(widget.booking);
  }

  void _syncFromBooking(dynamic b) {
    _notesController = TextEditingController(text: b['admin_notes']?.toString() ?? '');
    _clutchController = TextEditingController(text: '${b['clutch_switch_off_count'] is int ? b['clutch_switch_off_count'] as int : 0}');
    _stageControllers = {
      for (final s in kDrivingStages)
        s.pctKey: TextEditingController(
          text: '${(b[s.pctKey] is num) ? (b[s.pctKey] as num).toInt().clamp(0, 100) : 0}',
        ),
    };
  }

  @override
  void didUpdateWidget(covariant _BookingCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.booking['id'] != widget.booking['id']) {
      _notesController.dispose();
      _clutchController.dispose();
      for (final c in _stageControllers.values) {
        c.dispose();
      }
      _syncFromBooking(widget.booking);
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    _clutchController.dispose();
    for (final c in _stageControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  int get _clutchCount => int.tryParse(_clutchController.text) ?? 0;

  Map<String, int> get _pct => {
        for (final s in kDrivingStages)
          s.pctKey: (int.tryParse(_stageControllers[s.pctKey]?.text ?? '') ?? 0).clamp(0, 100),
      };

  bool _canEditStagePct(int index) {
    if (index == 0) return true;
    final prev = kDrivingStages[index - 1];
    return (_pct[prev.pctKey] ?? 0) >= 100;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final b = widget.booking;
    final status = b['status']?.toString() ?? 'pending';
    final preferredDate = b['preferred_date']?.toString();
    final preferredTime = b['preferred_time']?.toString();
    final created = b['created_at'] != null ? DateTime.tryParse(b['created_at'])?.toLocal().toString().split('.')[0] : 'N/A';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(8)),
                    child: Icon(Icons.school, color: theme.colorScheme.primary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b['customer_name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text(b['customer_email'] ?? '', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                        Text(b['customer_phone'] ?? '', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                        if (preferredDate != null || preferredTime != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              '${preferredDate ?? '—'} ${preferredTime != null ? 'at $preferredTime' : ''}',
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                            ),
                          ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: kDrivingStages.asMap().entries.map((e) {
                            final idx = e.key;
                            final s = e.value;
                            final pct = (b[s.pctKey] is num) ? (b[s.pctKey] as num).toInt() : 0;
                            final done = b[s.doneKey] == true || pct >= 100;
                            final label = s.label.split('. ').length > 1 ? s.label.split('. ')[1]! : s.label;
                            return Text(
                              '$label ${done ? '✓' : '$pct%'}',
                              style: TextStyle(fontSize: 11, color: done ? Colors.green.shade700 : Colors.grey.shade600),
                            );
                          }).toList(),
                        ),
                        if (b['clutch_switch_off_count'] is int && (b['clutch_switch_off_count'] as int) > 0)
                          Text('Clutch switch-offs: ${b['clutch_switch_off_count']}', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                        const SizedBox(height: 4),
                        Text('Created: $created', style: TextStyle(fontSize: 11, color: Colors.grey.shade400)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      StatusBadge(status),
                      const SizedBox(height: 8),
                      DropdownButton<String>(
                        value: status,
                        items: const [
                          DropdownMenuItem(value: 'pending', child: Text('Pending')),
                          DropdownMenuItem(value: 'confirmed', child: Text('Confirmed')),
                          DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                          DropdownMenuItem(value: 'completed', child: Text('Completed')),
                        ],
                        onChanged: (v) => v != null ? widget.onUpdateStatus(b['id'], v) : null,
                      ),
                      Icon(_expanded ? Icons.expand_less : Icons.expand_more),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (b['message'] != null && (b['message'] as String).isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text('Message: ${b['message']}', style: TextStyle(color: Colors.grey.shade700)),
                    ),
                  if (b['preferred_dates'] != null && (b['preferred_dates'] as String).isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text('Other dates: ${b['preferred_dates']}', style: TextStyle(color: Colors.grey.shade700)),
                    ),
                  const Text('Admin notes', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: 'Add notes about this booking…',
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 8),
                  ActionButton(
                    label: 'Save notes',
                    icon: Icons.save,
                    backgroundColor: Colors.indigo,
                    onPressed: () => widget.onSaveNotes(b['id'], _notesController.text),
                  ),
                  const SizedBox(height: 20),
                  const Text('Learner progress', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Text('Clutch switch-offs: '),
                      SizedBox(
                        width: 80,
                        child: TextField(
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                          controller: _clutchController,
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...kDrivingStages.asMap().entries.map((e) {
                    final idx = e.key;
                    final s = e.value;
                    final canEdit = _canEditStagePct(idx);
                    final controller = _stageControllers[s.pctKey]!;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 220,
                            child: Text(s.label, style: TextStyle(color: canEdit ? Colors.grey.shade800 : Colors.grey.shade500, fontSize: 13)),
                          ),
                          SizedBox(
                            width: 70,
                            child: TextField(
                              keyboardType: TextInputType.number,
                              enabled: canEdit,
                              decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, suffixText: '%'),
                              controller: controller,
                              onChanged: (_) => setState(() {}),
                            ),
                          ),
                          if (canEdit)
                            TextButton(
                              onPressed: () {
                                controller.text = '100';
                                setState(() {});
                              },
                              child: const Text('100%'),
                            ),
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 8),
                  ActionButton(
                    label: 'Save progress',
                    icon: Icons.check_circle,
                    backgroundColor: Colors.green,
                    onPressed: () => widget.onSaveProgress(b['id'], _clutchCount, _pct),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
