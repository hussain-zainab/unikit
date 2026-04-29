import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { userService, batchService } from '../services/api';
import { Card, Button, Input, SelectPicker, EmptyState, LoadingSpinner, Avatar, Badge } from '../components/UI';
import { COLORS, ROLE_COLORS, ROLE_LABELS } from '../constants/config';

const ROLE_OPTIONS = [
  { value: 'teacher', label: '👩‍🏫 Teacher' },
  { value: 'student', label: '🧑‍🎓 Student' },
  { value: 'admin', label: '🛠 Admin' },
];
const FILTER_ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'hod', label: 'HOD' },
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

export default function UsersScreen() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', role: 'student', phone: '', rollNumber: '', batch: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); loadBatches(); }, []);

  const load = async () => {
    try {
      const res = await userService.getAll(filterRole ? { role: filterRole } : {});
      setUsers(res.data.users);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [filterRole]);

  const loadBatches = async () => {
    try {
      const res = await batchService.getAll();
      setBatches(res.data.batches.map(b => ({ value: b._id, label: b.name })));
    } catch (e) {}
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.role) {
      return Alert.alert('Error', 'Name, Email, and Role are required');
    }
    setSaving(true);
    try {
      await userService.create(form);
      setCreateModal(false);
      setForm({ name: '', email: '', role: 'student', phone: '', rollNumber: '', batch: '' });
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const handleResetPassword = async (userId) => {
    Alert.alert('Reset Password', 'Force this user to set a new password on next login?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          try {
            await userService.resetPassword(userId);
            Alert.alert('Done', 'Password has been reset. User will set a new one on next login.');
          } catch (e) {}
        }
      }
    ]);
  };

  const handleDeactivate = async (userId) => {
    Alert.alert('Deactivate User', 'Deactivate this user account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate', style: 'destructive', onPress: async () => {
          try {
            await userService.deactivate(userId);
            setDetailModal(false);
            load();
          } catch (e) {}
        }
      }
    ]);
  };

  const renderUser = ({ item }) => {
    const roleColor = ROLE_COLORS[item.role] || COLORS.primary;
    return (
      <Card style={styles.userCard} onPress={() => { setSelected(item); setDetailModal(true); }}>
        <View style={styles.userRow}>
          <Avatar name={item.name} size={44} color={roleColor} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.rollNumber ? <Text style={styles.userRoll}>Roll: {item.rollNumber}</Text> : null}
          </View>
          <View style={styles.userRight}>
            <Badge label={ROLE_LABELS[item.role] || item.role} color={roleColor} />
            {!item.isActive && <Badge label="Inactive" color={COLORS.textMuted} style={{ marginTop: 4 }} />}
          </View>
        </View>
      </Card>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTER_ROLES.map(r => (
            <TouchableOpacity
              key={r.value}
              style={[styles.filterChip, filterRole === r.value && styles.filterChipActive]}
              onPress={() => setFilterRole(r.value)}
            >
              <Text style={[styles.filterChipText, filterRole === r.value && styles.filterChipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={users}
        keyExtractor={i => i._id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="👥" title="No users found" subtitle="Add users to get started" />}
      />

      {/* Create Modal */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add User</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Full Name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="John Doe" />
            <Input label="Email" value={form.email} onChangeText={v => setForm({ ...form, email: v })} placeholder="user@uni.edu" keyboardType="email-address" />
            <SelectPicker label="Role" value={form.role} options={ROLE_OPTIONS} onChange={v => setForm({ ...form, role: v })} />
            <Input label="Phone (optional)" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} placeholder="+91 9876543210" keyboardType="phone-pad" />
            {form.role === 'student' && (
              <>
                <Input label="Roll Number" value={form.rollNumber} onChangeText={v => setForm({ ...form, rollNumber: v })} placeholder="CS2024001" />
                <SelectPicker label="Batch (optional)" value={form.batch} options={batches} onChange={v => setForm({ ...form, batch: v })} placeholder="Assign to batch..." />
              </>
            )}
            <View style={styles.hint}>
              <Text style={styles.hintText}>ℹ️ User will set their password on first login</Text>
            </View>
            <Button title="Create User" onPress={handleCreate} loading={saving} style={{ marginTop: 8 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {selected && (
              <>
                <View style={styles.profileHead}>
                  <Avatar name={selected.name} size={72} color={ROLE_COLORS[selected.role] || COLORS.primary} />
                  <Text style={styles.profileName}>{selected.name}</Text>
                  <Badge label={ROLE_LABELS[selected.role] || selected.role} color={ROLE_COLORS[selected.role] || COLORS.primary} style={{ marginTop: 6 }} />
                </View>

                <Card style={styles.detailCard}>
                  {[
                    { label: 'Email', value: selected.email },
                    { label: 'Phone', value: selected.phone || '—' },
                    { label: 'Roll Number', value: selected.rollNumber || '—' },
                    { label: 'Batch', value: selected.batch?.name || '—' },
                    { label: 'Account Status', value: selected.isActive ? '✅ Active' : '❌ Inactive' },
                    { label: 'First Login', value: selected.isFirstLogin ? '⏳ Pending password' : '✅ Set' },
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{label}</Text>
                      <Text style={styles.detailValue}>{value}</Text>
                    </View>
                  ))}
                </Card>

                <Button
                  title="🔑 Reset Password"
                  variant="secondary"
                  onPress={() => handleResetPassword(selected._id)}
                  style={styles.actionBtn}
                />
                <Button
                  title="🚫 Deactivate Account"
                  variant="danger"
                  onPress={() => handleDeactivate(selected._id)}
                  style={styles.actionBtn}
                />
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
  filterRow: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.background },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.white },
  list: { padding: 16 },
  userCard: { marginBottom: 10, padding: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  userRoll: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  userRight: { alignItems: 'flex-end' },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary },
  modalBody: { padding: 20 },
  hint: { backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 10 },
  hintText: { fontSize: 13, color: COLORS.primary },
  profileHead: { alignItems: 'center', paddingVertical: 20 },
  profileName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  detailCard: { padding: 0, overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  detailLabel: { fontSize: 13, color: COLORS.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, maxWidth: '60%', textAlign: 'right' },
  actionBtn: { marginTop: 10 },
});
