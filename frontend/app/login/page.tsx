'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      // Role-based redirect
      if (loggedInUser.role === 'admin') router.push('/dashboard/admin');
      else if (loggedInUser.role === 'client') router.push('/dashboard/client');
      else router.push('/dashboard/student');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.blob} />
      <div className={styles.card}>
        <div className={styles.logo}>⚡ UniGigs</div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <input
              id="login-email"
              className="form-input"
              type="text"
              placeholder="you@example.com or username"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>
        <p className={styles.switch}>
          Don't have an account? <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
