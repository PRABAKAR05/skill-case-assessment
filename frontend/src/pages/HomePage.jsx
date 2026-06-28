import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import VideoCard from '../components/VideoCard';
import BottomNav from '../components/BottomNav';
import { logout } from '../redux/authSlice';
import useIsMobile from '../hooks/useIsMobile';

// Sidebar SVG icons
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const SavedIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const AccountIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const feedRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    api.get('/videos')
      .then(({ data }) => setVideos(data.videos))
      .catch(() => setError('Failed to load videos'))
      .finally(() => setLoading(false));
  }, []);

  // Track current index from manual scroll
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const onScroll = () => {
      const slideHeight = feed.clientHeight || window.innerHeight;
      const idx = Math.round(feed.scrollTop / slideHeight);
      setCurrentIdx(idx);
    };
    feed.addEventListener('scroll', onScroll, { passive: true });
    return () => feed.removeEventListener('scroll', onScroll);
  }, [videos.length]);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const scrollToIdx = (idx) => {
    if (!feedRef.current || idx < 0 || idx >= videos.length) return;
    const slideHeight = feedRef.current.clientHeight || window.innerHeight;
    feedRef.current.scrollTo({ top: idx * slideHeight, behavior: 'smooth' });
    setCurrentIdx(idx);
  };

  if (loading) {
    return (
      <div style={S.center}>
        <motion.div style={S.spinner}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={S.center}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-outer">

      {/* Left sidebar — desktop only */}
      {!isMobile && (
        <aside className="sidebar">
          <div className="sidebar-logo">S</div>
          <button className="sidebar-btn active" title="Home"><HomeIcon /></button>
          <button className="sidebar-btn" onClick={() => navigate('/saved')} title="Saved"><SavedIcon /></button>
          <button className="sidebar-btn" onClick={() => navigate('/account')} title="Account"><AccountIcon /></button>
          <div className="sidebar-spacer" />
          <span style={{ fontSize: 10, color: '#444', marginBottom: 4, textAlign: 'center', padding: '0 4px', wordBreak: 'break-all' }}>
            @{user?.username?.slice(0, 7)}
          </span>
          {user
            ? <button className="sidebar-btn" onClick={handleLogout} title="Logout"><LogoutIcon /></button>
            : <button className="sidebar-btn" onClick={() => navigate('/login')} title="Login" style={{ fontSize: 12, color: '#888' }}>Login</button>
          }
        </aside>
      )}

      {/* Main content */}
      <div className="content-area">

        {/* Vertical scroll-snap feed */}
        <div ref={feedRef} className="feed-scroll" style={S.feed}>
          {videos.length === 0 ? (
            <div style={{ height: 'var(--app-viewport-h)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#555' }}>No videos yet.</p>
            </div>
          ) : (
            videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onUpdate={(updated) =>
                  setVideos(prev => prev.map(v => v.id === updated.id ? updated : v))
                }
              />
            ))
          )}
        </div>

        {/* Desktop nav arrows */}
        {!isMobile && (
          <div className="nav-arrows">
            <button className="nav-arrow-btn"
              onClick={() => scrollToIdx(currentIdx - 1)}
              disabled={currentIdx === 0}>↑</button>
            <button className="nav-arrow-btn"
              onClick={() => scrollToIdx(currentIdx + 1)}
              disabled={currentIdx >= videos.length - 1}>↓</button>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav />}
    </div>
  );
}

const S = {
  center: {
    height: 'var(--app-viewport-h)', background: '#111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--accent)',
  },
  feed: {
    height: 'var(--app-viewport-h)', width: '100%',
    overflowY: 'scroll', scrollSnapType: 'y mandatory',
  },
};
