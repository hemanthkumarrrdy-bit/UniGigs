require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
// Firebase initialized in routes/config

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/gigs', require('./routes/gigs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.io – real-time messaging
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room ${room}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { room, senderId, content, fileUrl, fileType } = data;
      const { db } = require('./config/firebase');
      
      const msgData = {
        room_id: room,
        sender_id: senderId,
        content,
        file_url: fileUrl,
        file_type: fileType,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await db.collection('messages').add(msgData);
      const senderDoc = await db.collection('profiles').doc(senderId).get();
      
      const fullMessage = { ...msgData, _id: docRef.id, sender: senderDoc.exists ? senderDoc.data() : null };
      io.to(room).emit('receive_message', fullMessage);
    } catch (err) {
      console.error('Socket message error:', err.message);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('typing', { userId: data.userId });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.room).emit('stop_typing', { userId: data.userId });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 UniGigs API running on port ${PORT}`));
