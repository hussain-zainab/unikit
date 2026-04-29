import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Card, Button, Input, Avatar, Divider, Badge } from '../components/UI';
import { COLORS, ROLE_COLORS, ROLE_LABELS, APP_NAME } from '../constants/config';

export default function ProfileScreen() {
  const { user, logout, refreshUser, isStudent, canManage, isTeacher } = useAuth();
  const [changePwdModal, setChangePwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const roleColor = ROLE_COLORS[user?.role] || COLORS.primary;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) {
      return Alert.alert('Error', 'All fields are required');
    }
    if (pwdForm.newPwd.length < 6) return Alert.alert('Error', 'New password must be at least 6 characters');
    if (pwdForm.newPwd !== pwdForm.confirm) return Alert.alert('Error', 'Passwords do not match');

    setSaving(true);
    try {
      await authService.changePassword(pwdForm.current, pwdForm.newPwd);
      Alert.alert('Success', 'Password changed successfully');
      setChangePwdModal(false);
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const INFO_ROWS = [
    { label: '📧 Email', value: user?.email },
    { label: '📱 Phone', value: user?.phone || '—' },
    ...(isStudent ? [
      { label: '🎓 Roll Number', value: user?.rollNumber || '—' },
      { label: '🏫 Batch', value: user?.batch?.name || '—' },
    ] : []),
    { label: '📅 Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.body}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: roleColor }]}>
          <Avatar name={user?.name} size={80} color={COLORS.white} style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
          <Text style={styles.profileName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={[styles.roleLabel, { color: roleColor }]}>{ROLE_LABELS[user?.role] || user?.role}</Text>
          </View>
        </View>

        {/* Info */}
        <Card style={styles.infoCard}>
          {INFO_ROWS.map(({ label, value }, idx) => (
            <View key={idx}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
              {idx < INFO_ROWS.length - 1 && <Divider style={{ marginVertical: 0 }} />}
            </View>
          ))}
        </Card>

        {/* Account Actions */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card>
          <TouchableOpacity style={styles.actionRow} onPress={() => setChangePwdModal(true)}>
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={styles.actionLabel}>Change Password</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <Divider style={{ marginVertical: 0 }} />
          <TouchableOpacity style={styles.actionRow} onPress={refreshUser}>
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionLabel}>Refresh Profile</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* App Info */}
        <Card style={styles.appCard}>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDesc}>University Management System</Text>
        </Card>

        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={changePwdModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setChangePwdModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input
              label="Current Password"
              value={pwdForm.current}
              onChangeText={v => setPwdForm({ ...pwdForm, current: v })}
              placeholder="Your current password"
              secureTextEntry
            />
            <Input
              label="New Password"
              value={pwdForm.newPwd}
              onChangeText={v => setPwdForm({ ...pwdForm, newPwd: v })}
              placeholder="At least 6 characters"
              secureTextEntry
            />
            <Input
              label="Confirm New Password"
              value={pwdForm.confirm}
              onChangeText={v => setPwdForm({ ...pwdForm, confirm: v })}
              placeholder="Repeat new password"
              secureTextEntry
            />
            <Button title="Change Password" onPress={handleChangePassword} loading={saving} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  body: { flex: 1 },
  profileCard: {
    alignItems: 'center', paddingVertical: 32, paddingBottom: 40,
  },
  profileName: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginTop: 14 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 5,
    borderRadius: 20, marginTop: 8,
  },
  roleLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  infoCard: { marginHorizontal: 16, marginTop: -16, borderRadius: 20, padding: 0, overflow: 'hidden', marginBottom: 20 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, maxWidth: '60%', textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginHorizontal: 16, marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  actionArrow: { fontSize: 22, color: COLORS.textMuted },
  appCard: { marginTop: 16, alignItems: 'center', paddingVertical: 20 },
  appName: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  appVersion: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  appDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  logoutBtn: { marginHorizontal: 16, marginTop: 20, backgroundColor: COLORS.dangerLight, borderWidth: 1, borderColor: COLORS.danger },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary },
  modalBody: { padding: 20 },
});
