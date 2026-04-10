'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import styles from './messages.module.css';
import AuthGuard from '@/components/AuthGuard';

let socket: Socket;

export default function MessagesPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="spinner" style={{ margin: '80px auto' }} />}>
        <MessagesInner />
      </Suspense>
    </AuthGuard>
  );
}

function MessagesInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const withId = searchParams.get('with');
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create room ID from two user IDs (sorted for consistency)
  const makeRoom = (a: string, b: string) => [a, b].sort().join('_');

  useEffect(() => {
    if (!user) return;
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);
    if (withId) {
      const room = makeRoom(user._id, withId);
      setActiveRoom(room);
      socket.emit('join_room', room);
    }
    return () => { socket.disconnect(); };
  }, [user, withId]);

  useEffect(() => {
    if (!activeRoom) return;
    api.get(`/messages/${activeRoom}`).then(res => setMessages(res.data));
    socket?.emit('join_room', activeRoom);
    socket?.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket?.on('typing', () => setTyping(true));
    socket?.on('stop_typing', () => setTyping(false));
    return () => {
      socket?.off('receive_message');
      socket?.off('typing');
    };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !user) return;
    socket.emit('send_message', { room: activeRoom, senderId: user._id, content: newMsg });
    setNewMsg('');
    socket.emit('stop_typing', { room: activeRoom, userId: user._id });
  };

  const handleTyping = (v: string) => {
    setNewMsg(v);
    socket?.emit('typing', { room: activeRoom, userId: user?._id });
  };

  return (
    <div className={styles.page}>
      {/* Rooms sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Messages</h2>
        </div>
        {rooms.length === 0 && (
          <div className={styles.emptyRooms}>
            <p>No conversations yet.</p>
            <p>Start chatting from a gig page!</p>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={styles.chat}>
        {!activeRoom ? (
          <div className={styles.noChatSelected}>
            <span className={styles.chatIcon}>💬</span>
            <h3>Select a conversation</h3>
            <p>Choose from your conversations or start a new one from a gig or freelancer page.</p>
          </div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <span>Chat</span>
              <span className="badge badge-open" style={{ fontSize: '0.7rem' }}>● Live</span>
            </div>
            <div className={styles.messages}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${styles.msgRow} ${
                    msg.sender?._id === user?._id || msg.sender === user?._id
                      ? styles.mine
                      : styles.theirs
                  }`}
                >
                  <div className={styles.bubble}>
                    <p>{msg.content}</p>
                    <span className={styles.time}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {typing && (
                <div className={styles.typingIndicator}>
                  <span /><span /><span />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className={styles.inputRow}>
              <input
                className={`form-input ${styles.msgInput}`}
                placeholder="Type a message..."
                value={newMsg}
                onChange={e => handleTyping(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!newMsg.trim()}>
                Send →
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
