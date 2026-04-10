'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';
import styles from '../freelancers.module.css';

export default function FreelancerProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<{ user: any; reviews: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${id}`).then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container"><div className="spinner" /></div>;
  if (!data?.user) return <div className="container"><div className="empty-state"><h3>User not found</h3></div></div>;

  const { user: profile, reviews } = data;

  return (
    <div className={styles.page}>
      <div className="container">
        <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:28,alignItems:'start'}}>
          {/* Left - Profile Card */}
          <div className="card" style={{textAlign:'center'}}>
            <div className="avatar" style={{width:80,height:80,fontSize:'2rem',margin:'0 auto 16px'}}>
              {profile.avatar ? <img src={profile.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%'}} /> : profile.name[0]}
            </div>
            <h1 style={{fontWeight:800,fontSize:'1.3rem',marginBottom:4}}>{profile.name}</h1>
            <p style={{color:'var(--text-muted)',fontSize:'0.85rem',marginBottom:12}}>{profile.location || 'Remote'}</p>
            <div style={{display:'flex',justifyContent:'center',gap:6,alignItems:'center',marginBottom:16}}>
              <span className="stars">{'★'.repeat(Math.round(profile.rating || 0))}</span>
              <span style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>{profile.rating?.toFixed(1) || '0.0'} ({profile.reviewCount || 0} reviews)</span>
            </div>
            <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:1.6,marginBottom:16}}>{profile.bio || 'No bio available'}</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',marginBottom:20}}>
              {profile.skills?.map((s: string) => <span key={s} className="skill-tag">{s}</span>)}
            </div>
            {user && user._id !== profile._id && (
              <Link href={`/messages?with=${profile._id}`} className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>
                💬 Message
              </Link>
            )}
          </div>

          {/* Right - Reviews */}
          <div>
            <h2 style={{fontWeight:700,marginBottom:20}}>Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <div className="empty-state"><h3>No reviews yet</h3></div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {reviews.map(r => (
                  <div key={r._id} className="card" style={{padding:20}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                      <div className="avatar" style={{width:36,height:36,fontSize:'0.9rem'}}>{r.reviewer?.name[0]}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:'0.9rem'}}>{r.reviewer?.name}</div>
                        <div className="stars" style={{fontSize:'0.85rem'}}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                        </div>
                      </div>
                    </div>
                    <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:1.6}}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
