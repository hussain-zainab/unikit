import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { timetableService, batchService } from '../services/api';
import { Card, Button, Input, SelectPicker, EmptyState, LoadingSpinner } from '../components/UI';
import { COLORS, DAYS } from '../constants/config';

const DAY_OPTIONS = DAYS.map(d => ({ value: d, label: d }));

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00',
].map(t => ({ value: t, label: t }));

export default function TimetableScreen() {
  const { user, isStudent, canManage, isTeacher } = useAuth();
  const canEdit = canManage || isTeacher;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ batch: '', subject: '', day: 'Monday', startTime: '09:00', endTime: '10:00', roomNumber: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    if (canEdit) loadBatches();
  }, []);

  const load = async () => {
    try {
      const res = await timetableService.getAll();
      setEntries(res.data.entries);
    } catch (e) {} finally { setLoading(false); }
  };

  const loadBatches = async () => {
    try {
      const res = await batchService.getAll();
      setBatches(res.data.batches.map(b => ({ value: b._id, label: b.name })));
    } catch (e) {}
  };

  const handleCreate = async () => {
    if (!form.subject || !form.day || !form.startTime || !form.endTime) {
      return Alert.alert('Error', 'All fields except room number are required');
    }
    if (!form.batch && !isStudent) {
      return Alert.alert('Error', 'Please select a batch');
    }
    setSaving(true);
    try {
      await timetableService.create(form);
      setCreateModal(false);
      setForm({ batch: '', subject: '', day: 'Monday', startTime: '09:00', endTime: '10:00', roomNumber: '' });
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create entry');
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await timetableService.update(editEntry._id, form);
      setEditModal(false);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete', 'Remove this timetable entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await timetableService.delete(id); load(); } catch (e) {}
        }
      }
    ]);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      batch: entry.batch?._id || '',
      subject: entry.subject,
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      roomNumber: entry.roomNumber || '',
    });
    setEditModal(true);
  };

  const dayEntries = entries.filter(e => e.day === selectedDay);

  const subjectColors = [
    COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.accent,
    '#EC4899', '#14B8A6', '#F97316',
  ];
  const colorMap = {};
  let colorIdx = 0;
  entries.forEach(e => {
    if (!colorMap[e.subject]) colorMap[e.subject] = subjectColors[colorIdx++ % subjectColors.length];
  });

  const TimetableForm = ({ onSubmit }) => (
    <ScrollView keyboardShouldPersistTaps="handled">
      {canEdit && !isStudent && (
        <SelectPicker label="Batch" value={form.batch} options={batches} onChange={v => setForm({ ...form, batch: v })} placeholder="Select batch..." />
      )}
      <Input label="Subject" value={form.subject} onChangeText={v => setForm({ ...form, subject: v })} placeholder="e.g. Mathematics" />
      <SelectPicker label="Day" value={form.day} options={DAY_OPTIONS} onChange={v => setForm({ ...form, day: v })} />
      <SelectPicker label="Start Time" value={form.startTime} options={TIME_SLOTS} onChange={v => setForm({ ...form, startTime: v })} />
      <SelectPicker label="End Time" value={form.endTime} options={TIME_SLOTS} onChange={v => setForm({ ...form, endTime: v })} />
      <Input label="Room Number (optional)" value={form.roomNumber} onChangeText={v => setForm({ ...form, roomNumber: v })} placeholder="e.g. B-201" />
      <Button title="Save" onPress={onSubmit} loading={saving} style={{ marginTop: 8 }} />
    </ScrollView>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timetable</Text>
        {canEdit && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModal(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Day Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs} contentContainerStyle={styles.dayTabsContent}>
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayTab, selectedDay === day && styles.dayTabActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayTabText, selectedDay === day && styles.dayTabTextActive]}>
              {day.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Entries */}
      <ScrollView style={styles.body}>
        {dayEntries.length === 0 ? (
          <EmptyState icon="📅" title={`No classes on ${selectedDay}`} subtitle="Check other days or add a class" />
        ) : (
          dayEntries
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map(entry => {
              const color = colorMap[entry.subject] || COLORS.primary;
              return (
                <View key={entry._id} style={styles.entryRow}>
                  <View style={styles.entryTime}>
                    <Text style={styles.entryTimeStart}>{entry.startTime}</Text>
                    <View style={styles.entryTimeLine} />
                    <Text style={styles.entryTimeEnd}>{entry.endTime}</Text>
                  </View>
                  <View style={[styles.entryCard, { borderLeftColor: color }]}>
                    <Text style={[styles.entrySubject, { color }]}>{entry.subject}</Text>
                    <Text style={styles.entryBatch}>{entry.batch?.name}</Text>
                    <View style={styles.entryMeta}>
                      {entry.roomNumber ? (
                        <Text style={styles.entryRoom}>📍 Room {entry.roomNumber}</Text>
                      ) : null}
                      <Text style={styles.entryTeacher}>👤 {entry.teacher?.name}</Text>
                    </View>
                    {canEdit && entry.teacher?._id === user._id || canManage ? (
                      <View style={styles.entryActions}>
                        <TouchableOpacity onPress={() => openEdit(entry)} style={styles.editBtn}>
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(entry._id)} style={styles.delBtn}>
                          <Text style={styles.delBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Class</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TimetableForm onSubmit={handleCreate} />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Class</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TimetableForm onSubmit={handleUpdate} />
          </View>
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
  dayTabs: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, maxHeight: 56 },
  dayTabsContent: { paddingHorizontal: 16, gap: 6, alignItems: 'center', paddingVertical: 10 },
  dayTab: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.background },
  dayTabActive: { backgroundColor: COLORS.primary },
  dayTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  dayTabTextActive: { color: COLORS.white },
  body: { flex: 1, padding: 16 },
  entryRow: { flexDirection: 'row', marginBottom: 12 },
  entryTime: { width: 52, alignItems: 'center', paddingTop: 4 },
  entryTimeStart: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  entryTimeLine: { width: 1, flex: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  entryTimeEnd: { fontSize: 11, color: COLORS.textMuted },
  entryCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    borderLeftWidth: 4, marginLeft: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  entrySubject: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  entryBatch: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  entryMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  entryRoom: { fontSize: 12, color: COLORS.textMuted },
  entryTeacher: { fontSize: 12, color: COLORS.textMuted },
  entryActions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  editBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  editBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  delBtn: { backgroundColor: COLORS.dangerLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  delBtnText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary },
  modalBody: { padding: 20, flex: 1 },
});
