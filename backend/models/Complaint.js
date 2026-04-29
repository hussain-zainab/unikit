const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['academic', 'infrastructure', 'faculty', 'administrative', 'other'],
      default: 'other',
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'closed'],
      default: 'open',
    },
    response: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
