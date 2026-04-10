'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import styles from './gigs.module.css';

const CATEGORIES = ['All', 'Design', 'Tech', 'Writing', 'Marketing', 'Local Help', 'Other'];

export default function GigsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [gigs, setGigs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minBudget: '', maxBudget: '',
    search: searchParams.get('search') || '',
    status: 'open',
  });

  const fetchGigs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All') params.set('category', filters.category);
      if (filters.minBudget) params.set('minBudget', filters.minBudget);
      if (filters.maxBudget) params.set('maxBudget', filters.maxBudget);
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      params.set('page', String(page));
      const res = await api.get(`/gigs?${params}`);
      setGigs(res.data.gigs);
      setTotal(res.data.total);
    } catch { setGigs([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchGigs(); }, [filters, page]);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Search bar */}
        <div className={styles.searchBar}>
          <input className={`form-input ${styles.searchInput}`} placeholder="🔍 Search gigs..."
            value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          <select className="form-select" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className={styles.layout}>
          {/* Sidebar filters */}
          <aside className={styles.sidebar}>
            <div className="card">
              <h3 className={styles.filterTitle}>Category</h3>
              <div className={styles.catList}>
                {CATEGORIES.map(cat => (
                  <button key={cat}
                    className={`${styles.catBtn} ${(filters.category === cat || (cat === 'All' && !filters.category)) ? styles.catActive : ''}`}
                    onClick={() => setFilters({...filters, category: cat === 'All' ? '' : cat})}>
                    {cat}
                  </button>
                ))}
              </div>
              <h3 className={styles.filterTitle} style={{marginTop: 20}}>Budget Range</h3>
              <div className={styles.budgetRow}>
                <input className="form-input" placeholder="Min $" value={filters.minBudget}
                  onChange={e => setFilters({...filters, minBudget: e.target.value})} type="number" />
                <input className="form-input" placeholder="Max $" value={filters.maxBudget}
                  onChange={e => setFilters({...filters, maxBudget: e.target.value})} type="number" />
              </div>
              <button className="btn btn-secondary btn-sm" style={{width:'100%',marginTop:8}}
                onClick={() => setFilters({ category:'', minBudget:'', maxBudget:'', search:'', status:'open' })}>
                Clear Filters
              </button>
            </div>
          </aside>

          {/* Gig grid */}
          <div className={styles.main}>
            <div className={styles.resultHeader}>
              <span className={styles.resultCount}>{total} gigs found</span>
            </div>
            {loading ? <div className="spinner" /> : gigs.length === 0 ? (
              <div className="empty-state"><h3>No gigs found</h3><p>Try different filters</p></div>
            ) : (
              <div className="grid-auto">
                {gigs.map(gig => <GigCard key={gig._id} gig={gig} />)}
              </div>
            )}
            {/* Pagination */}
            {total > 12 && (
              <div className={styles.pagination}>
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>Page {page} of {Math.ceil(total / 12)}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GigCard({ gig }: { gig: any }) {
  const daysLeft = Math.max(0, Math.ceil((new Date(gig.deadline).getTime() - Date.now()) / 86400000));
  return (
    <Link href={`/gigs/${gig._id}`} className={`card ${styles.gigCard}`}>
      <div className={styles.gigCardTop}>
        <span className={`badge badge-${gig.status}`}>{gig.status}</span>
        <span className={styles.gigCat}>{gig.category}</span>
      </div>
      <h3 className={styles.gigTitle}>{gig.title}</h3>
      <p className={styles.gigDesc}>{gig.description.slice(0, 100)}...</p>
      <div className={styles.gigTags}>
        {gig.tags?.slice(0,3).map((t: string) => <span key={t} className="skill-tag">{t}</span>)}
      </div>
      <div className={styles.gigFooter}>
        <div className={styles.clientInfo}>
          <div className="avatar" style={{width:28,height:28,fontSize:'0.75rem'}}>{gig.client?.name?.[0]}</div>
          <span className={styles.clientName}>{gig.client?.name}</span>
        </div>
        <div className={styles.gigMeta}>
          <span className={styles.gigBudget}>${gig.budget}</span>
          <span className={styles.gigDeadline}>⏰ {daysLeft}d left</span>
        </div>
      </div>
    </Link>
  );
}
