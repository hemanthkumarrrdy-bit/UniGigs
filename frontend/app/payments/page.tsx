'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './payments.module.css';
import AuthGuard from '@/components/AuthGuard';

export default function PaymentsPage() {
  return (
    <AuthGuard>
      <PaymentsInner />
    </AuthGuard>
  );
}

function PaymentsInner() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/history').then(res => {
      setPayments(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalEarned = payments.filter(p => p.status === 'released' && p.freelancer?._id === user?._id)
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'released' && p.client?._id === user?._id)
    .reduce((sum, p) => sum + p.amount, 0);
  const held = payments.filter(p => p.status === 'held').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">💳 Payments</h1>
          <p className="page-subtitle">Your transaction history and earnings</p>
        </div>

        <div className={`grid-3 ${styles.stats}`}>
          {user?.role === 'student' ? (
            <>
              <div className={`card ${styles.statCard}`}><span>💰</span><strong>${totalEarned.toFixed(2)}</strong><p>Total Earned</p></div>
              <div className={`card ${styles.statCard}`}><span>⏳</span><strong>${held.toFixed(2)}</strong><p>In Escrow</p></div>
              <div className={`card ${styles.statCard}`}><span>📋</span><strong>{payments.length}</strong><p>Transactions</p></div>
            </>
          ) : (
            <>
              <div className={`card ${styles.statCard}`}><span>💸</span><strong>${totalPaid.toFixed(2)}</strong><p>Total Spent</p></div>
              <div className={`card ${styles.statCard}`}><span>⏳</span><strong>${held.toFixed(2)}</strong><p>In Escrow</p></div>
              <div className={`card ${styles.statCard}`}><span>📋</span><strong>{payments.length}</strong><p>Transactions</p></div>
            </>
          )}
        </div>

        <div className="card">
          <h2 style={{marginBottom:20,fontWeight:700}}>Transaction History</h2>
          {loading ? <div className="spinner" /> : payments.length === 0 ? (
            <div className="empty-state"><h3>No transactions yet</h3></div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Gig</span><span>Amount</span><span>Status</span><span>Date</span><span>Action</span>
              </div>
              {payments.map(p => (
                <div key={p._id} className={styles.row}>
                  <span className={styles.gigName}>{p.gig?.title || 'Deleted Gig'}</span>
                  <span className={styles.amount}>${p.amount}</span>
                  <span>
                    <span className={`badge ${p.status === 'released' ? 'badge-completed' : p.status === 'held' ? 'badge-inprogress' : 'badge-cancelled'}`}>
                      {p.status}
                    </span>
                  </span>
                  <span className={styles.date}>{new Date(p.createdAt).toLocaleDateString()}</span>
                  <span>
                    {p.status === 'held' && user?.role === 'client' && (
                      <button className="btn btn-primary btn-sm" onClick={async () => {
                        await api.post(`/payments/${p._id}/release`);
                        setPayments(prev => prev.map(pay => pay._id === p._id ? {...pay, status: 'released'} : pay));
                      }}>Release</button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
