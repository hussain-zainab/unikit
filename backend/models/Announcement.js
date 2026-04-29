const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scope: {
      type: String,
      enum: ['global', 'batch'],
      required: true,
    },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null }, // null = global
    priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
