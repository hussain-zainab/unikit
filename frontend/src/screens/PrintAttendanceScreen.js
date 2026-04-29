import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { attendanceService, batchService } from '../services/api';
import { Card, Button, SelectPicker, LoadingSpinner, EmptyState } from '../components/UI';
import { COLORS } from '../constants/config';

// NOTE: This screen generates a formatted text/HTML attendance report.
// In a full production build, you'd use expo-print + expo-sharing to
// generate a real PDF. This version creates a shareable text report.

export default function PrintAttendanceScreen() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);

  useEffect(() => { loadBatches(); }, []);

  const loadBatches = async () => {
    try {
      const res = await batchService.getAll();
      setBatches(res.data.batches);
    } catch (e) {} finally { setLoading(false); }
  };

  const generateReport = async () => {
    if (!selectedBatch) return Alert.alert('Error', 'Please select a batch');
    setGenerating(true);
    try {
      const [statsRes, batchRes] = await Promise.all([
        attendanceService.getBatchStats(selectedBatch),
        batchService.getById(selectedBatch),
      ]);
      setReportData(statsRes.data);
      setBatchInfo(batchRes.data.batch);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate report');
    } finally { setGenerating(false); }
  };

  const batchOptions = batches.map(b => ({ value: b._id, label: b.name }));

  if (loading) return <LoadingSpinner />;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Print Attendance</Text>
      </View>

      <ScrollView style={styles.body}>
        <Card>
          <Text style={styles.cardTitle}>📄 Generate Attendance Report</Text>
          <Text style={styles.cardSub}>Select a batch to generate a formatted attendance report with all student stats.</Text>
          <SelectPicker
            label="Select Batch"
            value={selectedBatch}
            options={batchOptions}
            onChange={setSelectedBatch}
            placeholder="Choose a batch..."
            style={{ marginTop: 12 }}
          />
          <Button
            title="Generate Report"
            onPress={generateReport}
            loading={generating}
            style={{ marginTop: 8 }}
          />
        </Card>

        {reportData && batchInfo && (
          <View style={styles.report}>
            {/* Report Header */}
            <View style={styles.reportHeader}>
              <Text style={styles.universityName}>UNIVERSITY MANAGEMENT SYSTEM</Text>
              <Text style={styles.reportTitle}>ATTENDANCE REPORT</Text>
              <View style={styles.reportMeta}>
                <Text style={styles.reportMetaText}>Batch: {batchInfo.name}</Text>
                <Text style={styles.reportMetaText}>Department: {batchInfo.department}</Text>
                <Text style={styles.reportMetaText}>Year: {batchInfo.year} · Section: {batchInfo.section}</Text>
                <Text style={styles.reportMetaText}>Generated: {today}</Text>
                <Text style={styles.reportMetaText}>Total Sessions: {reportData.totalSessions}</Text>
              </View>
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryBox, { backgroundColor: COLORS.primaryLight }]}>
                <Text style={[styles.summaryNum, { color: COLORS.primary }]}>{reportData.stats.length}</Text>
                <Text style={[styles.summaryLbl, { color: COLORS.primary }]}>Students</Text>
              </View>
              <View style={[styles.summaryBox, { backgroundColor: COLORS.successLight }]}>
                <Text style={[styles.summaryNum, { color: COLORS.success }]}>
                  {reportData.stats.filter(s => s.percentage >= 75).length}
                </Text>
                <Text style={[styles.summaryLbl, { color: COLORS.success }]}>≥75%</Text>
              </View>
              <View style={[styles.summaryBox, { backgroundColor: COLORS.dangerLight }]}>
                <Text style={[styles.summaryNum, { color: COLORS.danger }]}>
                  {reportData.stats.filter(s => s.percentage < 75).length}
                </Text>
                <Text style={[styles.summaryLbl, { color: COLORS.danger }]}>&lt;75%</Text>
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableCellRoll]}>Roll No.</Text>
              <Text style={[styles.tableCell, styles.tableCellName]}>Name</Text>
              <Text style={[styles.tableCell, styles.tableCellNum]}>Present</Text>
              <Text style={[styles.tableCell, styles.tableCellNum]}>Total</Text>
              <Text style={[styles.tableCell, styles.tableCellPct]}>%</Text>
              <Text style={[styles.tableCell, styles.tableCellStatus]}>Status</Text>
            </View>

            {/* Table Rows */}
            {reportData.stats
              .sort((a, b) => (a.student?.rollNumber || '').localeCompare(b.student?.rollNumber || ''))
              .map((item, idx) => {
                const ok = item.percentage >= 75;
                return (
                  <View key={idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, styles.tableCellRoll, styles.tableCellText]}>
                      {item.student?.rollNumber || '—'}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellName, styles.tableCellText]}>
                      {item.student?.name}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellNum, styles.tableCellText]}>
                      {item.attended}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellNum, styles.tableCellText]}>
                      {item.totalClasses}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellPct, { color: ok ? COLORS.success : COLORS.danger, fontWeight: '700' }]}>
                      {item.percentage}%
                    </Text>
                    <View style={[styles.tableCell, styles.tableCellStatus]}>
                      <View style={[styles.statusDot, { backgroundColor: ok ? COLORS.success : COLORS.danger }]} />
                    </View>
                  </View>
                );
              })}

            {/* Footer */}
            <View style={styles.reportFooter}>
              <Text style={styles.footerText}>🟢 ≥75%: Eligible &nbsp;&nbsp; 🔴 &lt;75%: Shortage</Text>
              <Text style={styles.footerText}>This report was generated by {batchInfo.name} — {today}</Text>
            </View>

            <View style={styles.printNote}>
              <Text style={styles.printNoteText}>
                📌 To print: Take a screenshot or use your device's share/print functionality.
                In production, this screen can export a PDF using expo-print.
              </Text>
            </View>
          </View>
        )}

        {!reportData && !generating && (
          <EmptyState icon="🖨️" title="No report generated" subtitle="Select a batch above and tap Generate Report" />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.primary },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  body: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  report: {
    backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, marginTop: 4,
  },
  reportHeader: {
    backgroundColor: COLORS.primary, padding: 20, alignItems: 'center',
  },
  universityName: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginBottom: 4 },
  reportTitle: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: 1, marginBottom: 12 },
  reportMeta: { alignItems: 'center', gap: 3 },
  reportMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  summaryRow: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '900' },
  summaryLbl: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.text,
    paddingVertical: 10, paddingHorizontal: 8,
  },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8 },
  tableRowAlt: { backgroundColor: COLORS.background },
  tableCell: { justifyContent: 'center' },
  tableCellText: { fontSize: 12, color: COLORS.text },
  tableCellRoll: { width: 60, fontSize: 11, fontWeight: '700', color: COLORS.white },
  tableCellName: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.white },
  tableCellNum: { width: 44, textAlign: 'center', fontSize: 11, fontWeight: '700', color: COLORS.white },
  tableCellPct: { width: 40, textAlign: 'center', fontSize: 11, fontWeight: '700', color: COLORS.white },
  tableCellStatus: { width: 40, alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  reportFooter: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 4 },
  footerText: { fontSize: 11, color: COLORS.textSecondary },
  printNote: { backgroundColor: COLORS.warningLight, padding: 14, margin: 12, borderRadius: 10 },
  printNoteText: { fontSize: 12, color: COLORS.warning, lineHeight: 18 },
});
