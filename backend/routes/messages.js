const express = require('express');
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/:room
router.get('/:room', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('messages')
      .where('room_id', '==', req.params.room)
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get();

    const messages = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const senderDoc = await db.collection('profiles').doc(data.sender_id).get();
      return { ...data, id: doc.id, _id: doc.id, sender: senderDoc.exists ? senderDoc.data() : null };
    }));

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages
router.post('/', protect, async (req, res) => {
  try {
    const { room, content, fileUrl, fileType } = req.body;
    
    const msgData = {
      room_id: room,
      sender_id: req.user.id,
      content,
      file_url: fileUrl,
      file_type: fileType,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('messages').add(msgData);
    
    const senderDoc = await db.collection('profiles').doc(req.user.id).get();
    res.status(201).json({ ...msgData, id: docRef.id, _id: docRef.id, sender: senderDoc.data() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/rooms/list
router.get('/rooms/list', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    // Simple approach: find messages where userId is in the room_id string
    // In production, a "conversations" collection would be better.
    const snapshot = await db.collection('messages')
      .orderBy('createdAt', 'desc')
      .get();

    const rooms = [];
    const seenRooms = new Set();
    
    for (const doc of snapshot.docs) {
      const msg = doc.data();
      if (msg.room_id.includes(userId) && !seenRooms.has(msg.room_id)) {
        seenRooms.add(msg.room_id);
        rooms.push({ _id: msg.room_id, lastMessage: { ...msg, id: doc.id } });
      }
    }

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
