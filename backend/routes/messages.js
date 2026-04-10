const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/:room - fetch messages for a chat room
router.get('/:room', protect, async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(name, avatar)')
      .eq('room_id', req.params.room)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages - send a message (REST fallback)
router.post('/', protect, async (req, res) => {
  try {
    const { room, content, fileUrl, fileType } = req.body;
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        room_id: room,
        sender_id: req.user.id,
        content,
        file_url: fileUrl,
        file_type: fileType,
      })
      .select('*, sender:profiles!sender_id(name, avatar)')
      .single();

    if (error) throw error;
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/rooms/list - get user's chat rooms
router.get('/rooms/list', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    // Find all unique room_ids that contain the user's ID
    const { data: rooms, error } = await supabase
      .from('messages')
      .select('room_id, created_at, content, sender_id')
      .ilike('room_id', `%${userId}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Use JS to group and get the last message for each room (or use a complex SQL query)
    const uniqueRooms = [];
    const seenRooms = new Set();
    for (const msg of rooms) {
      if (!seenRooms.has(msg.room_id)) {
        seenRooms.add(msg.room_id);
        uniqueRooms.push({ _id: msg.room_id, lastMessage: msg });
      }
    }

    res.json(uniqueRooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
