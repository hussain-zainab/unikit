const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },           // null until first login
    role: {
      type: String,
      enum: ['hod', 'admin', 'teacher', 'student'],
      required: true,
    },
    phone: { type: String, default: '' },
    rollNumber: { type: String, default: '' },           // for students
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    isFirstLogin: { type: Boolean, default: true },      // must set password on first login
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
