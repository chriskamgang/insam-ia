import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

// Gradient palettes for category image areas — cycling
const GRADIENTS = [
    'linear-gradient(135deg, #5BBCB4 0%, #1B2A4A 100%)',
    'linear-gradient(135deg, #F5A623 0%, #E07B00 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)',
    'linear-gradient(135deg, #E74C3C 0%, #9B1C1C 100%)',
    'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #92400E 100%)',
    'linear-gradient(135deg, #EC4899 0%, #831843 100%)',
    'linear-gradient(135deg, #14B8A6 0%, #134E4A 100%)',
    'linear-gradient(135deg, #6366F1 0%, #312E81 100%)',
];

// Accent colors matching each gradient (for tags, etc.)
const ACCENT_COLORS = [
    TEAL, '#F5A623', '#8B5CF6', '#E74C3C', '#10B981',
    '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1',
];

const catCSS = `
.cat-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.cat-cta-flex { display:flex; align-items:center; gap:48px; padding:52px 24px; }
.cat-cta-visual { flex:1; display:flex; justify-content:center; }
.cat-cta-visual-box { width:320px; height:240px; }
@media(max-width:1024px){
  .cat-grid4 { grid-template-columns:repeat(2,1fr); }
  .cat-cta-flex { gap:28px; }
  .cat-cta-visual-box { width:260px; height:200px; }
}
@media(max-width:768px){
  .cat-grid4 { grid-template-columns:repeat(2,1fr); gap:14px; }
  .cat-cta-flex { flex-direction:column; padding:36px 24px; }
  .cat-cta-visual { display:none; }
}
@media(max-width:480px){
  .cat-grid4 { grid-template-columns:1fr; }
}
`;

export default function Categories() {
    const { t } = useLang();
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [recentVideos, setRecentVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        Promise.all([
            api.get('/api/public/categories'),
            api.get('/api/public/recent-videos'),
        ])
            .then(([catRes, vidRes]) => {
                setCategories(catRes.data.data || []);
                setRecentVideos(vidRes.data.data || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Build filter pills from first word of each category name, capped at 6
    const filterWords = Array.from(
        new Set(categories.map(c => c.name?.split(' ')[0]).filter(Boolean))
    ).slice(0, 6);
    const filters = ['all', ...filterWords];

    // Apply search + active filter
    const displayed = categories.filter(c => {
        const matchesSearch = searchQuery === '' ||
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' ||
            c.name?.toLowerCase().startsWith(activeFilter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    const handleSearch = () => setSearchQuery(searchInput);
    const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

    return (
        <div style={{ background: '#F5F5F5', minHeight: '100vh', fontFamily: 'inherit' }}>
            <style>{catCSS}</style>

            {/* ── SEARCH BAR SECTION (TOTC top bar) ── */}
            <section style={{ background: TEAL, padding: '28px 0' }}>
                <div style={{ ...W, display: 'flex', alignItems: 'center', gap: 0 }}>
                    {/* Search input */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        background: 'white',
                        borderRadius: 8,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        height: 48,
                    }}>
                        <span style={{
                            padding: '0 16px',
                            color: '#9ca3af',
                            fontSize: 15,
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Rechercher une filiere..."
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: 14,
                                color: NAVY,
                                background: 'transparent',
                                padding: '0 8px 0 0',
                                height: '100%',
                            }}
                        />
                    </div>
                    {/* Search button */}
                    <button
                        onClick={handleSearch}
                        style={{
                            background: NAVY,
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            padding: '0 28px',
                            height: 48,
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginLeft: 12,
                            letterSpacing: 0.4,
                            transition: 'background .15s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#243758'}
                        onMouseLeave={e => e.currentTarget.style.background = NAVY}
                    >
                        Rechercher
                    </button>
                </div>
            </section>

            {/* ── FILTER PILLS ROW ── */}
            <section style={{ background: 'white', borderBottom: '1px solid #e8e8e8', padding: '0' }}>
                <div style={{
                    ...W,
                    display: 'flex',
                    gap: 10,
                    overflowX: 'auto',
                    padding: '14px 24px',
                    scrollbarWidth: 'none',
                }}>
                    {filters.map(f => {
                        const active = f === activeFilter;
                        return (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                style={{
                                    padding: '7px 20px',
                                    borderRadius: 50,
                                    border: active ? `1.5px solid ${TEAL}` : '1.5px solid #d1d5db',
                                    background: active ? TEAL : 'white',
                                    color: active ? 'white' : '#6b7280',
                                    fontWeight: active ? 700 : 500,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all .15s',
                                    flexShrink: 0,
                                }}
                            >
                                {f === 'all' ? 'Toutes les filieres' : f}
                            </button>
                        );
                    })}
                    {/* clear search pill if active */}
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setSearchInput(''); }}
                            style={{
                                padding: '7px 16px',
                                borderRadius: 50,
                                border: '1.5px solid #E74C3C',
                                background: 'white',
                                color: '#E74C3C',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            <i className="fas fa-times" style={{ marginRight: 6 }}></i>
                            Effacer "{searchQuery}"
                        </button>
                    )}
                </div>
            </section>

            <div style={{ ...W, marginTop: 36 }}>

                {/* ── SECTION HEADING ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>
                            Nos Videos TP
                        </h2>
                        {!loading && (
                            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                                {displayed.length} filiere{displayed.length !== 1 ? 's' : ''} disponible{displayed.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <Link to="/recherche" style={{
                        fontSize: 13, color: TEAL, fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        {t('common.see_all')} <i className="fas fa-arrow-right" style={{ fontSize: 11 }}></i>
                    </Link>
                </div>

                {/* ── LOADING SKELETON ── */}
                {loading && (
                    <div className="cat-grid4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} style={{
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #f0f0f0',
                                overflow: 'hidden',
                            }}>
                                <div style={{ height: 150, background: '#f3f4f6' }}></div>
                                <div style={{ padding: '14px 16px 16px' }}>
                                    <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, marginBottom: 8, width: '75%' }}></div>
                                    <div style={{ height: 11, background: '#f9fafb', borderRadius: 4, marginBottom: 5 }}></div>
                                    <div style={{ height: 11, background: '#f9fafb', borderRadius: 4, width: '85%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── EMPTY STATE ── */}
                {!loading && displayed.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
                        <i className="fas fa-search" style={{ fontSize: 48, marginBottom: 16, color: '#e5e7eb' }}></i>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#6b7280' }}>Aucune filiere trouvee</p>
                        <p style={{ fontSize: 13, marginTop: 6 }}>Essayez un autre filtre ou un autre terme de recherche.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                            <button onClick={() => { setActiveFilter('all'); setSearchQuery(''); setSearchInput(''); }} style={{
                                padding: '10px 24px', borderRadius: 50,
                                background: TEAL, color: 'white', border: 'none',
                                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                            }}>
                                Voir toutes les filieres
                            </button>
                        </div>
                    </div>
                )}

                {/* ── CATEGORIES GRID (4-col TOTC style) ── */}
                {!loading && displayed.length > 0 && (
                    <div className="cat-grid4">
                        {displayed.map((cat, idx) => (
                            <CategoryCard key={cat.id} cat={cat} idx={idx} t={t} />
                        ))}
                    </div>
                )}

            </div>

            {/* ── CTA BANNER ── */}
            {!loading && (
                <section style={{
                    background: 'linear-gradient(135deg, #e6faf8 0%, #d0f4f0 100%)',
                    margin: '56px 0 0',
                    padding: '0',
                    borderTop: `4px solid ${TEAL}`,
                }}>
                    <div className="cat-cta-flex" style={{ ...W }}>
                        {/* Left: text + bullets + CTA */}
                        <div style={{ flex: 1 }}>
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: TEAL,
                                letterSpacing: 1, textTransform: 'uppercase',
                            }}>
                                INSAM-IA Platform
                            </span>
                            <h2 style={{
                                fontSize: 28, fontWeight: 800, color: NAVY,
                                margin: '12px 0 20px', lineHeight: 1.3,
                            }}>
                                Know about our learning platform
                            </h2>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    'Acces a des centaines de videos TP par filiere',
                                    'Parcours structure avec objectifs clairs',
                                    'Debouches professionnels identifies',
                                    'Assistant IA disponible 24h/7',
                                ].map((point, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <span style={{
                                            width: 20, height: 20, borderRadius: '50%',
                                            background: TEAL, color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 10, flexShrink: 0, marginTop: 1,
                                        }}>
                                            <i className="fas fa-check"></i>
                                        </span>
                                        <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{point}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to={user ? "/dashboard" : "/register"} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                background: TEAL, color: 'white',
                                padding: '13px 28px', borderRadius: 8,
                                textDecoration: 'none', fontWeight: 700, fontSize: 14,
                                boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                                transition: 'all .15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#4aada5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = TEAL; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                Start learning now
                                <i className="fas fa-arrow-right" style={{ fontSize: 12 }}></i>
                            </Link>
                        </div>

                        {/* Right: decorative visual */}
                        <div className="cat-cta-visual">
                            <div className="cat-cta-visual-box" style={{
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, #5BBCB4 0%, #1B2A4A 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 16px 48px rgba(91,188,180,0.25)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                {/* Background pattern dots */}
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        width: 60 + i * 20, height: 60 + i * 20,
                                        borderRadius: '50%',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        top: '50%', left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                    }}></div>
                                ))}
                                <div style={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 1 }}>
                                    <i className="fas fa-graduation-cap" style={{ fontSize: 56, opacity: 0.9, marginBottom: 12 }}></i>
                                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>INSAM-IA</p>
                                    <p style={{ fontSize: 12, opacity: 0.7, margin: '4px 0 0' }}>Votre plateforme de formation</p>
                                </div>
                                {/* Small floating stat cards */}
                                <div style={{
                                    position: 'absolute', top: 16, right: 16,
                                    background: 'white', borderRadius: 10,
                                    padding: '8px 12px', textAlign: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{categories.length}+</div>
                                    <div style={{ fontSize: 10, color: '#9ca3af' }}>Filieres</div>
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: 16, left: 16,
                                    background: 'white', borderRadius: 10,
                                    padding: '8px 12px', textAlign: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: TEAL }}>
                                        {categories.reduce((a, c) => a + (c.courses_count || 0), 0)}+
                                    </div>
                                    <div style={{ fontSize: 10, color: '#9ca3af' }}>Cours</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── RECOMMENDED / RECENT SECTION ── */}
            {!loading && recentVideos.length > 0 && (
                <div style={{ ...W, marginTop: 56, paddingBottom: 64 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>
                                {t('home.recent_title')}
                            </h2>
                            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                                Dernieres videos ajoutees a la plateforme
                            </p>
                        </div>
                        <Link to="/formations" style={{
                            fontSize: 13, color: TEAL, fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            {t('common.see_all')} <i className="fas fa-arrow-right" style={{ fontSize: 11 }}></i>
                        </Link>
                    </div>

                    <div className="cat-grid4">
                        {recentVideos.slice(0, 8).map((video, idx) => (
                            <RecentVideoCard key={video.id} video={video} idx={idx} t={t} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── PADDING BOTTOM ── */}
            {!loading && recentVideos.length === 0 && (
                <div style={{ paddingBottom: 64 }}></div>
            )}
        </div>
    );
}

// ── TOTC-style Category Card ──
function CategoryCard({ cat, idx, t }) {
    const [hovered, setHovered] = useState(false);
    const gradient = GRADIENTS[idx % GRADIENTS.length];
    const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];

    return (
        <Link
            to={`/formations/${cat.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e8e8e8',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: hovered
                    ? '0 12px 32px rgba(0,0,0,0.12)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all .22s ease',
                cursor: 'pointer',
            }}>

                {/* ── IMAGE / THUMBNAIL AREA ── */}
                <div style={{
                    height: 150,
                    background: cat.image ? `url(/storage/${cat.image}) center/cover no-repeat` : gradient,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    {/* Overlay for readability when image is used */}
                    {cat.image && (
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 100%)' }}></div>
                    )}
                    {/* Background pattern */}
                    {!cat.image && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
                        }}></div>
                    )}

                    {/* Center icon */}
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: 'rgba(255,255,255,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, color: 'white',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        transition: 'transform .22s',
                        transform: hovered ? 'scale(1.1)' : 'scale(1)',
                        zIndex: 1,
                    }}>
                        <i className={cat.icon || 'fas fa-laptop-code'}></i>
                    </div>

                    {/* Top-left overlay tags */}
                    <div style={{
                        position: 'absolute', top: 10, left: 10,
                        display: 'flex', gap: 6,
                    }}>
                        {/* Category tag */}
                        <span style={{
                            background: accentColor,
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 50,
                            letterSpacing: 0.3,
                            maxWidth: 90,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {cat.name?.split(' ')[0] || 'Formation'}
                        </span>
                        {/* Video count tag */}
                        {cat.courses_count > 0 && (
                            <span style={{
                                background: 'rgba(255,255,255,0.92)',
                                color: NAVY,
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: 50,
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <i className="fas fa-play-circle" style={{ color: accentColor, fontSize: 9 }}></i>
                                {cat.courses_count}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── CARD BODY ── */}
                <div style={{ padding: '14px 16px 0' }}>
                    {/* Title */}
                    <h3 style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: NAVY,
                        margin: '0 0 6px',
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}>
                        {cat.name}
                    </h3>
                    {/* Description */}
                    <p style={{
                        fontSize: 13,
                        color: '#6b7280',
                        lineHeight: 1.6,
                        margin: '0 0 14px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        minHeight: 60,
                        textAlign: 'justify',
                    }}>
                        {cat.description || 'Decouvrez cette filiere et ses opportunites professionnelles.'}
                    </p>
                </div>

                {/* ── DIVIDER ── */}
                <div style={{ height: 1, background: '#f3f4f6', margin: '0 16px' }}></div>

                {/* ── BOTTOM ROW ── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px 14px',
                }}>
                    {/* Left: avatar + brand name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: 'white', fontWeight: 800, flexShrink: 0,
                        }}>
                            I
                        </div>
                        <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>INSAM-IA</span>
                    </div>
                    {/* Right: video count */}
                    <span style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <i className="fas fa-book" style={{ fontSize: 10, color: accentColor }}></i>
                        {cat.courses_count || 0} {t('categories.videos')}
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ── Recent Video Card (same TOTC format, for the lower section) ──
function RecentVideoCard({ video, idx, t }) {
    const [hovered, setHovered] = useState(false);
    const gradient = GRADIENTS[(idx + 3) % GRADIENTS.length];
    const accentColor = ACCENT_COLORS[(idx + 3) % ACCENT_COLORS.length];

    return (
        <Link
            to={`/videos/${video.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e8e8e8',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: hovered
                    ? '0 12px 32px rgba(0,0,0,0.12)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all .22s ease',
                cursor: 'pointer',
            }}>

                {/* Thumbnail */}
                <div style={{
                    height: 150,
                    background: gradient,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)',
                    }}></div>
                    {/* Play button */}
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        transition: 'transform .22s',
                        transform: hovered ? 'scale(1.12)' : 'scale(1)',
                    }}>
                        <i className="fas fa-play" style={{ color: 'white', fontSize: 14, marginLeft: 2 }}></i>
                    </div>

                    {/* Tags */}
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                        <span style={{
                            background: accentColor,
                            color: 'white',
                            fontSize: 10, fontWeight: 700,
                            padding: '3px 9px', borderRadius: 50,
                        }}>
                            Video
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px 0' }}>
                    <h3 style={{
                        fontSize: 15, fontWeight: 700, color: NAVY,
                        margin: '0 0 6px', lineHeight: 1.35,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}>
                        {video.title || video.name}
                    </h3>
                    <p style={{
                        fontSize: 13, color: '#6b7280', lineHeight: 1.6,
                        margin: '0 0 14px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        minHeight: 60,
                    }}>
                        {video.description || 'Regardez cette video de travaux pratiques.'}
                    </p>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#f3f4f6', margin: '0 16px' }}></div>

                {/* Bottom row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px 14px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: 'white', fontWeight: 800,
                        }}>
                            I
                        </div>
                        <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>INSAM-IA</span>
                    </div>
                    <span style={{
                        fontSize: 12, color: '#9ca3af',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <i className="fas fa-clock" style={{ fontSize: 10, color: accentColor }}></i>
                        {video.duration || 'TP'}
                    </span>
                </div>
            </div>
        </Link>
    );
}
