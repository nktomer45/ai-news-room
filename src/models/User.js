const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor'], default: 'admin' },
  settings: {
    publishMode: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    contentQuality: { type: String, enum: ['standard', 'high', 'ultra'], default: 'high' },
    sourceRegion: { type: String, default: 'US' },
    fetchInterval: { type: String, default: '1h' },
    maxArticlesPerRun: { type: Number, default: 2 },
    duplicateDetection: { type: Boolean, default: true },
    preferredCategories: [{ type: String }],
    notificationsEnabled: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
