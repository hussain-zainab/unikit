const express = require('express');
const router = express.Router();
const AttendanceSession = require('../models/AttendanceSession');
const Batch = require('../models/Batch');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// ─── POST /api/attendance/start ───────────────────────────────────────────────
// Start or resume a session for a given batch+subject+date
router.post('/start', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const { batchId, subject, date } = req.body;
    if (!batchId || !subject || !date) {
      return res.status(400).json({ message: 'batchId, subject, and date are required' });
    }

    const batch = await Batch.findById(batchId).populate('students', 'name rollNumber');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Check for lock
    if (batch.attendanceLock.isLocked) {
      return res.status(403).json({ message: 'Batch is locked. Enter lock password first.' });
    }

    // Resume existing incomplete session if any
    let session = await AttendanceSession.findOne({
      batch: batchId, subject, date, isCompleted: false,
    }).populate('records.student', 'name rollNumber');

    if (!session) {
      // Create fresh session with all students as pending
      const records = batch.students.map(s => ({ student: s._id, status: 'pending' }));
      session = await AttendanceSession.create({
        batch: batchId, subject, date,
        teacher: req.user._id,
        records,
        currentIndex: 0,
      });
    }

    const populated = await AttendanceSession.findById(session._id)
      .populate('records.student', 'name rollNumber')
      .populate('batch', 'name');
    res.json({ session: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/attendance/:sessionId/mark ────────────────────────────────────
// Mark one student present/absent and advance index
router.post('/:sessionId/mark', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const { studentId, status } = req.body;
    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ message: 'status must be present or absent' });
    }

    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.isCompleted) return res.status(400).json({ message: 'Session already completed' });

    const record = session.records.find(r => r.student.toString() === studentId);
    if (!record) return res.status(404).json({ message: 'Student not in session' });

    record.status = status;

    // Advance to next pending
    const nextIndex = session.records.findIndex(
      (r, i) => i > session.currentIndex && r.status === 'pending'
    );
    session.currentIndex = nextIndex === -1 ? session.records.length : nextIndex;

    await session.save();

    const populated = await AttendanceSession.findById(session._id)
      .populate('records.student', 'name rollNumber');
    res.json({ session: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/attendance/:sessionId/submit ──────────────────────────────────
// Finalize session
router.post('/:sessionId/submit', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Mark remaining pending as absent
    session.records.forEach(r => { if (r.status === 'pending') r.status = 'absent'; });
    session.isCompleted = true;
    session.submittedAt = new Date();
    await session.save();

    const populated = await AttendanceSession.findById(session._id)
      .populate('records.student', 'name rollNumber')
      .populate('batch', 'name');
    res.json({ session: populated, message: 'Attendance submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/attendance/batch/:batchId ──────────────────────────────────────
// Get all sessions for a batch
router.get('/batch/:batchId', async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { batch: req.params.batchId, isCompleted: true };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    const sessions = await AttendanceSession.find(filter)
      .populate('records.student', 'name rollNumber')
      .populate('teacher', 'name')
      .sort({ date: -1 });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/attendance/stats/:batchId ──────────────────────────────────────
// Per-student attendance stats for a batch
router.get('/stats/:batchId', async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({
      batch: req.params.batchId, isCompleted: true,
    }).populate('records.student', 'name rollNumber');

    const statsMap = {};

    sessions.forEach(session => {
      session.records.forEach(record => {
        const sid = record.student?._id?.toString();
        if (!sid) return;
        if (!statsMap[sid]) {
          statsMap[sid] = {
            student: record.student,
            totalClasses: 0, attended: 0,
          };
        }
        statsMap[sid].totalClasses++;
        if (record.status === 'present') statsMap[sid].attended++;
      });
    });

    const stats = Object.values(statsMap).map(s => ({
      ...s,
      percentage: s.totalClasses > 0
        ? Math.round((s.attended / s.totalClasses) * 100)
        : 0,
    }));

    res.json({ stats, totalSessions: sessions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/attendance/student/:studentId ───────────────────────────────────
// Individual student stats across all batches
router.get('/student/:studentId', async (req, res) => {
  try {
    // Students can only view their own stats
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sessions = await AttendanceSession.find({
      isCompleted: true,
      'records.student': req.params.studentId,
    }).populate('batch', 'name department');

    const subjectMap = {};
    sessions.forEach(session => {
      const record = session.records.find(r => r.student.toString() === req.params.studentId);
      if (!record) return;
      const key = `${session.batch._id}-${session.subject}`;
      if (!subjectMap[key]) {
        subjectMap[key] = {
          batch: session.batch, subject: session.subject,
          totalClasses: 0, attended: 0,
        };
      }
      subjectMap[key].totalClasses++;
      if (record.status === 'present') subjectMap[key].attended++;
    });

    const breakdown = Object.values(subjectMap).map(s => ({
      ...s,
      percentage: s.totalClasses > 0
        ? Math.round((s.attended / s.totalClasses) * 100)
        : 0,
    }));

    const totalClasses = breakdown.reduce((a, b) => a + b.totalClasses, 0);
    const totalAttended = breakdown.reduce((a, b) => a + b.attended, 0);

    res.json({
      breakdown,
      overall: {
        totalClasses,
        attended: totalAttended,
        percentage: totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/attendance/report/:batchId ─────────────────────────────────────
// Full attendance matrix for print/export
router.get('/report/:batchId', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({
      batch: req.params.batchId, isCompleted: true,
    })
      .populate('records.student', 'name rollNumber')
      .sort({ date: 1, subject: 1 });

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
