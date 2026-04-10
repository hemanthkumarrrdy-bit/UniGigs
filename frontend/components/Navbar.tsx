'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';
import api from '@/lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then((res) => {
        setNotifCount(res.data.filter((n: any) => !n.read).length);
      }).catch(() => {});
    }
  }, [user, pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const dashboardPath = user?.role === 'admin' ? '/dashboard/admin'
    : user?.role === 'client' ? '/dashboard/client' : '/dashboard/student';

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          UniGigs.
        </Link>

        <div className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          <Link href="/" className={pathname === '/' ? styles.active : ''}>Home</Link>
          <Link href="/gigs" className={pathname === '/gigs' ? styles.active : ''}>Gigs</Link>
          <Link href="/freelancers" className={pathname === '/freelancers' ? styles.active : ''}>Freelancers</Link>
          {user && <Link href="/messages" className={pathname === '/messages' ? styles.active : ''}>Messages</Link>}
        </div>

        <div className={styles.actions}>
          {user ? (
            <div className={styles.userMenu}>
              {notifCount > 0 && (
                <Link href="/notifications" className={styles.notifBadge}>
                  🔔 <span>{notifCount}</span>
                </Link>
              )}
              <Link href={dashboardPath} className={styles.avatarBtn}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarFallback}>{user.name[0].toUpperCase()}</div>
                )}
              </Link>
              <button 
                onClick={handleLogout} 
                style={{background:'none', border:'none', color:'#4A4A4A', fontWeight:600, cursor:'pointer', fontSize:'0.95rem'}}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link href="/login">Login</Link>
              <Link href="/register">Sign Up</Link>
            </div>
          )}
          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
