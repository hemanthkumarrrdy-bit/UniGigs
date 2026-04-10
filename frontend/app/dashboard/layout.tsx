'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return <>{children}</>;

  const baseLinks = [
    { label: 'Overview', href: `/dashboard/${user.role}`, icon: '📊' },
    { label: 'Messages', href: '/messages', icon: '💬' },
    { label: 'Payments', href: '/payments', icon: '💳' },
  ];

  const roleLinks = user.role === 'client' 
    ? [
        { label: 'Post Gig', href: '/gigs/post', icon: '➕' }, 
        { label: 'My Gigs', href: '/gigs/my', icon: '📋' }
      ]
    : user.role === 'student'
    ? [
        { label: 'Find Gigs', href: '/gigs', icon: '🔍' },
        { label: 'My Applications', href: '/dashboard/student', icon: '📄' }
      ]
    : [];
    
  const bottomLinks = [
    { label: 'Edit Profile', href: '/profile/edit', icon: '👤' },
  ];

  const links = [...baseLinks, ...roleLinks];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Dashboard</h3>
        </div>
        <nav className={styles.sidebarNav}>
          {links.map(l => (
            <Link key={l.label} href={l.href} className={pathname === l.href || (l.label === 'Overview' && pathname.startsWith('/dashboard/')) ? styles.activeLink : ''}>
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
          <div style={{ flex: 1, minHeight: 40 }} />
          {bottomLinks.map(l => (
             <Link key={l.label} href={l.href} className={pathname === l.href ? styles.activeLink : ''} style={{borderTop: '2px solid #1A1A1A'}}>
               <span>{l.icon}</span> {l.label}
             </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
