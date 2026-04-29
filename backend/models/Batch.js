const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },       // e.g. "CS-2024-A"
    department: { type: String, required: true, trim: true },
    year: { type: String, required: true },                    // e.g. "2024"
    section: { type: String, default: 'A' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    attendanceLock: {
      isLocked: { type: Boolean, default: false },
      password: { type: String, default: null },               // plain text pin (simple lock)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', batchSchema);
