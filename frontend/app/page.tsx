'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        
        {/* Hero Main Content */}
        <div className={styles.mainContent}>
          
          {/* Left Side Hierarchy */}
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>
              B <span className={styles.boxLetter}></span> k Your<br />
              <span>Dream</span> Gig<br />
              Now
            </h1>
            
            <div className={styles.ctaRow}>
              <Link href={user ? "/gigs/post" : "/register"} className={styles.bookBtn}>
                Hire Now
              </Link>
              <Link href="/gigs" className={styles.arrowBtn}>↗</Link>
            </div>

            <div className={styles.creators}>
              <div className={styles.avatarGroup}>
                <img src="https://i.pravatar.cc/150?u=1" alt="avatar" />
                <img src="https://i.pravatar.cc/150?u=2" alt="avatar" />
                <img src="https://i.pravatar.cc/150?u=3" alt="avatar" />
              </div>
              <div className={styles.creatorsText}>
                Meet Our<br />Freelancers
              </div>
            </div>
          </div>

          {/* Right Side Image Block */}
          <div className={styles.heroRight}>
            <div className={styles.heroImageWrapper}>
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop" alt="Student Freelancer" />
              <div className={styles.spinningBadge}>
                ★
              </div>
            </div>
          </div>
          
        </div>

        {/* Bottom Section (Filters & Cards) */}
        <div className={styles.bottomSection}>
          
          {/* Filters List */}
          <div className={styles.filters}>
            <div className={styles.filterItem}>Design</div>
            <div className={`${styles.filterItem} ${styles.active}`}>Tech</div>
            <div className={styles.filterItem}>Writing</div>
          </div>

          {/* Cards Row */}
          <div className={styles.cards}>
            <Link href="/gigs?category=Tech" className={styles.destCard}>
              <div className={styles.destTop}>
                <div>
                  <div className={styles.destTitle}>Fullstack Dev</div>
                  <div className={styles.destSub}>React & Node.js</div>
                </div>
                <div className={styles.destArrow}>↗</div>
              </div>
              <div className={styles.destImage}>
                <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&auto=format&fit=crop" alt="Code" />
              </div>
            </Link>
            
            <Link href="/gigs?category=Design" className={styles.destCard}>
              <div className={styles.destTop}>
                <div>
                  <div className={styles.destTitle}>UI/UX Design</div>
                  <div className={styles.destSub}>Figma Expert</div>
                </div>
                <div className={styles.destArrow}>↗</div>
              </div>
              <div className={styles.destImage}>
                <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=400&auto=format&fit=crop" alt="Design" />
              </div>
            </Link>

            <Link href="/gigs?category=Marketing" className={styles.destCard}>
              <div className={styles.destTop}>
                <div>
                  <div className={styles.destTitle}>Marketing</div>
                  <div className={styles.destSub}>Social Media</div>
                </div>
                <div className={styles.destArrow}>↗</div>
              </div>
              <div className={styles.destImage}>
                <img src="https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?q=80&w=400&auto=format&fit=crop" alt="Marketing" />
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
