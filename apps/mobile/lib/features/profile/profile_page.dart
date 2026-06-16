import 'package:flutter/material.dart';
import '../../core/state/app_state.dart';
import '../../shared/widgets/app_scaffold.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, required this.appState});

  final AppState appState;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final relationController = TextEditingController();
  List<dynamic> contacts = [];
  String? message;
  String? contactError;
  bool contactsLoading = false;

  Future<void> _loadContacts() async {
    setState(() {
      contactsLoading = true;
      contactError = null;
    });
    try {
      final items = await widget.appState.fetchEmergencyContacts();
      setState(() {
        contacts = items;
      });
    } catch (exception) {
      setState(() {
        contactError = exception.toString();
      });
    } finally {
      setState(() {
        contactsLoading = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _loadContacts().catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.appState.user;
    return AppScaffold(
      title: 'Settings',
      subtitle: 'Account, language, safety score, and emergency contacts.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ProfileRow(label: 'Phone', value: '${user?['phone'] ?? '-'}'),
          const SizedBox(height: 8),
          _ProfileRow(label: 'Role', value: '${user?['role'] ?? '-'}'),
          const SizedBox(height: 8),
          _ProfileRow(label: 'Safety score', value: '${user?['safetyScore'] ?? 100}'),
          const SizedBox(height: 18),
          DropdownButtonFormField<String>(
            value: widget.appState.languageCode,
            items: const [
              DropdownMenuItem(value: 'zh', child: Text('中文')),
              DropdownMenuItem(value: 'en', child: Text('English')),
            ],
            onChanged: (value) {
              if (value != null) {
                widget.appState.setLanguage(value);
              }
            },
            decoration: const InputDecoration(labelText: 'App language'),
          ),
          const SizedBox(height: 18),
          const Text('Emergency Contacts', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
          const SizedBox(height: 8),
          TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'Phone')),
          const SizedBox(height: 8),
          TextField(controller: relationController, decoration: const InputDecoration(labelText: 'Relation')),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () async {
              try {
                await widget.appState.createEmergencyContact(
                  name: nameController.text,
                  phone: phoneController.text,
                  relation: relationController.text,
                );
                nameController.clear();
                phoneController.clear();
                relationController.clear();
                setState(() {
                  message = 'Emergency contact added.';
                  contactError = null;
                });
                await _loadContacts();
              } catch (exception) {
                setState(() => contactError = exception.toString());
              }
            },
            child: const Text('Add Contact'),
          ),
          if (message != null) SuccessText(message!),
          if (contactError != null) ErrorText(contactError!),
          const SizedBox(height: 12),
          if (contactsLoading)
            const Center(child: CircularProgressIndicator())
          else if (contacts.isEmpty)
            const Text('No emergency contacts yet.')
          else
            ...contacts.map((item) {
              final contact = item as Map<String, dynamic>;
              return Card(
                child: ListTile(
                  title: Text(contact['name']?.toString() ?? 'Contact'),
                  subtitle: Text('${contact['relation'] ?? '-'} / ${contact['phone'] ?? '-'}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () async {
                      try {
                        await widget.appState.deleteEmergencyContact(contact['id']?.toString() ?? '');
                        setState(() {
                          message = 'Emergency contact removed.';
                          contactError = null;
                        });
                        await _loadContacts();
                      } catch (exception) {
                        setState(() => contactError = exception.toString());
                      }
                    },
                  ),
                ),
              );
            }),
          if (widget.appState.error != null) ErrorText(widget.appState.error!),
        ],
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF64748B))),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
