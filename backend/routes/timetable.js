const express = require('express');
const router = express.Router();
const TimetableEntry = require('../models/TimetableEntry');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// ─── GET /api/timetable ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { batchId, teacherId } = req.query;
    const filter = { isActive: true };

    if (req.user.role === 'student') {
      filter.batch = req.user.batch;
    } else if (req.user.role === 'teacher') {
      filter.teacher = req.user._id;
      if (batchId) filter.batch = batchId;
    } else {
      if (batchId) filter.batch = batchId;
      if (teacherId) filter.teacher = teacherId;
    }

    const entries = await TimetableEntry.find(filter)
      .populate('batch', 'name department')
      .populate('teacher', 'name email')
      .sort({ day: 1, startTime: 1 });

    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/timetable ──────────────────────────────────────────────────────
router.post('/', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const { batch, subject, day, startTime, endTime, roomNumber } = req.body;
    if (!batch || !subject || !day || !startTime || !endTime) {
      return res.status(400).json({ message: 'batch, subject, day, startTime, endTime required' });
    }

    const entry = await TimetableEntry.create({
      batch, subject, day, startTime, endTime,
      roomNumber: roomNumber || '',
      teacher: req.user._id,
    });

    const populated = await TimetableEntry.findById(entry._id)
      .populate('batch', 'name department')
      .populate('teacher', 'name email');
    res.status(201).json({ entry: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/timetable/:id ───────────────────────────────────────────────────
router.put('/:id', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    if (req.user.role === 'teacher' && entry.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this entry' });
    }

    const { subject, day, startTime, endTime, roomNumber } = req.body;
    const updated = await TimetableEntry.findByIdAndUpdate(
      req.params.id, { subject, day, startTime, endTime, roomNumber }, { new: true }
    ).populate('batch', 'name').populate('teacher', 'name');
    res.json({ entry: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/timetable/:id ────────────────────────────────────────────────
router.delete('/:id', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    if (req.user.role === 'teacher' && entry.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await TimetableEntry.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Entry removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
