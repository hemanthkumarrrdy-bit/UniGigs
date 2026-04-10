'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from '../dashboard.module.css';
import AuthGuard from '@/components/AuthGuard';

export default function StudentDashboard() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <StudentDashboardInner />
    </AuthGuard>
  );
}

function StudentDashboardInner() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/my').then(res => {
      setApplications(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = {
    applied: applications.length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    pending: applications.filter(a => a.status === 'pending').length,
    earnings: user?.earnings || 0,
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.welcome}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%'}} /> : user?.name[0]}
            </div>
            <div>
              <h1 className={styles.greeting}>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className={styles.subGreeting}>Here's your freelance overview</p>
            </div>
          </div>
          <Link href="/gigs" className="btn btn-primary">Browse Gigs</Link>
        </div>

        {/* Stats */}
        <div className={`grid-4 ${styles.stats}`}>
          {[
            { label: 'Applied', value: stats.applied, icon: '📋', color: 'var(--info)' },
            { label: 'Accepted', value: stats.accepted, icon: '✅', color: 'var(--success)' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: 'var(--accent)' },
            { label: 'Earnings', value: `$${stats.earnings}`, icon: '💰', color: 'var(--brand-light)' },
          ].map(s => (
            <div key={s.label} className={`card ${styles.statCard}`}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Profile & Skills */}
        <div className={styles.grid}>
          <div className={`card ${styles.profileCard}`}>
            <h2 className={styles.sectionTitle}>My Profile</h2>
            <p className={styles.bio}>{user?.bio || 'No bio yet. Update your profile!'}</p>
            <div className={styles.skills}>
              {user?.skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
              {(!user?.skills || user.skills.length === 0) && <span style={{color:'var(--text-muted)',fontSize:'0.88rem'}}>No skills added</span>}
            </div>
            <div className={styles.rating}>
              <span className="stars">{'★'.repeat(Math.round(user?.rating || 0))}{'☆'.repeat(5 - Math.round(user?.rating || 0))}</span>
              <span style={{color:'var(--text-secondary)',fontSize:'0.88rem'}}>{user?.rating?.toFixed(1) || '0.0'} ({user?.reviewCount || 0} reviews)</span>
            </div>
            <Link href="/profile/edit" className="btn btn-secondary btn-sm" style={{marginTop:16}}>Edit Profile</Link>
          </div>

          {/* Recent Applications */}
          <div className={`card ${styles.applicationsCard}`}>
            <h2 className={styles.sectionTitle}>Recent Applications</h2>
            {loading ? <div className="spinner" /> : applications.length === 0 ? (
              <div className="empty-state">
                <p>No applications yet</p>
                <Link href="/gigs" className="btn btn-primary btn-sm" style={{marginTop:12}}>Browse Gigs</Link>
              </div>
            ) : (
              <div className={styles.appList}>
                {applications.slice(0, 5).map(app => (
                  <div key={app._id} className={styles.appItem}>
                    <div className={styles.appInfo}>
                      <span className={styles.appTitle}>{app.gig?.title || 'Deleted Gig'}</span>
                      <span className={styles.appClient}>{app.gig?.client?.name}</span>
                    </div>
                    <span className={`badge badge-${app.status}`}>{app.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          {[
            { icon: '🔍', label: 'Browse Gigs', href: '/gigs' },
            { icon: '💬', label: 'Messages', href: '/messages' },
            { icon: '💳', label: 'Payments', href: '/payments' },
            { icon: '👤', label: 'Edit Profile', href: '/profile/edit' },
          ].map(a => (
            <Link key={a.label} href={a.href} className={`card ${styles.quickAction}`}>
              <span className={styles.quickIcon}>{a.icon}</span>
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
