const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/:room - fetch messages for a chat room
router.get('/:room', protect, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages - send a message (REST fallback)
router.post('/', protect, async (req, res) => {
  try {
    const { room, content, fileUrl, fileType } = req.body;
    const message = await Message.create({
      room, sender: req.user._id, content, fileUrl, fileType,
    });
    await message.populate('sender', 'name avatar');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/rooms/list - get user's chat rooms
router.get('/rooms/list', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const rooms = await Message.aggregate([
      { $match: { room: { $regex: userId } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$room', lastMessage: { $first: '$$ROOT' } } },
    ]);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
