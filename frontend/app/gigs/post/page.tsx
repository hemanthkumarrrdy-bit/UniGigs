'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from '../../auth.module.css';

const CATEGORIES = ['Design', 'Tech', 'Writing', 'Marketing', 'Local Help', 'Other'];

export default function PostGigPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: 'Tech', budget: '',
    deadline: '', tags: '', requirements: '', isRemote: true, location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.role !== 'client') {
    return (
      <div className="container" style={{paddingTop:80,textAlign:'center'}}>
        <h2>Only clients can post gigs.</h2>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = {
        ...form,
        budget: Number(form.budget),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const res = await api.post('/gigs', data);
      router.push(`/gigs/${res.data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post gig');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page} style={{alignItems:'flex-start',paddingTop:60}}>
      <div style={{width:'100%',maxWidth:620,margin:'0 auto',padding:'0 20px'}}>
        <div className={styles.card} style={{maxWidth:'100%'}}>
          <div className={styles.logo}>⚡ UniGigs</div>
          <h1 className={styles.title}>Post a New Gig</h1>
          <p className={styles.subtitle}>Find the right student for your project</p>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Gig Title</label>
              <input className="form-input" placeholder="e.g. Design a landing page for my startup"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={4}
                placeholder="Describe what you need in detail..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                style={{resize:'vertical'}} required />
            </div>
            <div className="form-group">
              <label className="form-label">Requirements (optional)</label>
              <textarea className="form-input" rows={3}
                placeholder="Any specific skills, tools, or qualifications required?"
                value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})}
                style={{resize:'vertical'}} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="form-group">
                <label className="form-label">Budget ($)</label>
                <input className="form-input" type="number" placeholder="e.g. 150"
                  value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="date" min={new Date().toISOString().split('T')[0]}
                  value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" placeholder="React, UI Design, Figma..."
                value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
            </div>
            <div className="form-group">
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <input type="checkbox" checked={form.isRemote} onChange={e => setForm({...form, isRemote: e.target.checked})} style={{width:16,height:16}} />
                <span className="form-label" style={{margin:0}}>Remote Work</span>
              </label>
            </div>
            {!form.isRemote && (
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="City, State"
                  value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
            )}
            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Posting...' : '📋 Post Gig'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
