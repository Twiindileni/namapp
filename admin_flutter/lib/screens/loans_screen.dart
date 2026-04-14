import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/action_button.dart';

class LoansScreen extends StatefulWidget {
  const LoansScreen({super.key});

  @override
  State<LoansScreen> createState() => _LoansScreenState();
}

class _LoansScreenState extends State<LoansScreen> {
  List<dynamic> _loans = [];
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
        'loans',
        select: 'id,applicant_name,phone,email,amount,repayment_amount,collateral_type,collateral_description,status,created_at',
        order: 'created_at.desc',
        limit: 100,
      );
      setState(() {
        _loans = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _updateStatus(String loanId, String status) async {
    try {
      final now = DateTime.now().toIso8601String();
      final updates = <String, dynamic>{'status': status};
      
      if (status == 'approved') updates['approved_at'] = now;
      if (status == 'disbursed') updates['disbursed_at'] = now;
      if (status == 'repaid') updates['repaid_at'] = now;
      if (status == 'defaulted') updates['defaulted_at'] = now;

      await SupabaseService.patch('loans', loanId, updates);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Loan status updated to ${_statusLabel(status)}'), backgroundColor: Colors.green),
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

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'disbursed':
        return 'pending repayment';
      case 'repaid':
        return 'repaid';
      case 'defaulted':
        return 'defaulted';
      default:
        return status;
    }
  }

  List<Map<String, String>> _getActions(dynamic loan) {
    final status = loan['status']?.toString().toLowerCase() ?? '';
    switch (status) {
      case 'pending':
        return [
          {'value': 'approved', 'label': 'Approve'},
          {'value': 'rejected', 'label': 'Reject'},
        ];
      case 'approved':
        return [
          {'value': 'disbursed', 'label': 'Mark Pending Repayment'},
        ];
      case 'disbursed':
        return [
          {'value': 'repaid', 'label': 'Mark Repaid'},
          {'value': 'defaulted', 'label': 'Mark Defaulted'},
        ];
      default:
        return [];
    }
  }

  List<dynamic> get _filtered {
    if (_filter == 'all') return _loans;
    return _loans.where((l) => l['status'] == _filter).toList();
  }

  int _getStatusCount(String status) {
    if (status == 'all') return _loans.length;
    return _loans.where((l) => l['status'] == status).length;
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
                    Text('Loan Applications', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Manage loan applications and status', style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600)),
                  ],
                ),
                Row(
                  children: [
                    DropdownButton<String>(
                      value: _filter,
                      items: [
                        const DropdownMenuItem(value: 'all', child: Text('All')),
                        const DropdownMenuItem(value: 'pending', child: Text('Pending')),
                        const DropdownMenuItem(value: 'approved', child: Text('Approved')),
                        const DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                        const DropdownMenuItem(value: 'disbursed', child: Text('Disbursed')),
                        const DropdownMenuItem(value: 'repaid', child: Text('Repaid')),
                        const DropdownMenuItem(value: 'defaulted', child: Text('Defaulted')),
                      ],
                      onChanged: (v) => setState(() => _filter = v ?? 'all'),
                    ),
                    const SizedBox(width: 12),
                    ActionButton(
                      label: 'Refresh',
                      icon: Icons.refresh,
                      onPressed: _loading ? null : _load,
                      isLoading: _loading,
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
            child: _loading && _loans.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.account_balance_wallet_outlined, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text(_loans.isEmpty ? 'No loans found. Click Refresh to load.' : 'No loans match the selected filter.', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filtered.length,
                        itemBuilder: (context, i) {
                          final loan = _filtered[i];
                          final amount = (loan['amount'] as num?)?.toDouble() ?? 0.0;
                          final repayment = (loan['repayment_amount'] as num?)?.toDouble() ?? 0.0;
                          final status = loan['status']?.toString() ?? 'pending';
                          final actions = _getActions(loan);

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 1,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(loan['applicant_name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                            const SizedBox(height: 4),
                                            Text(loan['phone'] ?? 'N/A', style: TextStyle(color: Colors.grey.shade600)),
                                            if (loan['email'] != null) Text(loan['email'], style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                                          ],
                                        ),
                                      ),
                                      StatusBadge(_statusLabel(status)),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _LoanInfoCard('Amount', 'N\$${amount.toStringAsFixed(2)}', Icons.attach_money, Colors.blue),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _LoanInfoCard('Repayment', 'N\$${repayment.toStringAsFixed(2)}', Icons.payment, Colors.green),
                                      ),
                                    ],
                                  ),
                                  if (loan['collateral_type'] != null) ...[
                                    const SizedBox(height: 12),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(8)),
                                      child: Row(
                                        children: [
                                          Icon(Icons.security, color: Colors.amber.shade800, size: 20),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text('Collateral: ${loan['collateral_type']}', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.amber.shade900)),
                                                if (loan['collateral_description'] != null)
                                                  Text(loan['collateral_description'], style: TextStyle(fontSize: 12, color: Colors.amber.shade800)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 12),
                                  Text(
                                    'Created: ${DateTime.tryParse(loan['created_at'] ?? '')?.toLocal().toString().split('.')[0] ?? 'N/A'}',
                                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                                  ),
                                  if (actions.isNotEmpty) ...[
                                    const SizedBox(height: 16),
                                    const Divider(),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: actions.map((action) {
                                        return ActionButton(
                                          label: action['label']!,
                                          icon: action['value'] == 'approved' ? Icons.check_circle : action['value'] == 'rejected' ? Icons.cancel : Icons.update,
                                          backgroundColor: action['value'] == 'approved' ? Colors.green : action['value'] == 'rejected' ? Colors.red : Colors.blue,
                                          onPressed: () => _updateStatus(loan['id'], action['value']!),
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                ],
                              ),
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

class _LoanInfoCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _LoanInfoCard(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 16)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
