const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Design', 'Tech', 'Writing', 'Marketing', 'Local Help', 'Other'],
  },
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['open', 'inprogress', 'completed', 'cancelled'], default: 'open' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  tags: [{ type: String }],
  requirements: { type: String, default: '' },
  applicationsCount: { type: Number, default: 0 },
  isRemote: { type: Boolean, default: true },
  location: { type: String, default: '' },
}, { timestamps: true });

gigSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Gig', gigSchema);
