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
    { to: '/sujets', icon: 'fas fa-file-alt', label: 'Sujets d\'examens' },
    { to: '/predictions', icon: 'fas fa-bullseye', label: 'Predictions d\'examens' },
    { to: '/progression', icon: 'fas fa-chart-line', label: 'Ma progression' },
    { to: '/planification', icon: 'fas fa-calendar-alt', label: 'Planification' },
    { to: '/bibliotheque', icon: 'fas fa-book', label: 'Bibliotheque' },
    { to: '/communaute', icon: 'fas fa-comments', label: 'Chat Communautaire' },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const { t, lang, switchLang } = useLang();
    const navigate = useNavigate();
    const location = useLocation();
    const [toolsOpen, setToolsOpen] = useState(false);
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
    useEffect(() => { setToolsOpen(false); }, [location.pathname]);

    const isToolActive = TOOLS.some(t => location.pathname.startsWith(t.to));

    return (
        <nav style={{
            background: 'white',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        }}>
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

                {/* Center nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
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

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
            </div>
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
