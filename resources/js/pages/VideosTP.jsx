import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const FILIERE_COLORS = {
    'Agriculture': { bg: '#ecfdf5', color: '#059669', icon: 'fas fa-seedling' },
    'Informatique': { bg: '#eff6ff', color: '#3b82f6', icon: 'fas fa-laptop-code' },
    'Electrique': { bg: '#fff7ed', color: '#f97316', icon: 'fas fa-bolt' },
    'Genie Civil': { bg: '#faf5ff', color: '#8b5cf6', icon: 'fas fa-hard-hat' },
    'Mecanique': { bg: '#f0fdf4', color: '#16a34a', icon: 'fas fa-cogs' },
    'Commerce': { bg: '#fefce8', color: '#ca8a04', icon: 'fas fa-briefcase' },
    'Art': { bg: '#fdf2f8', color: '#db2777', icon: 'fas fa-palette' },
    'Sante': { bg: '#fff1f2', color: '#e11d48', icon: 'fas fa-heartbeat' },
};

const getFiliereStyle = (name) => {
    for (const [key, style] of Object.entries(FILIERE_COLORS)) {
        if (name?.toLowerCase().includes(key.toLowerCase())) return style;
    }
    return { bg: '#f3f4f6', color: '#6b7280', icon: 'fas fa-graduation-cap' };
};

const gradients = [
    'linear-gradient(135deg, #5BBCB4, #1B2A4A)',
    'linear-gradient(135deg, #1B2A4A, #5BBCB4)',
    'linear-gradient(135deg, #3da89e, #2d4270)',
    'linear-gradient(135deg, #2d4270, #3da89e)',
    'linear-gradient(135deg, #5BBCB4, #3da89e)',
    'linear-gradient(135deg, #1B2A4A, #3a5298)',
];

const css = `
.vtp-filieres { display:flex; gap:10px; flex-wrap:wrap; }
.vtp-filiere-pill { padding:8px 16px; border-radius:30px; border:1.5px solid transparent; cursor:pointer; font-size:13px; font-weight:600; transition:all .2s; display:flex; align-items:center; gap:7px; }
.vtp-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
@media(max-width:1024px){ .vtp-grid4 { grid-template-columns:repeat(3,1fr); } }
@media(max-width:768px){ .vtp-grid4 { grid-template-columns:repeat(2,1fr); } }
@media(max-width:480px){ .vtp-grid4 { grid-template-columns:1fr; } }
@keyframes spin { to { transform: rotate(360deg); } }
`;

export default function VideosTP() {
    const [allVideos, setAllVideos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedFiliere, setSelectedFiliere] = useState('');
    const [expandedFiliere, setExpandedFiliere] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/api/public/videos').catch(() => ({ data: { data: [] } })),
            api.get('/api/public/categories').catch(() => ({ data: { data: [] } })),
        ]).then(([vidRes, catRes]) => {
            setAllVideos(vidRes.data?.data || vidRes.data || []);
            setCategories(catRes.data?.data || []);
        }).finally(() => setLoading(false));
    }, []);

    // Build: { filiere_name → { categories → [videos] } }
    const catById = {};
    categories.forEach(c => { catById[c.id] = c; });

    const filiereGroups = {};
    allVideos.forEach(v => {
        const cat = catById[v.category_id];
        const filiere = cat?.filiere_name || 'Autres';
        const catName = cat?.name || 'Autre spécialité';
        if (!filiereGroups[filiere]) filiereGroups[filiere] = {};
        if (!filiereGroups[filiere][catName]) filiereGroups[filiere][catName] = { cat, videos: [] };
        filiereGroups[filiere][catName].videos.push(v);
    });

    const filiereNames = Object.keys(filiereGroups).sort((a, b) => a.localeCompare(b, 'fr'));

    const filtered = (videos) => videos.filter(v =>
        !search || v.title?.toLowerCase().includes(search.toLowerCase())
    );

    const visibleFilieres = selectedFiliere ? [selectedFiliere] : filiereNames;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }}></div>
                <span style={{ color: '#9ca3af', fontSize: 14 }}>Chargement des videos...</span>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>
            <style>{css}</style>

            {/* Header */}
            <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #263d6b 100%)`, padding: '44px 0 36px' }}>
                <div style={W}>
                    <Link to="/formations" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13, fontWeight: 500, marginBottom: 18 }}>
                        <i className="fas fa-arrow-left"></i> Formations
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                        <div>
                            <p style={{ color: TEAL, fontWeight: 700, fontSize: 12, letterSpacing: 1, margin: '0 0 8px' }}>VIDEOS TP</p>
                            <h1 style={{ fontSize: 30, fontWeight: 800, color: 'white', margin: '0 0 8px', lineHeight: 1.2 }}>
                                Travaux Pratiques
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0 }}>
                                {allVideos.length} video{allVideos.length !== 1 ? 's' : ''} classees par filiere
                            </p>
                        </div>
                        {/* Search */}
                        <div style={{ position: 'relative', minWidth: 260 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}></i>
                            <input
                                type="text"
                                placeholder="Rechercher une video..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                                    borderRadius: 30, border: '1.5px solid rgba(255,255,255,0.2)',
                                    fontSize: 14, color: 'white', background: 'rgba(255,255,255,0.1)',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = TEAL}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Filière filter pills */}
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '14px 0' }}>
                <div style={{ ...W }}>
                    <div className="vtp-filieres">
                        <button
                            className="vtp-filiere-pill"
                            onClick={() => setSelectedFiliere('')}
                            style={{
                                background: !selectedFiliere ? NAVY : '#f3f4f6',
                                color: !selectedFiliere ? 'white' : '#374151',
                                borderColor: !selectedFiliere ? NAVY : 'transparent',
                            }}
                        >
                            <i className="fas fa-th"></i> Toutes
                        </button>
                        {filiereNames.map(f => {
                            const style = getFiliereStyle(f);
                            const isActive = selectedFiliere === f;
                            return (
                                <button
                                    key={f}
                                    className="vtp-filiere-pill"
                                    onClick={() => setSelectedFiliere(isActive ? '' : f)}
                                    style={{
                                        background: isActive ? style.color : style.bg,
                                        color: isActive ? 'white' : style.color,
                                        borderColor: isActive ? style.color : 'transparent',
                                    }}
                                >
                                    <i className={style.icon}></i>{f}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ ...W, padding: '32px 24px 60px' }}>
                {visibleFilieres.map(filiere => {
                    const fStyle = getFiliereStyle(filiere);
                    const cats = filiereGroups[filiere] || {};
                    const totalVideos = Object.values(cats).reduce((s, c) => s + c.videos.length, 0);
                    const isExpanded = expandedFiliere === filiere || selectedFiliere === filiere;

                    return (
                        <div key={filiere} style={{ marginBottom: 32, background: 'white', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                            {/* Filière header */}
                            <button
                                onClick={() => setExpandedFiliere(isExpanded && !selectedFiliere ? null : filiere)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '18px 22px', border: 'none', background: fStyle.bg,
                                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                                    borderBottom: isExpanded ? `1px solid ${fStyle.color}20` : 'none',
                                }}
                            >
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12, background: fStyle.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 18, color: 'white', flexShrink: 0,
                                }}>
                                    <i className={fStyle.icon}></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{filiere}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                        {Object.keys(cats).length} spécialité{Object.keys(cats).length > 1 ? 's' : ''} · {totalVideos} video{totalVideos > 1 ? 's' : ''}
                                    </div>
                                </div>
                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: 12, color: fStyle.color }}></i>
                            </button>

                            {/* Categories & videos */}
                            {isExpanded && (
                                <div style={{ padding: '20px 22px' }}>
                                    {Object.entries(cats).map(([catName, { cat, videos }]) => {
                                        const fv = filtered(videos);
                                        if (fv.length === 0 && search) return null;
                                        return (
                                            <div key={catName} style={{ marginBottom: 24 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                                    <div style={{ width: 3, height: 18, borderRadius: 2, background: fStyle.color }}></div>
                                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0 }}>{catName}</h3>
                                                    <span style={{ fontSize: 11, background: `${fStyle.color}15`, color: fStyle.color, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                                                        {fv.length} video{fv.length > 1 ? 's' : ''}
                                                    </span>
                                                    {cat && (
                                                        <Link to={`/formations/${cat.id}/videos`} style={{ marginLeft: 'auto', fontSize: 11, color: TEAL, fontWeight: 600, textDecoration: 'none' }}>
                                                            Voir tout &rarr;
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="vtp-grid4">
                                                    {fv.slice(0, 8).map((v, i) => (
                                                        <Link
                                                            key={v.id}
                                                            to={`/video/${v.id}`}
                                                            style={{
                                                                background: 'white', borderRadius: 14, overflow: 'hidden',
                                                                textDecoration: 'none', border: '1px solid #f0f0f0',
                                                                transition: 'all .2s', display: 'flex', flexDirection: 'column',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(91,188,180,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                                                        >
                                                            <div style={{ height: 120, background: gradients[i % gradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <i className="fas fa-play" style={{ fontSize: 16, color: 'white', marginLeft: 3 }}></i>
                                                                </div>
                                                                {v.duration && (
                                                                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5 }}>
                                                                        {v.duration}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ padding: '12px 14px 10px', flex: 1 }}>
                                                                <h4 style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                    {v.title}
                                                                </h4>
                                                                <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <i className="fas fa-eye" style={{ fontSize: 9 }}></i>
                                                                    {(v.views_count || 0).toLocaleString('fr-FR')}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                                {fv.length > 8 && (
                                                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                                                        <Link to={cat ? `/formations/${cat.id}/videos` : '#'} style={{
                                                            fontSize: 12, color: TEAL, fontWeight: 600, textDecoration: 'none',
                                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                                        }}>
                                                            <i className="fas fa-plus-circle"></i> Voir les {fv.length - 8} autres videos
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

                {visibleFilieres.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 16, border: '1px solid #f0f0f0' }}>
                        <i className="fas fa-video-slash" style={{ fontSize: 48, color: '#e5e7eb', marginBottom: 16, display: 'block' }}></i>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Aucune video disponible</h3>
                        <p style={{ fontSize: 14, color: '#9ca3af' }}>Les videos TP seront disponibles bientot.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
