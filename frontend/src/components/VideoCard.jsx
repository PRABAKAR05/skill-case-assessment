import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useInView from '../hooks/useInView';
import useIsMobile from '../hooks/useIsMobile';
import CommentSheet from './CommentSheet';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const fmt = (n = 0) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

// — SVG icons —
const HeartSVG = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="26" height="26"
    fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const ChatSVG = () => (
  <svg viewBox="0 0 24 24" width="26" height="26"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const BookmarkSVG = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="26" height="26"
    fill={filled ? 'var(--accent)' : 'none'} stroke={filled ? 'var(--accent)' : 'currentColor'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const MuteSVG = ({ on }) => on ? (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const PlaySVG = () => (
  <svg viewBox="0 0 24 24" width="60" height="60" fill="rgba(255,255,255,0.88)">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const InfoSVG = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function VideoCard({ video, onUpdate }) {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [containerRef, inView] = useInView({ threshold: 0.7 });
  const isMobile = useIsMobile();

  // Debounced like (net-change: only one API call after rapid clicks stop)
  const confirmedLiked = useRef(video.liked ?? false);
  const optimisticLiked = useRef(video.liked ?? false);
  const likeTimer = useRef(null);
  const [liked, setLiked] = useState(video.liked ?? false);
  const [likeCount, setLikeCount] = useState(video.like_count ?? 0);

  const [commentCount, setCommentCount] = useState(video.comment_count ?? 0);
  const [bookmarked, setBookmarked] = useState(video.bookmarked ?? false);
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(true); // mobile info overlay toggle
  const [authPrompt, setAuthPrompt] = useState(false); // nudge guest users to sign in

  // Auto play/pause on scroll
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (inView) { el.play().catch(() => {}); }
    else { el.pause(); setPaused(false); }
  }, [inView]);

  // Real-time polling — syncs counts across sessions every 8s when visible
  useEffect(() => {
    if (!inView) return;
    const poll = setInterval(async () => {
      try {
        const { data } = await api.get(`/videos/${video.id}`);
        if (!likeTimer.current) setLikeCount(data.video.like_count ?? 0);
        setCommentCount(data.video.comment_count ?? 0);
      } catch {}
    }, 8000);
    return () => clearInterval(poll);
  }, [inView, video.id]);

  // Require login — shows prompt instead of silent fail
  const requireAuth = (action) => {
    if (!user) { setAuthPrompt(true); return false; }
    return true;
  };

  // Debounced like: net-change only, one API call per intent
  const handleLike = () => {
    if (!requireAuth()) return;
    optimisticLiked.current = !optimisticLiked.current;
    setLiked(optimisticLiked.current);
    setLikeCount(c => optimisticLiked.current ? c + 1 : Math.max(0, c - 1));
    if (likeTimer.current) clearTimeout(likeTimer.current);
    likeTimer.current = setTimeout(async () => {
      likeTimer.current = null;
      if (optimisticLiked.current === confirmedLiked.current) return;
      try {
        const { data } = await api.post(`/videos/${video.id}/like`);
        confirmedLiked.current = data.liked;
        optimisticLiked.current = data.liked;
        setLiked(data.liked);
        setLikeCount(data.like_count);
        onUpdate({ ...video, liked: data.liked, like_count: data.like_count });
      } catch {
        optimisticLiked.current = confirmedLiked.current;
        setLiked(confirmedLiked.current);
        setLikeCount(video.like_count);
      }
    }, 500);
  };

  const handleBookmark = async () => {
    if (!requireAuth()) return;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      const { data } = await api.post(`/videos/${video.id}/bookmark`);
      setBookmarked(data.bookmarked);
    } catch { setBookmarked(!next); }
  };

  const handleComment = () => {
    if (!requireAuth()) return;
    setShowComments(true);
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPaused(false); }
    else { el.pause(); setPaused(true); }
  };

  const hideInfo = (e) => {
    e.stopPropagation();
    setShowInfo(false);
  };

  const showInfoAgain = (e) => {
    e.stopPropagation();
    setShowInfo(true);
  };

  const videoSrc = video.file_path.startsWith('http')
    ? video.file_path
    : `${API_URL}${video.file_path}`;

  // Action buttons (shared between layouts)
  const actions = (
    <>
      <motion.button className="action-btn" onClick={handleLike} whileTap={{ scale: 0.82 }}>
        <div className="action-icon"><HeartSVG filled={liked} /></div>
        <span className="action-count">{fmt(likeCount)}</span>
      </motion.button>
      <motion.button className="action-btn" onClick={handleComment} whileTap={{ scale: 0.82 }}>
        <div className="action-icon"><ChatSVG /></div>
        <span className="action-count">{fmt(commentCount)}</span>
      </motion.button>
      <motion.button className="action-btn" onClick={handleBookmark} whileTap={{ scale: 0.82 }}>
        <div className="action-icon"><BookmarkSVG filled={bookmarked} /></div>
      </motion.button>
    </>
  );

  // Info text (shared)
  const info = (
    <>
      <span className="info-category">{video.category}</span>
      <h3 className="info-title">{video.title}</h3>
      {video.description && <p className="info-desc">{video.description}</p>}
    </>
  );

  // Pause icon overlay
  const pauseIcon = (
    <AnimatePresence>
      {paused && (
        <motion.div style={S.pauseOverlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }} onClick={togglePlay}>
          <PlaySVG />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} style={S.slide}>

      {isMobile ? (
        /* ── MOBILE: full-screen, overlaid controls ── */
        <>
          <video ref={videoRef} src={videoSrc} style={S.mobileVideo}
            loop muted={muted} playsInline onClick={togglePlay} />
          {pauseIcon}
          <div style={S.bottomGrad} />

          {/* Info area — tap to hide/show subtitles */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                className="reel-mobile-info"
                style={{ cursor: 'pointer' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={hideInfo}
              >
                {info}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ⓘ button when info is hidden */}
          {!showInfo && (
            <motion.button
              style={S.infoToggle}
              onClick={showInfoAgain}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              title="Show info"
            >
              <InfoSVG />
            </motion.button>
          )}

          <div className="reel-mobile-actions">
            <button className="mute-btn-float" onClick={() => setMuted(m => !m)}>
              <MuteSVG on={muted} />
            </button>
            {actions}
          </div>
        </>
      ) : (
        /* ── DESKTOP: Instagram-style side-by-side layout ── */
        <div className="reel-desktop-inner">
          <div className="reel-info-panel">{info}</div>
          <div className="reel-video-col">
            <video ref={videoRef} src={videoSrc}
              loop muted={muted} playsInline onClick={togglePlay} />
            <button className="mute-btn" onClick={() => setMuted(m => !m)}>
              <MuteSVG on={muted} />
            </button>
            {pauseIcon}
          </div>
          <div className="reel-actions-col">{actions}</div>
        </div>
      )}

      {/* Auth nudge: shown when guest user tries to interact */}
      <AnimatePresence>
        {authPrompt && (
          <motion.div style={S.authOverlay}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }}
            onClick={() => setAuthPrompt(false)}
          >
            <div style={S.authCard} onClick={e => e.stopPropagation()}>
              <p style={S.authTitle}>Sign in to interact</p>
              <p style={S.authSub}>Like, comment, and save reels you love.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button style={S.authBtn} onClick={() => navigate('/login')}>Log In</button>
                <button style={{ ...S.authBtn, background: '#2a2a2a' }} onClick={() => navigate('/register')}>Sign Up</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment sheet — portaled to document.body */}
      <AnimatePresence>
        {showComments && (
          <CommentSheet
            videoId={video.id}
            onClose={() => setShowComments(false)}
            onCommentAdded={() => setCommentCount(c => c + 1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const S = {
  slide: {
    height: 'var(--app-viewport-h)', width: '100%', scrollSnapAlign: 'start', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#111', overflow: 'hidden', position: 'relative',
  },
  mobileVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))',
    width: '100%',
    height: 'calc(100% - var(--bottom-nav-h) - env(safe-area-inset-bottom))',
    objectFit: 'contain', background: '#000', cursor: 'pointer', zIndex: 1,
  },
  pauseOverlay: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.28)', cursor: 'pointer', zIndex: 10,
  },
  bottomGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
    zIndex: 2, pointerEvents: 'none',
  },
  infoToggle: {
    position: 'absolute', bottom: 'calc(112px + env(safe-area-inset-bottom))', left: 16, zIndex: 16,
    width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', border: 'none', cursor: 'pointer',
  },
  authOverlay: {
    position: 'absolute', inset: 0, zIndex: 50,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)', padding: '0 0 60px',
  },
  authCard: {
    background: '#1a1a1a', borderRadius: 20, padding: '24px 28px',
    width: '100%', maxWidth: 340, textAlign: 'center',
    boxShadow: '0 -4px 30px rgba(0,0,0,0.4)',
  },
  authTitle: { fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 },
  authSub: { fontSize: 13, color: '#888' },
  authBtn: {
    flex: 1, padding: '10px 0', borderRadius: 10,
    background: 'var(--accent)', color: '#fff', fontWeight: 700,
    fontSize: 14, border: 'none', cursor: 'pointer',
  },
};
