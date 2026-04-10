'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import styles from './freelancers.module.css';

const SKILLS = ['All', 'React', 'Figma', 'Python', 'Content Writing', 'Marketing', 'Video Editing', 'UI Design', 'Node.js'];

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [page, setPage] = useState(1);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (skill && skill !== 'All') params.set('skill', skill);
      params.set('page', String(page));
      const res = await api.get(`/users?${params}`);
      setFreelancers(res.data.users);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search, skill, page]);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Browse Freelancers</h1>
            <p className={styles.sub}>Find talented students ready to work on your project</p>
          </div>
          <input className={`form-input ${styles.search}`} placeholder="🔍 Search by name..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.skills}>
          {SKILLS.map(s => (
            <button key={s}
              className={`${styles.skillBtn} ${(skill === s || (s === 'All' && !skill)) ? styles.active : ''}`}
              onClick={() => setSkill(s === 'All' ? '' : s)}>
              {s}
            </button>
          ))}
        </div>
        <p className={styles.count}>{total} freelancers available</p>
        {loading ? <div className="spinner" /> : freelancers.length === 0 ? (
          <div className="empty-state"><h3>No freelancers found</h3></div>
        ) : (
          <div className="grid-auto">
            {freelancers.map(f => <FreelancerCard key={f._id} user={f} />)}
          </div>
        )}
        {total > 12 && (
          <div className={styles.pagination}>
            <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
            <span>Page {page}</span>
            <button className="btn btn-secondary btn-sm" disabled={page>=Math.ceil(total/12)} onClick={() => setPage(p=>p+1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function FreelancerCard({ user }: { user: any }) {
  return (
    <Link href={`/freelancers/${user._id}`} className={`card ${styles.card}`}>
      <div className={styles.cardTop}>
        <div className="avatar" style={{width:54,height:54,fontSize:'1.2rem'}}>
          {user.avatar ? <img src={user.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%'}} /> : user.name[0]}
        </div>
        <div>
          <div className={styles.name}>{user.name}</div>
          <div className={styles.location}>{user.location || 'Remote'}</div>
        </div>
      </div>
      <p className={styles.bio}>{user.bio?.slice(0,90) || 'No bio yet'}...</p>
      <div className={styles.skills}>{user.skills?.slice(0,4).map((s:string) => <span key={s} className="skill-tag">{s}</span>)}</div>
      <div className={styles.cardFooter}>
        <div className={styles.rating}>
          <span className="stars">{'★'.repeat(Math.round(user.rating || 0))}</span>
          <span>{user.rating?.toFixed(1) || '0.0'} ({user.reviewCount || 0})</span>
        </div>
        <span className="btn btn-primary btn-sm">View Profile</span>
      </div>
    </Link>
  );
}
