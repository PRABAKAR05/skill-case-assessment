import { useLocation, useNavigate } from 'react-router-dom';

const HomeIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? 'var(--accent)' : 'none'}
    stroke={active ? 'var(--accent)' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const SavedIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? 'var(--accent)' : 'none'}
    stroke={active ? 'var(--accent)' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const AccountIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? 'var(--accent)' : 'none'}
    stroke={active ? 'var(--accent)' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TABS = [
  { path: '/', label: 'Home', Icon: HomeIcon },
  { path: '/saved', label: 'Saved', Icon: SavedIcon },
  { path: '/account', label: 'Account', Icon: AccountIcon },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={S.nav}>
      {TABS.map(({ path, label, Icon }) => {
        const active = pathname === path;
        return (
          <button key={path} style={S.tab} onClick={() => navigate(path)}>
            <Icon active={active} />
            <span style={{ ...S.label, color: active ? 'var(--accent)' : '#555' }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const S = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
    height: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))',
    paddingBottom: 'env(safe-area-inset-bottom)',
    display: 'flex', alignItems: 'center',
    background: 'rgba(10,10,10,0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid #1e1e1e',
  },
  tab: {
    flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 3, border: 'none',
    background: 'none', cursor: 'pointer',
  },
  label: { fontSize: 10, fontWeight: 600 },
};
