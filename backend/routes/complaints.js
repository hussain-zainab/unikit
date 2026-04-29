const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// ─── GET /api/complaints ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      filter.submittedBy = req.user._id;
    } else if (req.user.role === 'teacher') {
      filter.batch = { $in: req.query.batches ? req.query.batches.split(',') : [] };
    }
    // HOD/Admin see all

    const complaints = await Complaint.find(filter)
      .populate('submittedBy', 'name rollNumber')
      .populate('batch', 'name')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/complaints ─────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, description, category, isAnonymous } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'title and description are required' });
    }

    const complaint = await Complaint.create({
      title, description,
      category: category || 'other',
      isAnonymous: isAnonymous || false,
      submittedBy: req.user._id,
      batch: req.user.batch || null,
    });

    const populated = await Complaint.findById(complaint._id)
      .populate('submittedBy', 'name rollNumber')
      .populate('batch', 'name');
    res.status(201).json({ complaint: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/complaints/:id/respond ─────────────────────────────────────────
// HOD/Admin respond and update status
router.put('/:id/respond', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    const { status, response } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: status || 'in_review',
        response: response || '',
        resolvedBy: req.user._id,
      },
      { new: true }
    )
      .populate('submittedBy', 'name rollNumber')
      .populate('resolvedBy', 'name');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/complaints/:id ───────────────────────────────────────────────
router.delete('/:id', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
