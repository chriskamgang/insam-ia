import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';

const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

export default function CategoryVideos() {
    const { id } = useParams();
    const { t } = useLang();
    const [category, setCategory] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get(`/api/public/categories/${id}`),
            api.get(`/api/public/categories/${id}/videos`),
        ])
            .then(([catRes, vidRes]) => {
                setCategory(catRes.data.data || catRes.data);
                setVideos(vidRes.data.data || vidRes.data || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    const filtered = videos.filter(v =>
        !search || v.title?.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase())
    );

    // Gradient palettes for thumbnail placeholders
    const gradients = [
        'linear-gradient(135deg, #5BBCB4, #1B2A4A)',
        'linear-gradient(135deg, #1B2A4A, #5BBCB4)',
        'linear-gradient(135deg, #3da89e, #2d4270)',
        'linear-gradient(135deg, #2d4270, #3da89e)',
        'linear-gradient(135deg, #5BBCB4, #3da89e)',
        'linear-gradient(135deg, #1B2A4A, #3a5298)',
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: '#5BBCB4', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }}></div>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</span>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>

            {/* === TOP BAR === */}
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ ...W, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to={`/formations/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5BBCB4', fontWeight: 600, textDecoration: 'none', fontSize: 14, padding: '8px 16px', borderRadius: 50, border: '1.5px solid #5BBCB4', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#5BBCB4'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5BBCB4'; }}
                    >
                        <i className="fas fa-arrow-left" style={{ fontSize: 12 }}></i>
                        {category ? category.name : 'Formation'}
                    </Link>
                    <i className="fas fa-chevron-right" style={{ fontSize: 11, color: '#d1d5db' }}></i>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>Videos TP</span>
                </div>
            </div>

            {/* === HEADER === */}
            <section style={{ background: 'linear-gradient(165deg, #e6faf8 0%, #f0fdfa 50%, #fff 100%)', padding: '44px 0 36px' }}>
                <div style={W}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg, #5BBCB4, #3da89e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white' }}>
                                    <i className={category?.icon || 'fas fa-play-circle'}></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: '#5BBCB4', textTransform: 'uppercase' }}>Videos TP</span>
                                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1B2A4A', margin: 0, lineHeight: 1.2 }}>
                                        {category ? category.name : 'Formation'}
                                    </h1>
                                </div>
                            </div>
                            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                                <strong style={{ color: '#1B2A4A' }}>{filtered.length}</strong> video{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
                                {search && <span> pour "<em>{search}</em>"</span>}
                            </p>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', minWidth: 280 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}></i>
                            <input
                                type="text"
                                placeholder="Rechercher une video..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 50, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#1B2A4A', background: 'white', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }}
                                onFocus={e => e.target.style.borderColor = '#5BBCB4'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 0 }}>
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* === VIDEO GRID === */}
            <section style={{ padding: '36px 0 60px' }}>
                <div style={W}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 20, border: '1px solid #f0f0f0' }}>
                            <i className="fas fa-video-slash" style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16, display: 'block' }}></i>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>
                                {search ? 'Aucune video trouvee' : 'Aucune video disponible'}
                            </h3>
                            <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 auto', maxWidth: 320 }}>
                                {search ? `Aucun resultat pour "${search}". Essayez un autre mot-cle.` : 'Les videos TP de cette formation seront disponibles bientot.'}
                            </p>
                            {search && (
                                <button onClick={() => setSearch('')} style={{ marginTop: 20, background: '#5BBCB4', color: 'white', border: 'none', borderRadius: 50, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                                    Voir toutes les videos
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                            {filtered.map((v, i) => (
                                <Link
                                    key={v.id}
                                    to={`/video/${v.id}`}
                                    style={{ background: 'white', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', border: '1px solid #f0f0f0', transition: 'all .22s', display: 'flex', flexDirection: 'column' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 32px rgba(91,188,180,0.14)'; e.currentTarget.style.borderColor = '#5BBCB440'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    {/* Thumbnail */}
                                    <div style={{ height: 148, background: gradients[i % gradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                        {/* Decorative pattern */}
                                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}></div>
                                        <div style={{ position: 'absolute', bottom: -30, left: -15, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>

                                        {/* Play button */}
                                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', position: 'relative', zIndex: 1 }}>
                                            <i className="fas fa-play" style={{ fontSize: 18, color: 'white', marginLeft: 3 }}></i>
                                        </div>

                                        {/* Duration badge */}
                                        {v.duration && (
                                            <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: 'white', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                                                <i className="fas fa-clock" style={{ marginRight: 4, fontSize: 10 }}></i>
                                                {v.duration}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {/* Tags row */}
                                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                            {v.is_new && (
                                                <span style={{ fontSize: 10, background: '#e8f8f5', color: '#5BBCB4', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>NOUVEAU</span>
                                            )}
                                            {v.level && (
                                                <span style={{ fontSize: 10, background: '#f3f4f6', color: '#6b7280', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{v.level}</span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2A4A', margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {v.title}
                                        </h3>

                                        {/* Description */}
                                        {v.description && (
                                            <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                                                {v.description}
                                            </p>
                                        )}

                                        {/* Footer: views + arrow */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af' }}>
                                                <i className="fas fa-eye" style={{ fontSize: 11 }}></i>
                                                <span style={{ fontSize: 12 }}>{(v.views_count || 0).toLocaleString('fr-FR')}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#5BBCB4', fontSize: 12, fontWeight: 600 }}>
                                                <span>Voir</span>
                                                <i className="fas fa-arrow-right" style={{ fontSize: 10 }}></i>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
