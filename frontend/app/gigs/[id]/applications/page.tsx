'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

export default function GigApplicationsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/applications/gig/${id}`).then(res => {
      setApplications(res.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const updateStatus = async (appId: string, status: string) => {
    setUpdating(appId);
    try {
      await api.put(`/applications/${appId}/status`, { status });
      setApplications(prev => prev.map(a => a._id === appId ? {...a, status} : a));
    } finally { setUpdating(null); }
  };

  return (
    <div style={{padding:'32px 0',minHeight:'calc(100vh - 68px)'}}>
      <div className="container">
        <div className="page-header">
          <Link href={`/gigs/${id}`} style={{color:'var(--text-muted)',fontSize:'0.88rem',marginBottom:8,display:'block'}}>← Back to Gig</Link>
          <h1 className="page-title">Applications ({applications.length})</h1>
        </div>
        {loading ? <div className="spinner" /> : applications.length === 0 ? (
          <div className="empty-state"><h3>No applications yet</h3><p>Share your gig to get more applicants!</p></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {applications.map(app => (
              <div key={app._id} className="card" style={{display:'flex',gap:20,alignItems:'flex-start'}}>
                <Link href={`/freelancers/${app.applicant?._id}`}>
                  <div className="avatar" style={{width:48,height:48,fontSize:'1.1rem'}}>
                    {app.applicant?.avatar ? <img src={app.applicant.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%'}} /> : app.applicant?.name[0]}
                  </div>
                </Link>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div>
                      <Link href={`/freelancers/${app.applicant?._id}`} style={{fontWeight:700}}>{app.applicant?.name}</Link>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
                        {app.applicant?.skills?.slice(0,3).map((s:string) => <span key={s} className="skill-tag">{s}</span>)}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                      <span style={{fontWeight:700,color:'var(--success)'}}>
                        {app.proposedBudget ? `$${app.proposedBudget}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:12}}>
                    <span className="stars" style={{fontSize:'0.85rem'}}>{'★'.repeat(Math.round(app.applicant?.rating || 0))}</span>
                    <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{app.applicant?.rating?.toFixed(1)} ({app.applicant?.reviewCount} reviews)</span>
                  </div>
                  {app.coverLetter && <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:1.6,marginBottom:12}}>{app.coverLetter}</p>}
                  {app.status === 'pending' && (
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn btn-primary btn-sm"
                        disabled={updating === app._id}
                        onClick={() => updateStatus(app._id, 'accepted')}>
                        ✅ Accept
                      </button>
                      <button className="btn btn-danger btn-sm"
                        disabled={updating === app._id}
                        onClick={() => updateStatus(app._id, 'rejected')}>
                        ✕ Reject
                      </button>
                      <Link href={`/messages?with=${app.applicant?._id}`} className="btn btn-secondary btn-sm">
                        💬 Message
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
