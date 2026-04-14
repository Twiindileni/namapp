import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final Color? color;
  final Color? textColor;

  const StatusBadge(this.status, {super.key, this.color, this.textColor});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Color bgColor;
    Color fgColor;

    if (color != null && textColor != null) {
      bgColor = color!;
      fgColor = textColor!;
    } else {
      switch (status.toLowerCase()) {
        case 'approved':
        case 'confirmed':
        case 'delivered':
        case 'repaid':
        case 'resolved':
        case 'active':
          bgColor = Colors.green.shade100;
          fgColor = Colors.green.shade800;
          break;
        case 'pending':
        case 'investigating':
          bgColor = Colors.yellow.shade100;
          fgColor = Colors.yellow.shade800;
          break;
        case 'rejected':
        case 'cancelled':
        case 'defaulted':
        case 'closed':
          bgColor = Colors.red.shade100;
          fgColor = Colors.red.shade800;
          break;
        case 'shipped':
        case 'disbursed':
          bgColor = Colors.blue.shade100;
          fgColor = Colors.blue.shade800;
          break;
        default:
          bgColor = Colors.grey.shade100;
          fgColor = Colors.grey.shade800;
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: fgColor,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
