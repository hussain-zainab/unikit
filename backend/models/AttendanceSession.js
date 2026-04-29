const mongoose = require('mongoose');

// One AttendanceSession per class per day
const attendanceSessionSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    subject: { type: String, required: true, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },   // "YYYY-MM-DD"
    records: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['present', 'absent', 'pending'], default: 'pending' },
      },
    ],
    currentIndex: { type: Number, default: 0 },   // resume support
    isCompleted: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
