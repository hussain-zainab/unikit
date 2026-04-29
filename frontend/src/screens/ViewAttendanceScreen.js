import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { attendanceService, batchService } from '../services/api';
import { Card, SelectPicker, EmptyState, LoadingSpinner, Avatar, Badge } from '../components/UI';
import { COLORS } from '../constants/config';

const PctBar = ({ pct }) => {
  const color = pct >= 75 ? COLORS.success : pct >= 50 ? COLORS.warning : COLORS.danger;
  return (
    <View style={styles.pctWrap}>
      <View style={styles.pctBarBg}>
        <View style={[styles.pctBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pctLabel, { color }]}>{pct}%</Text>
    </View>
  );
};

export default function ViewAttendanceScreen() {
  const { user, isStudent, canManage, isTeacher } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [stats, setStats] = useState([]);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);

  useEffect(() => {
    if (isStudent) {
      loadStudentStats();
    } else {
      loadBatches();
    }
  }, []);

  const loadBatches = async () => {
    try {
      const res = await batchService.getAll();
      setBatches(res.data.batches);
      if (res.data.batches.length > 0) {
        setSelectedBatch(res.data.batches[0]._id);
        loadBatchStats(res.data.batches[0]._id);
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const loadStudentStats = async () => {
    try {
      const res = await attendanceService.getStudentStats(user._id);
      setStudentStats(res.data);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  };

  const loadBatchStats = async (batchId) => {
    setStatsLoading(true);
    try {
      const res = await attendanceService.getBatchStats(batchId);
      setStats(res.data.stats);
    } catch (e) {} finally { setStatsLoading(false); }
  };

  const openStudentDetail = async (student) => {
    setSelectedStudent(student);
    setDetailModal(true);
    try {
      const res = await attendanceService.getStudentStats(student.student._id);
      setStudentDetail(res.data);
    } catch (e) {}
  };

  const batchOptions = batches.map(b => ({ value: b._id, label: b.name }));

  if (loading) return <LoadingSpinner />;

  // ─── Student View ─────────────────────────────────────────────────────────────
  if (isStudent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Attendance</Text>
        </View>
        <ScrollView
          style={styles.body}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStudentStats(); }} />}
        >
          {studentStats && (
            <>
              {/* Overall Card */}
              <View style={styles.overallCard}>
                <Text style={styles.overallLabel}>Overall Attendance</Text>
                <Text style={styles.overallPct}>{studentStats.overall.percentage}%</Text>
                <View style={styles.overallBarBg}>
                  <View style={[styles.overallBarFill, {
                    width: `${studentStats.overall.percentage}%`,
                    backgroundColor: studentStats.overall.percentage >= 75 ? COLORS.success : COLORS.danger,
                  }]} />
                </View>
                <Text style={styles.overallSub}>
                  {studentStats.overall.attended} / {studentStats.overall.totalClasses} classes attended
                </Text>
                {studentStats.overall.percentage < 75 && (
                  <View style={styles.warningBanner}>
                    <Text style={styles.warningText}>⚠️ Below 75% threshold</Text>
                  </View>
                )}
              </View>

              {/* Subject Breakdown */}
              {studentStats.breakdown.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Subject-wise Breakdown</Text>
                  {studentStats.breakdown.map((item, idx) => (
                    <Card key={idx} style={styles.subjectCard}>
                      <View style={styles.subjectTop}>
                        <Text style={styles.subjectName}>{item.subject}</Text>
                        <Badge
                          label={`${item.percentage}%`}
                          color={item.percentage >= 75 ? COLORS.success : COLORS.danger}
                        />
                      </View>
                      <Text style={styles.subjectBatch}>{item.batch?.name}</Text>
                      <PctBar pct={item.percentage} />
                      <Text style={styles.subjectMeta}>{item.attended}/{item.totalClasses} classes</Text>
                    </Card>
                  ))}
                </>
              )}

              {studentStats.breakdown.length === 0 && (
                <EmptyState icon="📊" title="No attendance data" subtitle="Your attendance will appear here once classes begin" />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Teacher / Admin / HOD View ───────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>View Attendance</Text>
      </View>

      <View style={styles.body}>
        <SelectPicker
          label="Select Batch"
          value={selectedBatch}
          options={batchOptions}
          onChange={(v) => { setSelectedBatch(v); loadBatchStats(v); }}
          style={{ marginBottom: 8 }}
        />

        {statsLoading ? (
          <LoadingSpinner text="Loading stats..." />
        ) : stats.length === 0 ? (
          <EmptyState icon="📊" title="No data yet" subtitle="Attendance data will appear after sessions are submitted" />
        ) : (
          <FlatList
            data={stats}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Card style={styles.statRow} onPress={() => openStudentDetail(item)}>
                <View style={styles.statRowTop}>
                  <Avatar name={item.student?.name} size={40} />
                  <View style={styles.statInfo}>
                    <Text style={styles.statName}>{item.student?.name}</Text>
                    <Text style={styles.statRoll}>{item.student?.rollNumber || '—'}</Text>
                  </View>
                  <View style={styles.statRight}>
                    <Text style={[styles.statPct, {
                      color: item.percentage >= 75 ? COLORS.success : COLORS.danger
                    }]}>{item.percentage}%</Text>
                    <Text style={styles.statClasses}>{item.attended}/{item.totalClasses}</Text>
                  </View>
                </View>
                <PctBar pct={item.percentage} />
              </Card>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      {/* Student Detail Modal */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedStudent?.student?.name}</Text>
            <TouchableOpacity onPress={() => { setDetailModal(false); setStudentDetail(null); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {!studentDetail ? (
              <LoadingSpinner />
            ) : (
              <>
                <View style={styles.overallCard}>
                  <Text style={styles.overallLabel}>Overall</Text>
                  <Text style={styles.overallPct}>{studentDetail.overall.percentage}%</Text>
                  <Text style={styles.overallSub}>
                    {studentDetail.overall.attended} of {studentDetail.overall.totalClasses} classes
                  </Text>
                </View>
                {studentDetail.breakdown.map((item, i) => (
                  <Card key={i} style={styles.subjectCard}>
                    <View style={styles.subjectTop}>
                      <Text style={styles.subjectName}>{item.subject}</Text>
                      <Badge
                        label={`${item.percentage}%`}
                        color={item.percentage >= 75 ? COLORS.success : COLORS.danger}
                      />
                    </View>
                    <PctBar pct={item.percentage} />
                    <Text style={styles.subjectMeta}>{item.attended}/{item.totalClasses} classes</Text>
                  </Card>
                ))}
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
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  body: { flex: 1, padding: 16 },
  overallCard: {
    backgroundColor: COLORS.primary, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 20,
  },
  overallLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  overallPct: { fontSize: 52, fontWeight: '900', color: COLORS.white },
  overallBarBg: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, marginTop: 12 },
  overallBarFill: { height: '100%', borderRadius: 4 },
  overallSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8 },
  warningBanner: { marginTop: 12, backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  warningText: { fontSize: 13, color: '#FCA5A5', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  subjectCard: { marginBottom: 10 },
  subjectTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  subjectName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  subjectBatch: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  subjectMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  pctWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  pctBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginRight: 10, overflow: 'hidden' },
  pctBarFill: { height: '100%', borderRadius: 3 },
  pctLabel: { fontSize: 13, fontWeight: '700', minWidth: 38, textAlign: 'right' },
  statRow: { marginBottom: 10 },
  statRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statInfo: { flex: 1, marginLeft: 12 },
  statName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  statRoll: { fontSize: 12, color: COLORS.textSecondary },
  statRight: { alignItems: 'flex-end' },
  statPct: { fontSize: 18, fontWeight: '800' },
  statClasses: { fontSize: 11, color: COLORS.textMuted },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary },
  modalBody: { padding: 16 },
});
