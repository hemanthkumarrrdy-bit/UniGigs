'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './gigDetail.module.css';

export default function GigDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/gigs/${id}`).then(res => {
      setGig(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true); setError('');
    try {
      await api.post('/applications', { gigId: id, coverLetter, proposedBudget: Number(proposedBudget) });
      setApplied(true); setSuccess('Application submitted!'); setShowApplyForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to apply');
    } finally { setApplying(false); }
  };

  if (loading) return <div className="container"><div className="spinner" /></div>;
  if (!gig) return <div className="container"><div className="empty-state"><h3>Gig not found</h3></div></div>;

  const daysLeft = Math.max(0, Math.ceil((new Date(gig.deadline).getTime() - Date.now()) / 86400000));
  const isOwner = user?._id === gig.client?._id;
  const canApply = user?.role === 'student' && gig.status === 'open' && !applied && !isOwner;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          {/* Main Content */}
          <div className={styles.main}>
            <div className={`card ${styles.gigCard}`}>
              <div className={styles.gigTop}>
                <span className={`badge badge-${gig.status}`}>{gig.status}</span>
                <span className={styles.gigCat}>{gig.category}</span>
              </div>
              <h1 className={styles.gigTitle}>{gig.title}</h1>
              <div className={styles.gigMeta}>
                <span>💰 Budget: <strong>${gig.budget}</strong></span>
                <span>⏰ Deadline: <strong>{new Date(gig.deadline).toLocaleDateString()}</strong></span>
                <span>📍 {gig.isRemote ? 'Remote' : gig.location}</span>
                <span>👥 {gig.applicationsCount} applicants</span>
              </div>
              <div className={styles.description}>
                <h2>Description</h2>
                <p>{gig.description}</p>
              </div>
              {gig.requirements && (
                <div className={styles.requirements}>
                  <h2>Requirements</h2>
                  <p>{gig.requirements}</p>
                </div>
              )}
              {gig.tags?.length > 0 && (
                <div className={styles.tags}>
                  {gig.tags.map((t: string) => <span key={t} className="skill-tag">{t}</span>)}
                </div>
              )}
            </div>

            {/* Apply Form */}
            {canApply && (
              <div className={`card ${styles.applySection}`}>
                <h2>Apply for this Gig</h2>
                {success && <div className="alert alert-success">✅ {success}</div>}
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                {!showApplyForm ? (
                  <button className="btn btn-primary" onClick={() => setShowApplyForm(true)}>Apply Now →</button>
                ) : (
                  <form onSubmit={handleApply}>
                    <div className="form-group">
                      <label className="form-label">Cover Letter</label>
                      <textarea className="form-input" rows={4}
                        placeholder="Why are you a great fit for this gig?"
                        value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                        style={{ resize: 'vertical' }} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your Proposed Budget ($)</label>
                      <input className="form-input" type="number" placeholder={String(gig.budget)}
                        value={proposedBudget} onChange={e => setProposedBudget(e.target.value)} required />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="submit" className="btn btn-primary" disabled={applying}>
                        {applying ? 'Submitting...' : 'Submit Application'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowApplyForm(false)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            )}
            {applied && <div className="alert alert-success">✅ You've applied for this gig!</div>}
            {isOwner && (
              <Link href={`/gigs/${id}/applications`} className="btn btn-primary">View Applications ({gig.applicationsCount})</Link>
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className="card">
              <h3 className={styles.sidebarTitle}>Posted By</h3>
              <div className={styles.clientProfile}>
                <div className="avatar" style={{width:48,height:48,fontSize:'1.1rem'}}>{gig.client?.name?.[0]}</div>
                <div>
                  <div className={styles.clientName}>{gig.client?.name}</div>
                  <div className={styles.clientRating}>
                    <span className="stars">{'★'.repeat(Math.round(gig.client?.rating || 0))}</span>
                    <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}> {gig.client?.rating?.toFixed(1) || '—'}</span>
                  </div>
                </div>
              </div>
              <p className={styles.clientBio}>{gig.client?.bio || 'No bio available'}</p>
              {user && !isOwner && (
                <Link href={`/messages?with=${gig.client?._id}`} className="btn btn-secondary btn-sm" style={{width:'100%',justifyContent:'center',marginTop:12}}>
                  💬 Message Client
                </Link>
              )}
            </div>

            <div className={`card ${styles.infoCard}`}>
              <div className={styles.infoRow}>
                <span>Days Remaining</span><strong style={{color: daysLeft < 3 ? 'var(--danger)' : 'var(--success)'}}>{daysLeft} days</strong>
              </div>
              <div className={styles.infoRow}>
                <span>Budget</span><strong>${gig.budget}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>Status</span><span className={`badge badge-${gig.status}`}>{gig.status}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Applicants</span><strong>{gig.applicationsCount}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
