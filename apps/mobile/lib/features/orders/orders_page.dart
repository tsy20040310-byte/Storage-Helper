import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  final orderIdController = TextEditingController();
  List<dynamic> candidatePool = [];
  Map<String, dynamic>? serviceContract;
  List<dynamic> payments = [];
  List<dynamic> refunds = [];
  List<dynamic> breaches = [];
  List<dynamic> sosEvents = [];
  List<dynamic> disputes = [];
  String? shareUrl;
  String? message;
  String? error;
  bool loadingDetail = false;

  Future<void> _loadOrderSafetyAndFinance() async {
    final orderId = orderIdController.text.trim();
    if (orderId.isEmpty) {
      setState(() => error = 'Please enter an order ID first.');
      return;
    }

    setState(() {
      loadingDetail = true;
      error = null;
    });

    try {
      final contract = await widget.appState.fetchServiceContract(orderId);
      final paymentItems = await widget.appState.fetchOrderPayments(orderId);
      final refundItems = await widget.appState.fetchOrderRefunds(orderId);
      final breachItems = await widget.appState.fetchOrderBreaches(orderId);
      final sosItems = await widget.appState.fetchSosEvents(orderId);
      final disputeItems = await widget.appState.fetchDisputes(orderId);
      setState(() {
        serviceContract = contract;
        payments = paymentItems;
        refunds = refundItems;
        breaches = breachItems;
        sosEvents = sosItems;
        disputes = disputeItems;
        error = null;
      });
    } catch (exception) {
      setState(() {
        error = exception.toString();
      });
    } finally {
      setState(() {
        loadingDetail = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isClient = widget.appState.user?['role'] == 'client';

    return AppScaffold(
      title: 'Orders',
      subtitle: 'Candidate pool, contract, escrow, SOS, share link, and disputes are managed here.',
      child: FutureBuilder<List<dynamic>>(
        future: widget.appState.fetchOrders(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Text('Load failed: ${snapshot.error}');
          }
          final orders = snapshot.data ?? [];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: orderIdController,
                decoration: const InputDecoration(labelText: 'Order ID'),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  if (isClient)
                    FilledButton(
                      onPressed: () async {
                        try {
                          final items = await widget.appState.fetchCandidatePool(orderIdController.text.trim());
                          setState(() {
                            candidatePool = items;
                            error = null;
                          });
                        } catch (exception) {
                          setState(() => error = exception.toString());
                        }
                      },
                      child: const Text('Candidate Pool'),
                    ),
                  if (isClient)
                    FilledButton(
                      onPressed: () async {
                        try {
                          await widget.appState.mockPayOrder(orderIdController.text.trim());
                          setState(() => message = 'Mock payment completed.');
                          await _loadOrderSafetyAndFinance();
                        } catch (exception) {
                          setState(() => error = exception.toString());
                        }
                      },
                      child: const Text('Mock Pay'),
                    ),
                  OutlinedButton(
                    onPressed: _loadOrderSafetyAndFinance,
                    child: const Text('Load Detail'),
                  ),
                  OutlinedButton(
                    onPressed: () async {
                      try {
                        final payload = await widget.appState.triggerSos(
                          orderId: orderIdController.text.trim(),
                          latitude: 39.9042,
                          longitude: 116.4074,
                          description: 'Emergency assistance requested from mobile app.',
                        );
                        setState(() => message = 'SOS sent: ${payload['status']}');
                        await _loadOrderSafetyAndFinance();
                      } catch (exception) {
                        setState(() => error = exception.toString());
                      }
                    },
                    child: const Text('Trigger SOS'),
                  ),
                  OutlinedButton(
                    onPressed: () async {
                      try {
                        final payload = await widget.appState.createShareLink(orderIdController.text.trim());
                        setState(() => shareUrl = payload['shareUrl']?.toString());
                      } catch (exception) {
                        setState(() => error = exception.toString());
                      }
                    },
                    child: const Text('Share Link'),
                  ),
                  OutlinedButton(
                    onPressed: () async {
                      try {
                        await widget.appState.createDispute(
                          orderId: orderIdController.text.trim(),
                          subject: 'Safety concern',
                          description: 'Need customer service review for this order.',
                        );
                        setState(() => message = 'Dispute submitted.');
                        await _loadOrderSafetyAndFinance();
                      } catch (exception) {
                        setState(() => error = exception.toString());
                      }
                    },
                    child: const Text('Open Dispute'),
                  ),
                ],
              ),
              if (shareUrl != null) SuccessText('Share URL: $shareUrl'),
              if (message != null) SuccessText(message!),
              if (error != null) ErrorText(error!),
              if (loadingDetail) ...[
                const SizedBox(height: 12),
                const Center(child: CircularProgressIndicator()),
              ],
              if (candidatePool.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('Candidate Pool', style: TextStyle(fontWeight: FontWeight.w700)),
                ...candidatePool.take(5).map((candidate) {
                  final map = candidate as Map<String, dynamic>;
                  final organizer = map['organizer'] as Map<String, dynamic>;
                  final breakdown = map['matchScoreBreakdown'] as Map<String, dynamic>? ?? {};
                  return Card(
                    child: ListTile(
                      title: Text(organizer['phone']?.toString() ?? 'Organizer'),
                      subtitle: Text('Total ${breakdown['totalScore'] ?? 0} / Style ${breakdown['styleScore'] ?? 0}'),
                    ),
                  );
                }),
              ],
              if (serviceContract != null) ...[
                const SizedBox(height: 16),
                Card(
                  child: ListTile(
                    title: const Text('Service Contract'),
                    subtitle: Text(
                      'Fee ${serviceContract?['serviceFee'] ?? 0}, travel ${serviceContract?['travelFee'] ?? 0}, platform ${serviceContract?['platformFee'] ?? 0}',
                    ),
                  ),
                ),
              ],
              if (payments.isNotEmpty) ...[
                const SizedBox(height: 8),
                const Text('Payments', style: TextStyle(fontWeight: FontWeight.w700)),
                ...payments.map((item) => Card(
                      child: ListTile(
                        title: Text('Amount ${(item as Map<String, dynamic>)['amount'] ?? 0}'),
                        subtitle: Text('Status ${item['status'] ?? '-'}'),
                      ),
                    )),
              ],
              if (refunds.isNotEmpty) ...[
                const SizedBox(height: 8),
                const Text('Refunds', style: TextStyle(fontWeight: FontWeight.w700)),
                ...refunds.map((item) => Card(
                      child: ListTile(
                        title: Text('Refund ${(item as Map<String, dynamic>)['refundAmount'] ?? 0}'),
                        subtitle: Text('Status ${item['status'] ?? '-'}'),
                      ),
                    )),
              ],
              if (sosEvents.isNotEmpty) ...[
                const SizedBox(height: 8),
                const Text('SOS Events', style: TextStyle(fontWeight: FontWeight.w700)),
                ...sosEvents.map((item) => Card(
                      child: ListTile(
                        title: Text('SOS ${(item as Map<String, dynamic>)['status'] ?? '-'}'),
                        subtitle: Text(item['description']?.toString() ?? 'No description'),
                      ),
                    )),
              ],
              if (disputes.isNotEmpty) ...[
                const SizedBox(height: 8),
                const Text('Disputes', style: TextStyle(fontWeight: FontWeight.w700)),
                ...disputes.map((item) => Card(
                      child: ListTile(
                        title: Text((item as Map<String, dynamic>)['subject']?.toString() ?? 'Dispute'),
                        subtitle: Text('Status ${item['status'] ?? '-'}'),
                      ),
                    )),
              ],
              const SizedBox(height: 16),
              if (orders.isEmpty)
                const Text('No orders yet.')
              else
                ...orders.map((item) {
                  final order = item as Map<String, dynamic>;
                  return Card(
                    child: ListTile(
                      title: Text(order['title']?.toString() ?? 'Order'),
                      subtitle: Text('Status: ${order['status']} / Safety: ${order['genderPreference'] ?? 'no_preference'}'),
                    ),
                  );
                }),
            ],
          );
        },
      ),
    );
  }
}
