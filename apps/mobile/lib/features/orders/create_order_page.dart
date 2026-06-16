import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class CreateOrderPage extends StatefulWidget {
  const CreateOrderPage({super.key, required this.appState});

  final AppState appState;

  @override
  State<CreateOrderPage> createState() => _CreateOrderPageState();
}

class _CreateOrderPageState extends State<CreateOrderPage> {
  final titleController = TextEditingController(text: 'Family storage reset');
  final descriptionController = TextEditingController(text: 'Need help with wardrobe, toys, and entryway storage.');
  final addressController = TextEditingController(text: 'Chaoyang District, Beijing');
  String genderPreference = 'no_preference';
  String? success;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Create Order',
      subtitle: 'Publish a storage order and optionally restrict applications to female organizers only.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Title')),
          TextField(
            controller: descriptionController,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(labelText: 'Description'),
          ),
          TextField(controller: addressController, decoration: const InputDecoration(labelText: 'Address')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: genderPreference,
            items: const [
              DropdownMenuItem(value: 'no_preference', child: Text('No preference')),
              DropdownMenuItem(value: 'female_only', child: Text('Female organizers only')),
            ],
            onChanged: (value) => setState(() => genderPreference = value ?? 'no_preference'),
            decoration: const InputDecoration(labelText: 'Safety preference'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: widget.appState.loading
                ? null
                : () async {
                    final date = DateTime.now().add(const Duration(days: 1)).toUtc().toIso8601String();
                    await widget.appState.createOrder(
                      title: titleController.text,
                      description: descriptionController.text,
                      address: addressController.text,
                      scheduledStartAt: date,
                      genderPreference: genderPreference,
                    );
                    setState(() => success = 'Order created.');
                  },
            child: const Text('Create Order'),
          ),
          if (success != null) SuccessText(success!),
          if (widget.appState.error != null) ErrorText(widget.appState.error!),
        ],
      ),
    );
  }
}
