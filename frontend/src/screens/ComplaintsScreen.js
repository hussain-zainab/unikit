import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/api';
import { Card, Button, Input, SelectPicker, EmptyState, LoadingSpinner, Badge } from '../components/UI';
import { COLORS, COMPLAINT_CATEGORIES } from '../constants/config';

const STATUS_COLORS = {
  open: COLORS.danger,
  in_review: COLORS.warning,
  resolved: COLORS.success,
  closed: COLORS.textMuted,
};

const STATUS_OPTIONS = [
  { value: 'open', label: '🔴 Open' },
  { value: 'in_review', label: '🟡 In Review' },
  { value: 'resolved', label: '🟢 Resolved' },
  { value: 'closed', label: '⚫ Closed' },
];

export default function ComplaintsScreen() {
  const { user, canManage, isStudent } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', isAnonymous: false });
  const [responseForm, setResponseForm] = useState({ status: 'in_review', response: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await complaintService.getAll();
      setComplaints(res.data.complaints);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      return Alert.alert('Error', 'Title and description are required');
    }
    setSaving(true);
    try {
      await complaintService.create(form);
      setCreateModal(false);
      setForm({ title: '', description: '', category: 'other', isAnonymous: false });
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit');
    } finally { setSaving(false); }
  };

  const handleRespond = async () => {
    setSaving(true);
    try {
      await complaintService.respond(selected._id, responseForm);
      setDetailModal(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to respond');
    } finally { setSaving(false); }
  };

  const openDetail = (complaint) => {
    setSelected(complaint);
    setResponseForm({ status: complaint.status, response: complaint.response || '' });
    setDetailModal(true);
  };

  const renderComplaint = ({ item }) => (
    <Card style={styles.complaintCard} onPress={() => openDetail(item)}>
      <View style={styles.complaintTop}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
        <Badge
          label={item.category}
          color={COLORS.secondary}
        />
        <View style={{ flex: 1 }} />
        <Text style={styles.complaintDate}>
          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <Text style={styles.complaintTitle}>{item.title}</Text>
      <Text style={styles.complaintDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.complaintFooter}>
        {!item.isAnonymous && item.submittedBy && (
          <Text style={styles.complaintAuthor}>
            👤 {item.submittedBy?.name}
          </Text>
        )}
        {item.isAnonymous && <Text style={styles.complaintAnon}>👤 Anonymous</Text>}
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complaints</Text>
        {isStudent && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModal(true)}>
            <Text style={styles.addBtnText}>+ Submit</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={complaints}
        keyExtractor={i => i._id}
        renderItem={renderComplaint}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title={isStudent ? 'No complaints submitted' : 'No complaints yet'}
            subtitle={isStudent ? 'Submit a complaint using the button above' : 'Student complaints will appear here'}
          />
        }
      />

      {/* Create Modal */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Complaint</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input
              label="Title"
              value={form.title}
              onChangeText={v => setForm({ ...form, title: v })}
              placeholder="Brief complaint title"
            />
            <Input
              label="Description"
              value={form.description}
              onChangeText={v => setForm({ ...form, description: v })}
              placeholder="Describe your complaint in detail..."
              multiline
            />
            <SelectPicker
              label="Category"
              value={form.category}
              options={COMPLAINT_CATEGORIES}
              onChange={v => setForm({ ...form, category: v })}
            />

            {/* Anonymous Toggle */}
            <View style={styles.anonRow}>
              <View style={styles.anonInfo}>
                <Text style={styles.anonTitle}>Submit Anonymously</Text>
                <Text style={styles.anonSub}>Your name won't be shown</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, form.isAnonymous && styles.toggleActive]}
                onPress={() => setForm({ ...form, isAnonymous: !form.isAnonymous })}
              >
                <View style={[styles.toggleKnob, form.isAnonymous && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>

            <Button
              title="Submit Complaint"
              onPress={handleCreate}
              loading={saving}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Detail / Respond Modal */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complaint Detail</Text>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {selected && (
              <>
                <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[selected.status] + '15' }]}>
                  <Text style={[styles.statusBannerText, { color: STATUS_COLORS[selected.status] }]}>
                    {selected.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.detailDate}>
                  Submitted {new Date(selected.createdAt).toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </Text>
                <Text style={styles.detailDesc}>{selected.description}</Text>

                {selected.response ? (
                  <View style={styles.responseBox}>
                    <Text style={styles.responseBoxTitle}>📬 Response</Text>
                    <Text style={styles.responseBoxText}>{selected.response}</Text>
                    {selected.resolvedBy && (
                      <Text style={styles.resolvedBy}>by {selected.resolvedBy?.name}</Text>
                    )}
                  </View>
                ) : null}

                {canManage && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.respondTitle}>Respond to Complaint</Text>
                    <SelectPicker
                      label="Update Status"
                      value={responseForm.status}
                      options={STATUS_OPTIONS}
                      onChange={v => setResponseForm({ ...responseForm, status: v })}
                    />
                    <Input
                      label="Response (optional)"
                      value={responseForm.response}
                      onChangeText={v => setResponseForm({ ...responseForm, response: v })}
                      placeholder="Add a response message..."
                      multiline
                    />
                    <Button title="Save Response" onPress={handleRespond} loading={saving} />
                  </>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  list: { padding: 16 },
  complaintCard: { marginBottom: 12 },
  complaintTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  complaintDate: { fontSize: 12, color: COLORS.textMuted },
  complaintTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  complaintDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  complaintFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  complaintAuthor: { fontSize: 12, color: COLORS.textMuted },
  complaintAnon: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary },
  modalBody: { padding: 20 },
  anonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 16,
  },
  anonInfo: {},
  anonTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  anonSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleKnob: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, elevation: 2,
  },
  toggleKnobActive: { transform: [{ translateX: 20 }] },
  statusBanner: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginBottom: 16, alignSelf: 'flex-start' },
  statusBannerText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  detailDate: { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  detailDesc: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 16 },
  responseBox: {
    backgroundColor: COLORS.successLight, borderRadius: 12, padding: 14,
    borderLeftWidth: 3, borderLeftColor: COLORS.success,
  },
  responseBoxTitle: { fontSize: 13, fontWeight: '700', color: COLORS.success, marginBottom: 6 },
  responseBoxText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  resolvedBy: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  respondTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
});
