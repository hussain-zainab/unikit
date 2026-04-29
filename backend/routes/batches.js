const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// ─── GET /api/batches ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let batches;
    if (req.user.role === 'student') {
      batches = await Batch.find({ students: req.user._id, isActive: true })
        .populate('students', 'name rollNumber email')
        .populate('teachers', 'name email');
    } else if (req.user.role === 'teacher') {
      batches = await Batch.find({ teachers: req.user._id, isActive: true })
        .populate('students', 'name rollNumber email phone')
        .populate('teachers', 'name email');
    } else {
      batches = await Batch.find({ isActive: true })
        .populate('students', 'name rollNumber email phone')
        .populate('teachers', 'name email')
        .populate('createdBy', 'name');
    }
    res.json({ batches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/batches ────────────────────────────────────────────────────────
router.post('/', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const { name, department, year, section } = req.body;
    if (!name || !department || !year) {
      return res.status(400).json({ message: 'name, department, and year are required' });
    }
    const batch = await Batch.create({
      name, department, year, section: section || 'A', createdBy: req.user._id,
    });
    res.status(201).json({ batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/batches/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('students', 'name rollNumber email phone')
      .populate('teachers', 'name email')
      .populate('createdBy', 'name');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/batches/:id ─────────────────────────────────────────────────────
router.put('/:id', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const { name, department, year, section, isActive } = req.body;
    const batch = await Batch.findByIdAndUpdate(
      req.params.id, { name, department, year, section, isActive }, { new: true }
    );
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/batches/:id/add-student ───────────────────────────────────────
router.post('/:id/add-student', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    if (batch.students.includes(userId)) {
      return res.status(409).json({ message: 'Student already in batch' });
    }
    batch.students.push(userId);
    await batch.save();

    // Link batch to user
    await User.findByIdAndUpdate(userId, { batch: batch._id });

    const updated = await Batch.findById(batch._id)
      .populate('students', 'name rollNumber email phone')
      .populate('teachers', 'name email');
    res.json({ batch: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/batches/:id/remove-student ────────────────────────────────────
router.post('/:id/remove-student', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    batch.students = batch.students.filter(s => s.toString() !== userId);
    await batch.save();
    await User.findByIdAndUpdate(userId, { batch: null });

    const updated = await Batch.findById(batch._id)
      .populate('students', 'name rollNumber email phone')
      .populate('teachers', 'name email');
    res.json({ batch: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/batches/:id/add-teacher ───────────────────────────────────────
router.post('/:id/add-teacher', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    if (!batch.teachers.includes(userId)) batch.teachers.push(userId);
    await batch.save();
    res.json({ message: 'Teacher added to batch' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/batches/:id/lock ───────────────────────────────────────────────
// Set/update attendance lock on batch
router.post('/:id/lock', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const { lock, password } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    batch.attendanceLock.isLocked = lock;
    if (lock && password) batch.attendanceLock.password = password;
    if (!lock) batch.attendanceLock.password = null;
    await batch.save();
    res.json({ message: lock ? 'Batch locked' : 'Batch unlocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/batches/:id/verify-lock ───────────────────────────────────────
router.post('/:id/verify-lock', async (req, res) => {
  try {
    const { password } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    if (!batch.attendanceLock.isLocked) return res.json({ success: true });
    if (batch.attendanceLock.password === password) return res.json({ success: true });
    res.status(401).json({ success: false, message: 'Incorrect lock password' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
