import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useState, useRef, useEffect } from 'react';

const TEAL = '#49BBBD';
const NAVY = '#1B2A4A';

const TOOLS = [
    { to: '/assistant', icon: 'fas fa-robot', label: 'Assistant IA' },
    { to: '/fiches', icon: 'fas fa-layer-group', label: 'Fiches de revision' },
    { to: '/simulation', icon: 'fas fa-clock', label: 'Simulation d\'examen' },
    { to: '/evaluations', icon: 'fas fa-clipboard-check', label: 'Quiz & Evaluations' },
    { to: '/predictions', icon: 'fas fa-bullseye', label: 'Predictions d\'examens' },
    { to: '/progression', icon: 'fas fa-chart-line', label: 'Ma progression' },
    { to: '/revision', icon: 'fas fa-clipboard-list', label: 'Programme de revision' },
    { to: '/planification', icon: 'fas fa-calendar-alt', label: 'Planification' },
    { to: '/bibliotheque', icon: 'fas fa-book', label: 'Bibliotheque' },
    { to: '/communaute', icon: 'fas fa-comments', label: 'Forum Communautaire' },
];

const navCSS = `
.nav-center { display:flex; align-items:center; gap:28px; }
.nav-right { display:flex; align-items:center; gap:16px; }
.nav-hamburger { display:none; background:none; border:none; cursor:pointer; padding:8px; font-size:22px; color:${NAVY}; }
.nav-mobile-overlay { display:none; }

@media(max-width:768px){
  .nav-center { display:none; }
  .nav-right { display:none; }
  .nav-hamburger { display:block; }
  .nav-mobile-overlay {
    display:block; position:fixed; top:70px; left:0; right:0; bottom:0;
    background:white; z-index:99; overflow-y:auto;
    padding:20px 24px 40px;
    border-top:1px solid #f0f0f0;
    animation: navSlideIn .2s ease;
  }
  @keyframes navSlideIn {
    from { opacity:0; transform:translateY(-10px); }
    to { opacity:1; transform:translateY(0); }
  }
}
`;

export default function Navbar() {
    const { user, logout } = useAuth();
    const { t, lang, switchLang } = useLang();
    const navigate = useNavigate();
    const location = useLocation();
    const [toolsOpen, setToolsOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const dropRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setToolsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close on route change
    useEffect(() => { setToolsOpen(false); setMobileOpen(false); }, [location.pathname]);

    const isToolActive = TOOLS.some(t => location.pathname.startsWith(t.to));

    return (
        <nav style={{
            background: 'white',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        }}>
            <style>{navCSS}</style>
            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 70,
            }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: 14,
                    }}>IA</div>
                    <span style={{ fontWeight: 700, fontSize: 20, color: NAVY, letterSpacing: -0.5 }}>INSAM-IA</span>
                </Link>

                {/* Center nav (desktop) */}
                <div className="nav-center">
                    <NavItem to="/" end>{t('nav.home')}</NavItem>
                    <NavItem to="/formations">{t('nav.courses')}</NavItem>
                    <NavItem to="/marketplace">Marketplace</NavItem>
                    <NavItem to="/tarifs">Tarifs</NavItem>
                    {user && <NavItem to="/dashboard">Dashboard</NavItem>}

                    {/* Tools dropdown */}
                    {user && (
                        <div ref={dropRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setToolsOpen(!toolsOpen)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    color: isToolActive ? TEAL : '#4b5563',
                                    fontWeight: isToolActive ? 600 : 500,
                                    fontSize: 15,
                                    paddingBottom: 4,
                                    borderBottom: isToolActive ? `2px solid ${TEAL}` : '2px solid transparent',
                                    transition: 'all .2s',
                                }}
                            >
                                Outils
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{
                                    transform: toolsOpen ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform .2s',
                                }}>
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>

                            {toolsOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 12px)',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'white',
                                    borderRadius: 16,
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                                    border: '1px solid #f0f0f0',
                                    padding: '8px',
                                    minWidth: 240,
                                    zIndex: 100,
                                }}>
                                    {TOOLS.map(tool => {
                                        const active = location.pathname.startsWith(tool.to);
                                        return (
                                            <Link
                                                key={tool.to}
                                                to={tool.to}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '10px 14px',
                                                    borderRadius: 10,
                                                    textDecoration: 'none',
                                                    color: active ? TEAL : NAVY,
                                                    background: active ? '#e8f8f5' : 'transparent',
                                                    fontWeight: active ? 600 : 500,
                                                    fontSize: 14,
                                                    transition: 'background .15s',
                                                }}
                                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f9fafb'; }}
                                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <i className={tool.icon} style={{ width: 18, textAlign: 'center', fontSize: 14, color: active ? TEAL : '#9ca3af' }}></i>
                                                {tool.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right side (desktop) */}
                <div className="nav-right">
                    <button
                        onClick={() => switchLang(lang === 'fr' ? 'en' : 'fr')}
                        style={{
                            background: 'none',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: '#6b7280',
                        }}
                    >
                        {lang === 'fr' ? 'EN' : 'FR'}
                    </button>

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700,
                                }}>
                                    {(user.prenom || user.nom || 'U')[0]}
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.prenom || user.name}</span>
                            </Link>
                            <button onClick={handleLogout} style={{
                                background: 'none', border: 'none', color: '#9ca3af',
                                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            }}>{t('nav.logout')}</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Link to="/login" style={{
                                textDecoration: 'none', color: NAVY, fontSize: 14, fontWeight: 600,
                                padding: '8px 20px', borderRadius: 50, border: `1.5px solid ${TEAL}`,
                            }}>{t('nav.login')}</Link>
                            <Link to="/register" style={{
                                textDecoration: 'none', background: TEAL, color: 'white',
                                fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 50,
                            }}>{t('nav.register')}</Link>
                        </div>
                    )}
                </div>

                {/* Hamburger (mobile) */}
                <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
                    <i className={mobileOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="nav-mobile-overlay">
                    {/* Nav links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                        <MobileNavItem to="/" end>{t('nav.home')}</MobileNavItem>
                        <MobileNavItem to="/formations">{t('nav.courses')}</MobileNavItem>
                        <MobileNavItem to="/marketplace">Marketplace</MobileNavItem>
                        <MobileNavItem to="/tarifs">Tarifs</MobileNavItem>
                        {user && <MobileNavItem to="/dashboard">Dashboard</MobileNavItem>}
                    </div>

                    {/* Tools (mobile) */}
                    {user && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, padding: '0 12px' }}>
                                Outils
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {TOOLS.map(tool => (
                                    <Link key={tool.to} to={tool.to} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '10px 12px', borderRadius: 10,
                                        textDecoration: 'none',
                                        color: location.pathname.startsWith(tool.to) ? TEAL : NAVY,
                                        background: location.pathname.startsWith(tool.to) ? '#e8f8f5' : '#f9fafb',
                                        fontSize: 13, fontWeight: 500,
                                    }}>
                                        <i className={tool.icon} style={{ fontSize: 13, color: location.pathname.startsWith(tool.to) ? TEAL : '#9ca3af' }}></i>
                                        {tool.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom actions */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button
                            onClick={() => { switchLang(lang === 'fr' ? 'en' : 'fr'); setMobileOpen(false); }}
                            style={{
                                background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
                                padding: '10px', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', color: '#6b7280', textAlign: 'center',
                            }}
                        >
                            {lang === 'fr' ? 'Switch to English' : 'Passer en Francais'}
                        </button>

                        {user ? (
                            <>
                                <Link to="/profil" style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', borderRadius: 10,
                                    textDecoration: 'none', background: '#f9fafb',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 700,
                                    }}>
                                        {(user.prenom || user.nom || 'U')[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{user.prenom || user.name}</div>
                                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{user.email}</div>
                                    </div>
                                </Link>
                                <button onClick={() => { handleLogout(); setMobileOpen(false); }} style={{
                                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                                    padding: '10px', fontSize: 13, fontWeight: 600,
                                    cursor: 'pointer', color: '#ef4444', textAlign: 'center',
                                }}>
                                    {t('nav.logout')}
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Link to="/login" style={{
                                    flex: 1, textAlign: 'center', textDecoration: 'none',
                                    color: NAVY, fontSize: 14, fontWeight: 600,
                                    padding: '10px', borderRadius: 8, border: `1.5px solid ${TEAL}`,
                                }}>{t('nav.login')}</Link>
                                <Link to="/register" style={{
                                    flex: 1, textAlign: 'center', textDecoration: 'none',
                                    background: TEAL, color: 'white',
                                    fontSize: 14, fontWeight: 600, padding: '10px', borderRadius: 8,
                                }}>{t('nav.register')}</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

function NavItem({ to, end, children }) {
    return (
        <NavLink
            to={to}
            end={end}
            style={({ isActive }) => ({
                color: isActive ? TEAL : '#4b5563',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                fontSize: 15,
                paddingBottom: 4,
                borderBottom: isActive ? `2px solid ${TEAL}` : '2px solid transparent',
                transition: 'all .2s',
            })}
        >
            {children}
        </NavLink>
    );
}

function MobileNavItem({ to, end, children }) {
    return (
        <NavLink
            to={to}
            end={end}
            style={({ isActive }) => ({
                display: 'block',
                padding: '12px',
                borderRadius: 10,
                color: isActive ? TEAL : NAVY,
                background: isActive ? '#e8f8f5' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                fontSize: 15,
            })}
        >
            {children}
        </NavLink>
    );
}
