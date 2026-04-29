const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// ─── GET /api/announcements ───────────────────────────────────────────────────
// Returns announcements relevant to the logged-in user
router.get('/', async (req, res) => {
  try {
    let query = { isActive: true };

    if (req.user.role === 'student') {
      // Get global + batch-specific announcements for their batch
      query = {
        isActive: true,
        $or: [
          { scope: 'global' },
          { scope: 'batch', batch: req.user.batch },
        ],
      };
    } else if (req.user.role === 'teacher') {
      // Get global + announcements for batches they teach
      query = {
        isActive: true,
        $or: [
          { scope: 'global' },
          { scope: 'batch', author: req.user._id },
        ],
      };
    }
    // HOD/Admin get everything

    const announcements = await Announcement.find(query)
      .populate('author', 'name role')
      .populate('batch', 'name')
      .sort({ createdAt: -1 });

    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/announcements ──────────────────────────────────────────────────
router.post('/', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const { title, content, scope, batch, priority } = req.body;
    if (!title || !content || !scope) {
      return res.status(400).json({ message: 'title, content, and scope are required' });
    }

    // Teachers can only post batch-scoped
    if (req.user.role === 'teacher' && scope === 'global') {
      return res.status(403).json({ message: 'Teachers can only post batch announcements' });
    }

    if (scope === 'batch' && !batch) {
      return res.status(400).json({ message: 'batch is required for batch-scoped announcements' });
    }

    const announcement = await Announcement.create({
      title, content, scope, priority: priority || 'normal',
      author: req.user._id,
      batch: scope === 'batch' ? batch : null,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('author', 'name role')
      .populate('batch', 'name');

    res.status(201).json({ announcement: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/announcements/:id ───────────────────────────────────────────────
router.put('/:id', restrictTo('hod', 'admin', 'teacher'), async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });

    // Only author or HOD/Admin can edit
    if (req.user.role === 'teacher' && ann.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this announcement' });
    }

    const { title, content, priority, isActive } = req.body;
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id, { title, content, priority, isActive }, { new: true }
    ).populate('author', 'name role').populate('batch', 'name');

    res.json({ announcement: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/announcements/:id ───────────────────────────────────────────
router.delete('/:id', restrictTo('hod', 'admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Announcement removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
