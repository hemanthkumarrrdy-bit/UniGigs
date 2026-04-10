'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Which roles are allowed. If empty/undefined — any authenticated user is fine */
  allowedRoles?: Array<'student' | 'client' | 'admin'>;
  /** Where to go if auth check fails (default: /login) */
  redirectTo?: string;
}

/**
 * Wrap any page that requires authentication.
 * Shows a full-screen spinner while auth state is being resolved,
 * then redirects to /login if not authenticated, or shows a 403 if wrong role.
 */
export default function AuthGuard({ children, allowedRoles, redirectTo = '/login' }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // still resolving — wait
    if (!user) {
      router.replace(`${redirectTo}?next=${window.location.pathname}`);
      return;
    }
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Wrong role — send to their own dashboard
      const dash = user.role === 'admin' ? '/dashboard/admin'
        : user.role === 'client' ? '/dashboard/client' : '/dashboard/student';
      router.replace(dash);
    }
  }, [user, loading, router, allowedRoles, redirectTo]);

  // Show spinner while resolving
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '0.9rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — render nothing (redirect is firing)
  if (!user) return null;

  // Wrong role — render nothing (redirect is firing)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
