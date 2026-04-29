import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { announcementService, batchService } from '../services/api';
import {
  Card, Button, Input, Badge, SelectPicker,
  EmptyState, LoadingSpinner, SectionHeader,
} from '../components/UI';
import { COLORS, APP_NAME, PRIORITY_COLORS, ROLE_COLORS } from '../constants/config';

const PRIORITIES = [
  { value: 'normal', label: '📢 Normal' },
  { value: 'important', label: '⭐ Important' },
  { value: 'urgent', label: '🚨 Urgent' },
];
const SCOPES = [
  { value: 'global', label: '🌐 Global (All Users)' },
  { value: 'batch', label: '👥 Batch Specific' },
];

export default function AnnouncementsScreen() {
  const { user, canManage, isTeacher } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', scope: 'global', batch: '', priority: 'normal' });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await announcementService.getAll();
      setAnnouncements(res.data.announcements);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadBatches = async () => {
    try {
      const res = await batchService.getAll();
      setBatches(res.data.batches.map(b => ({ value: b._id, label: b.name })));
    } catch (e) {}
  };

  useEffect(() => {
    load();
    if (canManage || isTeacher) loadBatches();
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }
    if (form.scope === 'batch' && !form.batch) {
      Alert.alert('Error', 'Please select a batch');
      return;
    }
    setSaving(true);
    try {
      await announcementService.create(form);
      setModalVisible(false);
      setForm({ title: '', content: '', scope: 'global', batch: '', priority: 'normal' });
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete', 'Remove this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await announcementService.delete(id);
            load();
          } catch (e) {}
        },
      },
    ]);
  };

  const renderAnnouncement = ({ item }) => {
    const isExpanded = expandedId === item._id;
    const prColor = PRIORITY_COLORS[item.priority] || COLORS.textSecondary;
    const roleColor = ROLE_COLORS[item.author?.role] || COLORS.primary;

    return (
      <Card style={styles.annCard} onPress={() => setExpandedId(isExpanded ? null : item._id)}>
        <View style={styles.annTop}>
          <View style={[styles.priorityDot, { backgroundColor: prColor }]} />
          <View style={styles.annMeta}>
            <View style={[styles.scopeBadge, { backgroundColor: item.scope === 'global' ? COLORS.primaryLight : COLORS.secondaryLight }]}>
              <Text style={[styles.scopeText, { color: item.scope === 'global' ? COLORS.primary : COLORS.secondary }]}>
                {item.scope === 'global' ? '🌐 Global' : `👥 ${item.batch?.name || 'Batch'}`}
              </Text>
            </View>
          </View>
          {canManage && (
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.annTitle}>{item.title}</Text>

        {isExpanded && (
          <Text style={styles.annContent}>{item.content}</Text>
        )}

        <View style={styles.annFooter}>
          <View style={[styles.authorChip, { backgroundColor: roleColor + '15' }]}>
            <Text style={[styles.authorText, { color: roleColor }]}>
              {item.author?.name} · {item.author?.role?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.annDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>

        {item.priority !== 'normal' && (
          <View style={[styles.priorityBanner, { backgroundColor: prColor + '15' }]}>
            <Text style={[styles.priorityText, { color: prColor }]}>
              {item.priority === 'urgent' ? '🚨 URGENT' : '⭐ IMPORTANT'}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{APP_NAME}</Text>
          <Text style={styles.headerSub}>Announcements</Text>
        </View>
        {(canManage || isTeacher) && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addBtnText}>+ Post</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={announcements}
        keyExtractor={i => i._id}
        renderItem={renderAnnouncement}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <EmptyState icon="📭" title="No Announcements" subtitle="Nothing posted yet. Check back soon!" />
        }
      />

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Announcement</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Input
              label="Title"
              value={form.title}
              onChangeText={v => setForm({ ...form, title: v })}
              placeholder="Announcement title"
            />
            <Input
              label="Content"
              value={form.content}
              onChangeText={v => setForm({ ...form, content: v })}
              placeholder="Write your announcement..."
              multiline
            />
            {canManage && (
              <SelectPicker
                label="Scope"
                value={form.scope}
                options={SCOPES}
                onChange={v => setForm({ ...form, scope: v, batch: '' })}
              />
            )}
            {form.scope === 'batch' && (
              <SelectPicker
                label="Select Batch"
                value={form.batch}
                options={batches}
                onChange={v => setForm({ ...form, batch: v })}
                placeholder="Choose a batch..."
              />
            )}
            <SelectPicker
              label="Priority"
              value={form.priority}
              options={PRIORITIES}
              onChange={v => setForm({ ...form, priority: v })}
            />
            <Button
              title="Post Announcement"
              onPress={handleCreate}
              loading={saving}
              style={styles.postBtn}
            />
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
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  list: { padding: 16, paddingTop: 12 },
  annCard: { marginBottom: 12 },
  annTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  annMeta: { flex: 1 },
  scopeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  scopeText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },
  annTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8, lineHeight: 22 },
  annContent: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 8 },
  annFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  authorChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  authorText: { fontSize: 11, fontWeight: '600' },
  annDate: { fontSize: 12, color: COLORS.textMuted },
  priorityBanner: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary, padding: 4 },
  modalScroll: { padding: 20 },
  postBtn: { marginTop: 8 },
});
