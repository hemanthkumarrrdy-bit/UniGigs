'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(res => {
      setNotifications(res.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const iconForType = (type: string) => ({ application:'📋', message:'💬', payment:'💳', review:'⭐', system:'🔔' }[type] || '🔔');

  return (
    <div style={{padding:'32px 0',minHeight:'calc(100vh - 68px)'}}>
      <div className="container" style={{maxWidth:720}}>
        <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h1 className="page-title">🔔 Notifications</h1>
            <p className="page-subtitle">{notifications.filter(n => !n.read).length} unread</p>
          </div>
          {notifications.some(n => !n.read) && (
            <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all read</button>
          )}
        </div>
        {loading ? <div className="spinner" /> : notifications.length === 0 ? (
          <div className="empty-state"><h3>No notifications</h3><p>You're all caught up!</p></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {notifications.map(n => (
              <Link key={n._id} href={n.link || '#'}
                className="card"
                style={{padding:'14px 20px',display:'flex',alignItems:'flex-start',gap:14,
                  background: n.read ? 'var(--bg-card)' : 'rgba(124,58,237,0.07)',
                  borderColor: n.read ? 'var(--border)' : 'rgba(124,58,237,0.2)'}}
                onClick={() => api.put(`/notifications/${n._id}/read`)}>
                <span style={{fontSize:'1.4rem'}}>{iconForType(n.type)}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight: n.read ? 500 : 700, fontSize:'0.95rem'}}>{n.title}</div>
                  <div style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginTop:2}}>{n.message}</div>
                  <div style={{color:'var(--text-muted)',fontSize:'0.75rem',marginTop:4}}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.read && <span style={{width:8,height:8,borderRadius:'50%',background:'var(--brand)',flexShrink:0,marginTop:4}} />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
