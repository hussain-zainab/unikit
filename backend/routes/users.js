const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

// All user routes require authentication
router.use(protect);

// ─── GET /api/users ───────────────────────────────────────────────────────────
// HOD/Admin: get all users. Teacher: get students in their batch. Student: N/A
router.get('/', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.batch) filter.batch = req.query.batch;

    const users = await User.find(filter)
      .populate('batch', 'name department')
      .sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/users ──────────────────────────────────────────────────────────
// HOD/Admin: create a new user (teacher or student)
router.post('/', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const { name, email, role, phone, rollNumber, batch } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'name, email, and role are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, role, phone, rollNumber, batch: batch || null });
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('batch', 'name department year');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Students can only view their own profile
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
router.put('/:id', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const { name, email, phone, rollNumber, batch, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, rollNumber, batch, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete('/:id', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/users/:id/reset-password ──────────────────────────────────────
// Force a user back to first-login state
router.post('/:id/reset-password', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = null;
    user.isFirstLogin = true;
    await user.save();
    res.json({ message: 'Password reset. User must set new password on next login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
