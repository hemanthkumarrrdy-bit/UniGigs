'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

// Inner component that uses useSearchParams — must be inside Suspense
function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: params.get('role') || 'student',
    bio: '', skills: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setError(''); setLoading(true);
    try {
      const data = {
        ...form,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      const registeredUser = await register(data);
      // Role-based redirect
      if (registeredUser.role === 'admin') router.push('/dashboard/admin');
      else if (registeredUser.role === 'client') router.push('/dashboard/client');
      else router.push('/dashboard/student');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.blob} />
      <div className={styles.card}>
        <div className={styles.logo}>⚡ UniGigs</div>
        <h1 className={styles.title}>{step === 1 ? 'Create Account' : 'Complete Profile'}</h1>
        <p className={styles.subtitle}>
          {step === 1 ? 'Join the student freelance revolution' : 'Tell us more about you'}
        </p>

        {/* Step indicator */}
        <div className={styles.steps}>
          <div className={`${styles.stepDot} ${step >= 1 ? styles.active : ''}`}>1</div>
          <div className={styles.stepLine} />
          <div className={`${styles.stepDot} ${step >= 2 ? styles.active : ''}`}>2</div>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  id="reg-name"
                  className="form-input"
                  placeholder="John Doe"
                  autoComplete="name"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email or Username</label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="text"
                  placeholder="you@example.com or username"
                  autoComplete="username"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  id="reg-password"
                  className="form-input"
                  type="password"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">I am a...</label>
                <div className={styles.roleSelect}>
                  <button
                    type="button"
                    className={`${styles.roleBtn} ${form.role === 'student' ? styles.roleActive : ''}`}
                    onClick={() => setForm({...form, role: 'student'})}
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    className={`${styles.roleBtn} ${form.role === 'client' ? styles.roleActive : ''}`}
                    onClick={() => setForm({...form, role: 'client'})}
                  >
                    💼 Business
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Bio <span style={{color:'var(--text-muted)',fontWeight:400}}>(optional)</span></label>
                <textarea
                  id="reg-bio"
                  className="form-input"
                  rows={3}
                  placeholder={
                    form.role === 'student'
                      ? 'Tell clients about yourself and your experience...'
                      : 'Describe your business...'
                  }
                  value={form.bio}
                  onChange={e => setForm({...form, bio: e.target.value})}
                  style={{ resize: 'vertical' }}
                />
              </div>
              {form.role === 'student' && (
                <div className="form-group">
                  <label className="form-label">Skills <span style={{color:'var(--text-muted)',fontWeight:400}}>(comma separated)</span></label>
                  <input
                    id="reg-skills"
                    className="form-input"
                    placeholder="React, Photoshop, Content Writing..."
                    value={form.skills}
                    onChange={e => setForm({...form, skills: e.target.value})}
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? '⏳ Creating account...' : step === 1 ? 'Continue →' : '🚀 Create Account'}
          </button>
        </form>

        {step === 2 && (
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${styles.backBtn}`}
            onClick={() => setStep(1)}
          >
            ← Back
          </button>
        )}

        <p className={styles.switch}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// Outer page component — wraps in Suspense to satisfy Next.js App Router requirement for useSearchParams
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
