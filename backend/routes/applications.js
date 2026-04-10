const express = require('express');
const Application = require('../models/Application');
const Gig = require('../models/Gig');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/applications - apply for a gig
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student')
      return res.status(403).json({ message: 'Only students can apply' });
    const { gigId, coverLetter, proposedBudget } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig || gig.status !== 'open')
      return res.status(400).json({ message: 'Gig not available' });
    const exists = await Application.findOne({ gig: gigId, applicant: req.user._id });
    if (exists) return res.status(400).json({ message: 'Already applied' });
    const application = await Application.create({
      gig: gigId, applicant: req.user._id, coverLetter, proposedBudget,
    });
    await Gig.findByIdAndUpdate(gigId, { $inc: { applicationsCount: 1 } });
    await Notification.create({
      user: gig.client,
      type: 'application',
      title: 'New Application',
      message: `${req.user.name} applied for "${gig.title}"`,
      link: `/gigs/${gigId}/applications`,
    });
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/gig/:gigId - get all applications for a gig
router.get('/gig/:gigId', protect, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.client.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    const applications = await Application.find({ gig: req.params.gigId })
      .populate('applicant', 'name avatar bio skills rating reviewCount');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications/my - student's own applications
router.get('/my', protect, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({ path: 'gig', populate: { path: 'client', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/applications/:id/status - accept or reject
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id).populate('gig');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.gig.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    application.status = status;
    await application.save();
    if (status === 'accepted') {
      await Gig.findByIdAndUpdate(application.gig._id, {
        status: 'inprogress', assignedTo: application.applicant,
      });
      await Notification.create({
        user: application.applicant,
        type: 'application',
        title: 'Application Accepted!',
        message: `Your application for "${application.gig.title}" was accepted`,
        link: `/gigs/${application.gig._id}`,
      });
    }
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
