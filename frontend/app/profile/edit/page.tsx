'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from '../auth.module.css';

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', bio: '', skills: '', location: '', avatar: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm({
      name: user.name || '',
      bio: user.bio || '',
      skills: user.skills?.join(', ') || '',
      location: '',
      avatar: user.avatar || '',
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = {
        ...form,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      const res = await api.put('/users/profile', data);
      updateUser(res.data);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page} style={{alignItems:'flex-start',paddingTop:60}}>
      <div style={{width:'100%',maxWidth:560,margin:'0 auto',padding:'0 20px'}}>
        <div className={styles.card} style={{maxWidth:'100%'}}>
          <h1 className={styles.title}>Edit Profile</h1>
          <p className={styles.subtitle}>Update your information and skills</p>
          {success && <div className="alert alert-success">✅ {success}</div>}
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Avatar URL (optional)</label>
              <input className="form-input" placeholder="https://your-photo.jpg"
                value={form.avatar} onChange={e => setForm({...form, avatar: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="Mumbai, India"
                value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={4}
                placeholder="Tell people about yourself..."
                value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                style={{resize:'vertical'}} />
            </div>
            {user?.role === 'student' && (
              <div className="form-group">
                <label className="form-label">Skills (comma separated)</label>
                <input className="form-input" placeholder="React, Figma, Python..."
                  value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} />
              </div>
            )}
            <div style={{display:'flex',gap:12}}>
              <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading} style={{flex:1}}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
