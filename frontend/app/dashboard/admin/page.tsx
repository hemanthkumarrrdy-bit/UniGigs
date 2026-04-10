'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from '../dashboard.module.css';
import AuthGuard from '@/components/AuthGuard';

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminDashboardInner />
    </AuthGuard>
  );
}

function AdminDashboardInner() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'users' | 'gigs'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/gigs'),
    ]).then(([s, u, g]) => {
      setStats(s.data); setUsers(u.data.users); setGigs(g.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <div className="container" style={{paddingTop:80}}><div className="alert alert-error">Admin access required.</div></div>;
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.welcome}>
            <span style={{fontSize:'2rem'}}>🛡️</span>
            <div>
              <h1 className={styles.greeting}>Admin Dashboard</h1>
              <p className={styles.subGreeting}>Manage users, gigs, and platform health</p>
            </div>
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            <div className={`grid-4 ${styles.stats}`}>
              {[
                { label: 'Total Users', value: stats?.totalUsers, icon: '👥' },
                { label: 'Total Gigs', value: stats?.totalGigs, icon: '📋' },
                { label: 'Revenue', value: `$${stats?.revenue?.toFixed(2) || '0.00'}`, icon: '💰' },
                { label: 'Open Gigs', value: stats?.openGigs, icon: '🟢' },
              ].map(s => (
                <div key={s.label} className={`card ${styles.statCard}`}>
                  <span className={styles.statIcon}>{s.icon}</span>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:8,marginBottom:24}}>
              {(['overview','users','gigs'] as const).map(t => (
                <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setTab(t)} style={{textTransform:'capitalize'}}>
                  {t}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="card">
                <h2 style={{marginBottom:16,fontWeight:700}}>Recent Users</h2>
                <div className={styles.gigTable}>
                  <div className={styles.gigTableHeader}>
                    <span>Name</span><span>Email</span><span>Role</span><span>Joined</span>
                  </div>
                  {stats?.recentUsers?.map((u: any) => (
                    <div key={u._id} className={styles.gigRow} style={{gridTemplateColumns:'2fr 3fr 1fr 1.5fr 0fr'}}>
                      <span className={styles.gigTitle}>{u.name}</span>
                      <span className={styles.gigCat}>{u.email}</span>
                      <span><span className={`badge badge-${u.role}`}>{u.role}</span></span>
                      <span className={styles.gigCat}>{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="card">
                <h2 style={{marginBottom:16,fontWeight:700}}>All Users ({users.length})</h2>
                <div className={styles.gigTable}>
                  <div className={styles.gigTableHeader}>
                    <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Action</span>
                  </div>
                  {users.map(u => (
                    <div key={u._id} className={styles.gigRow}>
                      <span className={styles.gigTitle}>{u.name}</span>
                      <span className={styles.gigCat}>{u.email}</span>
                      <span><span className={`badge badge-${u.role}`}>{u.role}</span></span>
                      <span><span className={`badge ${u.isActive ? 'badge-open' : 'badge-cancelled'}`}>{u.isActive ? 'Active' : 'Suspended'}</span></span>
                      <span>
                        <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                          onClick={async () => {
                            const action = u.isActive ? 'suspend' : 'activate';
                            await api.put(`/admin/users/${u._id}/${action}`);
                            setUsers(prev => prev.map(x => x._id === u._id ? {...x, isActive: !u.isActive} : x));
                          }}>
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'gigs' && (
              <div className="card">
                <h2 style={{marginBottom:16,fontWeight:700}}>All Gigs ({gigs.length})</h2>
                <div className={styles.gigTable}>
                  <div className={styles.gigTableHeader}>
                    <span>Title</span><span>Client</span><span>Budget</span><span>Status</span><span>Action</span>
                  </div>
                  {gigs.map(g => (
                    <div key={g._id} className={styles.gigRow}>
                      <span className={styles.gigTitle}>{g.title}</span>
                      <span className={styles.gigCat}>{g.client?.name}</span>
                      <span className={styles.gigBudget}>${g.budget}</span>
                      <span><span className={`badge badge-${g.status}`}>{g.status}</span></span>
                      <span>
                        <button className="btn btn-danger btn-sm"
                          onClick={async () => {
                            await api.delete(`/admin/gigs/${g._id}`);
                            setGigs(prev => prev.filter(x => x._id !== g._id));
                          }}>
                          Delete
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
