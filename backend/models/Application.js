const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, default: '' },
  proposedBudget: { type: Number },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

applicationSchema.index({ gig: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
