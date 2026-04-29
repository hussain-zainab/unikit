import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { batchService, userService } from '../services/api';
import { Card, Button, Input, Badge, EmptyState, LoadingSpinner, Avatar, Divider } from '../components/UI';
import { COLORS } from '../constants/config';

export default function BatchesScreen() {
  const { user, canManage } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [form, setForm] = useState({ name: '', department: '', year: '', section: 'A' });
  const [saving, setSaving] = useState(false);
  const [lockModal, setLockModal] = useState(false);
  const [lockPassword, setLockPassword] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await batchService.getAll();
      setBatches(res.data.batches);
    } catch (e) {} finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const loadStudents = async () => {
    try {
      const res = await userService.getAll({ role: 'student' });
      setAllStudents(res.data.users);
    } catch (e) {}
  };

  const handleCreate = async () => {
    if (!form.name || !form.department || !form.year) {
      return Alert.alert('Error', 'Name, Department and Year are required');
    }
    setSaving(true);
    try {
      await batchService.create(form);
      setCreateModal(false);
      setForm({ name: '', department: '', year: '', section: 'A' });
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create batch');
    } finally { setSaving(false); }
  };

  const openDetail = async (batch) => {
    setSelectedBatch(batch);
    setDetailModal(true);
  };

  const handleAddStudent = async (student) => {
    try {
      await batchService.addStudent(selectedBatch._id, student._id);
      const res = await batchService.getById(selectedBatch._id);
      setSelectedBatch(res.data.batch);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    Alert.alert('Remove Student', 'Remove this student from batch?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await batchService.removeStudent(selectedBatch._id, studentId);
            const res = await batchService.getById(selectedBatch._id);
            setSelectedBatch(res.data.batch);
            load();
          } catch (e) {}
        }
      }
    ]);
  };

  const handleToggleLock = async () => {
    const isLocked = selectedBatch?.attendanceLock?.isLocked;
    if (!isLocked && !lockPassword) return Alert.alert('Error', 'Enter a lock password');
    try {
      await batchService.setLock(selectedBatch._id, !isLocked, lockPassword);
      const res = await batchService.getById(selectedBatch._id);
      setSelectedBatch(res.data.batch);
      load();
      setLockModal(false);
      setLockPassword('');
      Alert.alert('Success', isLocked ? 'Batch unlocked' : 'Batch locked');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed');
    }
  };

  const studentsNotInBatch = allStudents.filter(
    s => !selectedBatch?.students?.some(bs => bs._id === s._id)
  );

  const renderBatch = ({ item }) => (
    <Card onPress={() => openDetail(item)} style={styles.batchCard}>
      <View style={styles.batchTop}>
        <View style={styles.batchIconWrap}>
          <Text style={styles.batchIcon}>🏫</Text>
        </View>
        <View style={styles.batchInfo}>
          <Text style={styles.batchName}>{item.name}</Text>
          <Text style={styles.batchDept}>{item.department} · {item.year}</Text>
        </View>
        {item.attendanceLock?.isLocked && (
          <Text style={styles.lockIcon}>🔒</Text>
        )}
      </View>
      <View style={styles.batchStats}>
        <View style={styles.statChip}>
          <Text style={styles.statNum}>{item.students?.length || 0}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statNum}>{item.teachers?.length || 0}</Text>
          <Text style={styles.statLabel}>Teachers</Text>
        </View>
        <View style={[styles.statChip, styles.statChipSection]}>
          <Text style={styles.statNum}>{item.section}</Text>
          <Text style={styles.statLabel}>Section</Text>
        </View>
      </View>
    </Card>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Batches</Text>
        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModal(true)}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={batches}
        keyExtractor={i => i._id}
        renderItem={renderBatch}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="🏫" title="No Batches" subtitle="Create your first batch to get started" />}
      />

      {/* Create Batch Modal */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Batch</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Batch Name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="e.g. CS-2024-A" />
            <Input label="Department" value={form.department} onChangeText={v => setForm({ ...form, department: v })} placeholder="e.g. Computer Science" />
            <Input label="Year" value={form.year} onChangeText={v => setForm({ ...form, year: v })} placeholder="e.g. 2024" keyboardType="numeric" />
            <Input label="Section" value={form.section} onChangeText={v => setForm({ ...form, section: v })} placeholder="A" />
            <Button title="Create Batch" onPress={handleCreate} loading={saving} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Batch Detail Modal */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedBatch?.name}</Text>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.detailMeta}>
              <Badge label={selectedBatch?.department} color={COLORS.primary} />
              <Badge label={`Year ${selectedBatch?.year}`} color={COLORS.secondary} style={{ marginLeft: 8 }} />
              <Badge label={`Section ${selectedBatch?.section}`} color={COLORS.success} style={{ marginLeft: 8 }} />
            </View>

            {canManage && (
              <View style={styles.lockSection}>
                <View style={styles.lockInfo}>
                  <Text style={styles.lockTitle}>Attendance Lock</Text>
                  <Text style={styles.lockStatus}>
                    {selectedBatch?.attendanceLock?.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                  </Text>
                </View>
                <Button
                  title={selectedBatch?.attendanceLock?.isLocked ? 'Unlock' : 'Lock'}
                  variant={selectedBatch?.attendanceLock?.isLocked ? 'success' : 'danger'}
                  onPress={() => setLockModal(true)}
                  style={styles.lockBtn}
                />
              </View>
            )}

            <Divider />

            <View style={styles.studentSection}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionHead}>Students ({selectedBatch?.students?.length || 0})</Text>
                {canManage && (
                  <TouchableOpacity onPress={() => { loadStudents(); setAddStudentModal(true); }}>
                    <Text style={styles.addLink}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {selectedBatch?.students?.length === 0 ? (
                <Text style={styles.emptyText}>No students in this batch</Text>
              ) : (
                selectedBatch?.students?.map(s => (
                  <View key={s._id} style={styles.studentRow}>
                    <Avatar name={s.name} size={36} />
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      <Text style={styles.studentRoll}>{s.rollNumber || s.email}</Text>
                    </View>
                    {canManage && (
                      <TouchableOpacity onPress={() => handleRemoveStudent(s._id)}>
                        <Text style={styles.removeIcon}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>

            <Divider />
            <View style={styles.studentSection}>
              <Text style={styles.sectionHead}>Teachers ({selectedBatch?.teachers?.length || 0})</Text>
              {selectedBatch?.teachers?.map(t => (
                <View key={t._id} style={styles.studentRow}>
                  <Avatar name={t.name} size={36} color={COLORS.accent} />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{t.name}</Text>
                    <Text style={styles.studentRoll}>{t.email}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Student Modal */}
      <Modal visible={addStudentModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Student</Text>
            <TouchableOpacity onPress={() => setAddStudentModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={studentsNotInBatch}
            keyExtractor={i => i._id}
            contentContainerStyle={styles.modalBody}
            ListEmptyComponent={<EmptyState icon="✅" title="All students added" subtitle="No more students to add" />}
            renderItem={({ item }) => (
              <Card style={styles.studentCard}>
                <View style={styles.studentRow}>
                  <Avatar name={item.name} size={40} />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentRoll}>{item.rollNumber} · {item.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addStudentBtn}
                    onPress={() => handleAddStudent(item)}
                  >
                    <Text style={styles.addStudentBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Lock Modal */}
      <Modal visible={lockModal} transparent animationType="fade">
        <View style={styles.overlayCenter}>
          <View style={styles.lockModalBox}>
            <Text style={styles.lockModalTitle}>
              {selectedBatch?.attendanceLock?.isLocked ? 'Unlock Batch' : 'Lock Batch'}
            </Text>
            {!selectedBatch?.attendanceLock?.isLocked && (
              <Input
                label="Set Lock Password"
                value={lockPassword}
                onChangeText={setLockPassword}
                placeholder="e.g. 1234"
                secureTextEntry
              />
            )}
            <View style={styles.lockModalBtns}>
              <Button title="Cancel" variant="ghost" onPress={() => setLockModal(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Confirm" variant="primary" onPress={handleToggleLock} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
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
  batchCard: { marginBottom: 12 },
  batchTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  batchIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  batchIcon: { fontSize: 22 },
  batchInfo: { flex: 1 },
  batchName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  batchDept: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  lockIcon: { fontSize: 18 },
  batchStats: { flexDirection: 'row', gap: 8 },
  statChip: { flex: 1, backgroundColor: COLORS.background, borderRadius: 10, padding: 10, alignItems: 'center' },
  statChipSection: { backgroundColor: COLORS.successLight },
  statNum: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary },
  modalBody: { padding: 20 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  lockSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.warningLight, padding: 14, borderRadius: 12, marginBottom: 16,
  },
  lockInfo: {},
  lockTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  lockStatus: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  lockBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  studentSection: { marginBottom: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHead: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  addLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  studentRoll: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  removeIcon: { fontSize: 14, color: COLORS.danger, padding: 4 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
  studentCard: { marginBottom: 8, padding: 12 },
  addStudentBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addStudentBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  lockModalBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '100%' },
  lockModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  lockModalBtns: { flexDirection: 'row', marginTop: 8 },
});
