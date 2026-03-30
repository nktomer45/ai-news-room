const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String, required: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  tags: [String],
  imageUrl: String,
  topic: { type: String, required: true, unique: true },
  status: { type: String, enum: ['draft', 'published', 'review'], default: 'draft' },
  isAuto: { type: Boolean, default: false },
  // ── Agent Pipeline Metadata ──
  agentMeta: {
    qualityScore:   { type: Number },
    editorNotes:    { type: String },
    qaAttempts:     { type: Number, default: 1 },
    angle:          { type: String },
    targetAudience: { type: String },
    tone:           { type: String },
    pipelineRunId:  { type: String },
  }
}, { timestamps: true });

// Performance Indexes
articleSchema.index({ createdAt: -1 });
articleSchema.index({ status: 1 });
articleSchema.index({ 'agentMeta.pipelineRunId': 1 });

module.exports = mongoose.model('Article', articleSchema);
