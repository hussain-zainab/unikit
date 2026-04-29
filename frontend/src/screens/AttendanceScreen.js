import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { batchService, attendanceService } from '../services/api';
import { Card, Button, Input, SelectPicker, EmptyState, LoadingSpinner, Badge } from '../components/UI';
import { COLORS } from '../constants/config';

export default function AttendanceScreen() {
  const { user, canManage, isTeacher } = useAuth();
  const canTake = canManage || isTeacher;
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionModal, setSessionModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [starting, setStarting] = useState(false);
  // Active session state
  const [session, setSession] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [marking, setMarking] = useState(false);
  // Lock verification
  const [lockModal, setLockModal] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [pendingSessionData, setPendingSessionData] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const res = await batchService.getAll();
      setBatches(res.data.batches);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleStartSession = async () => {
    if (!selectedBatch || !subject.trim()) {
      return Alert.alert('Error', 'Please select batch and enter subject');
    }
    const batch = batches.find(b => b._id === selectedBatch);
    if (batch?.attendanceLock?.isLocked) {
      setPendingSessionData({ batchId: selectedBatch, subject, date });
      setLockModal(true);
      return;
    }
    await doStartSession(selectedBatch, subject, date);
  };

  const doStartSession = async (batchId, subj, dt) => {
    setStarting(true);
    try {
      const res = await attendanceService.startSession(batchId, subj, dt);
      setSession(res.data.session);
      setSessionModal(false);
      setSessionActive(true);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to start session');
    } finally { setStarting(false); }
  };

  const verifyLock = async () => {
    try {
      const res = await batchService.verifyLock(pendingSessionData.batchId, lockPassword);
      if (res.data.success) {
        setLockModal(false);
        setLockPassword('');
        await doStartSession(pendingSessionData.batchId, pendingSessionData.subject, pendingSessionData.date);
      }
    } catch (e) {
      Alert.alert('Wrong Password', 'Incorrect lock password');
    }
  };

  const currentRecord = session?.records?.[session?.currentIndex];
  const currentStudent = currentRecord?.student;
  const isLastStudent = session && session.currentIndex >= session.records.length - 1;
  const totalRecords = session?.records?.length || 0;
  const markedCount = session?.records?.filter(r => r.status !== 'pending').length || 0;

  const handleMark = async (status) => {
    if (!currentStudent || marking) return;
    setMarking(true);
    try {
      const res = await attendanceService.markStudent(session._id, currentStudent._id, status);
      setSession(res.data.session);
    } catch (e) {
      Alert.alert('Error', 'Failed to mark attendance');
    } finally { setMarking(false); }
  };

  const handleSubmit = async () => {
    Alert.alert('Submit Attendance', 'Submit and finalize this session? Unmarked students will be marked absent.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit', onPress: async () => {
          try {
            await attendanceService.submitSession(session._id);
            setSessionActive(false);
            setSession(null);
            setSelectedBatch('');
            setSubject('');
            Alert.alert('✅ Done', 'Attendance submitted successfully!');
          } catch (e) {
            Alert.alert('Error', 'Failed to submit');
          }
        }
      }
    ]);
  };

  const batchOptions = batches.map(b => ({ value: b._id, label: b.name }));

  const progressPercent = totalRecords > 0 ? (markedCount / totalRecords) * 100 : 0;

  if (loading) return <LoadingSpinner />;

  // ─── Active Session View ─────────────────────────────────────────────────────
  if (sessionActive && session) {
    const allDone = session.currentIndex >= totalRecords;

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{session.batch?.name}</Text>
            <Text style={styles.headerSub}>{session.subject} · {session.date}</Text>
          </View>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => Alert.alert('Exit Session', 'Your progress is auto-saved. Resume anytime.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Exit', onPress: () => { setSessionActive(false); setSession(null); } }
            ])}
          >
            <Text style={styles.exitBtnText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{markedCount}/{totalRecords}</Text>
        </View>

        {!allDone ? (
          <View style={styles.sessionBody}>
            {/* Student Card */}
            <View style={styles.studentCard}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>
                  {currentStudent?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.studentOrderText}>Student {(session.currentIndex || 0) + 1} of {totalRecords}</Text>
              <Text style={styles.sessionStudentName}>{currentStudent?.name}</Text>
              <Text style={styles.sessionRoll}>{currentStudent?.rollNumber || '—'}</Text>
            </View>

            {/* Quick summary of marked */}
            <View style={styles.markSummary}>
              <View style={[styles.markChip, { backgroundColor: COLORS.successLight }]}>
                <Text style={[styles.markChipNum, { color: COLORS.success }]}>
                  {session.records.filter(r => r.status === 'present').length}
                </Text>
                <Text style={[styles.markChipLabel, { color: COLORS.success }]}>Present</Text>
              </View>
              <View style={[styles.markChip, { backgroundColor: COLORS.dangerLight }]}>
                <Text style={[styles.markChipNum, { color: COLORS.danger }]}>
                  {session.records.filter(r => r.status === 'absent').length}
                </Text>
                <Text style={[styles.markChipLabel, { color: COLORS.danger }]}>Absent</Text>
              </View>
              <View style={[styles.markChip, { backgroundColor: COLORS.warningLight }]}>
                <Text style={[styles.markChipNum, { color: COLORS.warning }]}>
                  {session.records.filter(r => r.status === 'pending').length}
                </Text>
                <Text style={[styles.markChipLabel, { color: COLORS.warning }]}>Pending</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={[styles.markBtn, styles.markBtnAbsent, marking && styles.markBtnDisabled]}
                onPress={() => handleMark('absent')}
                disabled={marking}
                activeOpacity={0.75}
              >
                <Text style={styles.markBtnIcon}>✗</Text>
                <Text style={styles.markBtnText}>Absent</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.markBtn, styles.markBtnPresent, marking && styles.markBtnDisabled]}
                onPress={() => handleMark('present')}
                disabled={marking}
                activeOpacity={0.75}
              >
                <Text style={styles.markBtnIcon}>✓</Text>
                <Text style={styles.markBtnText}>Present</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // All marked - show summary and submit
          <View style={styles.sessionBody}>
            <View style={styles.doneBanner}>
              <Text style={styles.doneIcon}>🎉</Text>
              <Text style={styles.doneTitle}>All students marked!</Text>
              <Text style={styles.doneSub}>Review and submit attendance</Text>
            </View>
            <View style={styles.summaryCards}>
              <View style={[styles.summaryCard, { backgroundColor: COLORS.successLight }]}>
                <Text style={[styles.summaryNum, { color: COLORS.success }]}>
                  {session.records.filter(r => r.status === 'present').length}
                </Text>
                <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Present</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: COLORS.dangerLight }]}>
                <Text style={[styles.summaryNum, { color: COLORS.danger }]}>
                  {session.records.filter(r => r.status === 'absent').length}
                </Text>
                <Text style={[styles.summaryLabel, { color: COLORS.danger }]}>Absent</Text>
              </View>
            </View>
            <Button title="Submit Attendance" onPress={handleSubmit} style={styles.submitBtn} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ─── Main / Start Screen ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        {canTake && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setSessionModal(true)}>
            <Text style={styles.addBtnText}>+ Take</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.body}>
        {canTake ? (
          <>
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>📋 How it works</Text>
              <Text style={styles.infoText}>
                1. Select a batch and subject{'\n'}
                2. Students appear one by one{'\n'}
                3. Mark Present / Absent for each{'\n'}
                4. Submit when done — auto-saves progress
              </Text>
            </Card>

            {batches.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your Batches</Text>
                {batches.map(b => (
                  <Card key={b._id} style={styles.batchRow} onPress={() => {
                    setSelectedBatch(b._id);
                    setSessionModal(true);
                  }}>
                    <View style={styles.batchRowInner}>
                      <View style={styles.batchRowLeft}>
                        <Text style={styles.batchRowName}>{b.name}</Text>
                        <Text style={styles.batchRowMeta}>{b.students?.length || 0} students · {b.department}</Text>
                      </View>
                      <View style={styles.batchRowRight}>
                        {b.attendanceLock?.isLocked && <Text style={styles.lockBadge}>🔒</Text>}
                        <Text style={styles.batchRowArrow}>›</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        ) : (
          <EmptyState icon="📊" title="View your attendance in the View Attendance tab" subtitle="Your teacher marks attendance during class" />
        )}
      </ScrollView>

      {/* Start Session Modal */}
      <Modal visible={sessionModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Start Attendance</Text>
            <TouchableOpacity onPress={() => setSessionModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <SelectPicker
              label="Batch"
              value={selectedBatch}
              options={batchOptions}
              onChange={setSelectedBatch}
              placeholder="Select batch..."
            />
            <Input
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Mathematics"
            />
            <Input
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
            <Button
              title="Start Session"
              onPress={handleStartSession}
              loading={starting}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Lock Verify Modal */}
      <Modal visible={lockModal} transparent animationType="fade">
        <View style={styles.overlayCenter}>
          <View style={styles.lockBox}>
            <Text style={styles.lockBoxTitle}>🔒 Batch is Locked</Text>
            <Text style={styles.lockBoxSub}>Enter the lock password to take attendance</Text>
            <Input
              label="Lock Password"
              value={lockPassword}
              onChangeText={setLockPassword}
              placeholder="Enter password"
              secureTextEntry
            />
            <View style={styles.lockBoxBtns}>
              <Button title="Cancel" variant="ghost" onPress={() => setLockModal(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Verify" onPress={verifyLock} style={{ flex: 1 }} />
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
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  exitBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  exitBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  body: { flex: 1, padding: 16 },
  infoCard: { backgroundColor: COLORS.primaryLight, marginBottom: 20 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.primary, lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  batchRow: { marginBottom: 8, padding: 14 },
  batchRowInner: { flexDirection: 'row', alignItems: 'center' },
  batchRowLeft: { flex: 1 },
  batchRowName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  batchRowMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  batchRowRight: { flexDirection: 'row', alignItems: 'center' },
  lockBadge: { fontSize: 16, marginRight: 4 },
  batchRowArrow: { fontSize: 22, color: COLORS.textMuted, fontWeight: '300' },
  // Session
  progressWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.white },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginRight: 12 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '700', color: COLORS.text, minWidth: 40, textAlign: 'right' },
  sessionBody: { flex: 1, padding: 20 },
  studentCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 32,
    alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  studentAvatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  studentAvatarText: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  studentOrderText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  sessionStudentName: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  sessionRoll: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  markSummary: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  markChip: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  markChipNum: { fontSize: 20, fontWeight: '800' },
  markChipLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  actionBtns: { flexDirection: 'row', gap: 16 },
  markBtn: {
    flex: 1, paddingVertical: 20, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  markBtnPresent: { backgroundColor: COLORS.success },
  markBtnAbsent: { backgroundColor: COLORS.danger },
  markBtnDisabled: { opacity: 0.5 },
  markBtnIcon: { fontSize: 32, color: COLORS.white, fontWeight: '800' },
  markBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginTop: 4 },
  doneBanner: { alignItems: 'center', paddingVertical: 32 },
  doneIcon: { fontSize: 56, marginBottom: 12 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  doneSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  summaryCards: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center' },
  summaryNum: { fontSize: 36, fontWeight: '800' },
  summaryLabel: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  submitBtn: { marginTop: 8 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary },
  modalBody: { padding: 20 },
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  lockBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '100%' },
  lockBoxTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  lockBoxSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  lockBoxBtns: { flexDirection: 'row', marginTop: 8 },
});
