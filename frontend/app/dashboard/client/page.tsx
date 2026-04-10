'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from '../dashboard.module.css';
import AuthGuard from '@/components/AuthGuard';

export default function ClientDashboard() {
  return (
    <AuthGuard allowedRoles={['client']}>
      <ClientDashboardInner />
    </AuthGuard>
  );
}

function ClientDashboardInner() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gigs/my/posted').then(res => {
      setGigs(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = {
    total: gigs.length,
    open: gigs.filter(g => g.status === 'open').length,
    inprogress: gigs.filter(g => g.status === 'inprogress').length,
    completed: gigs.filter(g => g.status === 'completed').length,
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.welcome}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>
              {user?.name[0]}
            </div>
            <div>
              <h1 className={styles.greeting}>Dashboard, {user?.name?.split(' ')[0]}! 💼</h1>
              <p className={styles.subGreeting}>Manage your gigs and find great talent</p>
            </div>
          </div>
          <Link href="/gigs/post" className="btn btn-primary">+ Post a Gig</Link>
        </div>

        <div className={`grid-4 ${styles.stats}`}>
          {[
            { label: 'Total Gigs', value: stats.total, icon: '📋', color: 'var(--text)' },
            { label: 'Open', value: stats.open, icon: '🟢', color: 'var(--success)' },
            { label: 'In Progress', value: stats.inprogress, icon: '🔄', color: 'var(--accent)' },
            { label: 'Completed', value: stats.completed, icon: '✅', color: 'var(--brand-light)' },
          ].map(s => (
            <div key={s.label} className={`card ${styles.statCard}`}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* My Gigs */}
        <div className={`card ${styles.fullCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>My Posted Gigs</h2>
            <Link href="/gigs/post" className="btn btn-primary btn-sm">+ New Gig</Link>
          </div>
          {loading ? <div className="spinner" /> : gigs.length === 0 ? (
            <div className="empty-state">
              <h3>No gigs yet</h3>
              <p>Post your first gig and find amazing student talent!</p>
              <Link href="/gigs/post" className="btn btn-primary" style={{marginTop:16}}>Post a Gig</Link>
            </div>
          ) : (
            <div className={styles.gigTable}>
              <div className={styles.gigTableHeader}>
                <span>Title</span><span>Category</span><span>Budget</span><span>Status</span><span>Apps</span><span></span>
              </div>
              {gigs.map(gig => (
                <div key={gig._id} className={styles.gigRow}>
                  <span className={styles.gigTitle}>{gig.title}</span>
                  <span className={styles.gigCat}>{gig.category}</span>
                  <span className={styles.gigBudget}>${gig.budget}</span>
                  <span><span className={`badge badge-${gig.status}`}>{gig.status}</span></span>
                  <span className={styles.gigApps}>{gig.applicationsCount}</span>
                  <div className={styles.gigActions}>
                    <Link href={`/gigs/${gig._id}`} className="btn btn-secondary btn-sm">View</Link>
                    <Link href={`/gigs/${gig._id}/applications`} className="btn btn-primary btn-sm">Applications</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.quickActions}>
          {[
            { icon: '🔍', label: 'Browse Freelancers', href: '/freelancers' },
            { icon: '💬', label: 'Messages', href: '/messages' },
            { icon: '💳', label: 'Payments', href: '/payments' },
            { icon: '➕', label: 'Post New Gig', href: '/gigs/post' },
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
