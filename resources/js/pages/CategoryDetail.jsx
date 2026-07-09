import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';

const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

export default function CategoryDetail() {
    const { id } = useParams();
    const { t } = useLang();
    const [category, setCategory] = useState(null);
    const [debouches, setDebouches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get(`/api/public/categories/${id}`),
            api.get(`/api/public/categories/${id}/debouches`),
        ])
            .then(([catRes, debRes]) => {
                setCategory(catRes.data.category || catRes.data.data || catRes.data);
                setDebouches(debRes.data.debouches || debRes.data.data || debRes.data || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: '#5BBCB4', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }}></div>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div style={{ ...W, padding: '80px 24px', textAlign: 'center' }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }}></i>
                <p style={{ color: '#9ca3af', fontSize: 16 }}>Formation introuvable.</p>
                <Link to="/formations" style={{ color: '#5BBCB4', fontWeight: 600, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>&larr; Retour aux formations</Link>
            </div>
        );
    }

    const stats = [
        { icon: 'fas fa-video', value: category.videos_count ?? 0, label: t('categories.videos'), color: '#5BBCB4' },
        { icon: 'fas fa-route', value: category.roadmap_steps_count ?? 0, label: t('categories.roadmap'), color: '#F5A623' },
        { icon: 'fas fa-briefcase', value: category.debouches_count ?? debouches.length, label: t('categories.debouches'), color: '#E74C3C' },
        { icon: 'fas fa-certificate', value: category.certifications_count ?? 0, label: t('categories.certifications'), color: '#1B2A4A' },
    ];

    const actionCards = [
        {
            key: 'videos',
            icon: 'fas fa-play-circle',
            title: 'Videos TP',
            desc: 'Regardez les travaux pratiques et tutoriels video de cette specialite.',
            color: '#5BBCB4',
            bg: '#e8f8f5',
            link: `/formations/${id}/videos`,
            external: true,
        },
        {
            key: 'roadmap',
            icon: 'fas fa-route',
            title: 'Parcours',
            desc: 'Suivez les etapes du parcours recommande pour maitriser cette specialite.',
            color: '#F5A623',
            bg: '#fff8ec',
            link: `/formations/${id}/roadmap`,
            external: true,
        },
        {
            key: 'debouches',
            icon: 'fas fa-briefcase',
            title: 'Debouches',
            desc: 'Decouvrez les metiers et opportunites accessibles apres cette formation.',
            color: '#E74C3C',
            bg: '#fef2f2',
            link: null,
            external: false,
        },
        {
            key: 'certifications',
            icon: 'fas fa-certificate',
            title: 'Certifications',
            desc: 'Consultez les certifications reconnues dans ce domaine.',
            color: '#1B2A4A',
            bg: '#eef0f5',
            link: null,
            external: false,
        },
    ];

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>

            {/* === HERO BANNER === */}
            <section style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #2d4270 50%, #5BBCB4 100%)', padding: '60px 0 50px', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(91,188,180,0.12)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }}></div>

                <div style={W}>
                    {/* Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                        <Link to="/formations" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none', transition: 'color .2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                        >
                            Formations
                        </Link>
                        <i className="fas fa-chevron-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}></i>
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{category.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                        {/* Icon */}
                        <div style={{ width: 88, height: 88, borderRadius: 22, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'white', flexShrink: 0 }}>
                            <i className={category.icon || 'fas fa-laptop-code'}></i>
                        </div>

                        {/* Title & desc */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#5BBCB4', textTransform: 'uppercase', background: 'rgba(91,188,180,0.15)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(91,188,180,0.3)' }}>Specialite</span>
                            </div>
                            <h1 style={{ fontSize: 38, fontWeight: 800, color: 'white', margin: '0 0 14px', lineHeight: 1.2 }}>{category.name}</h1>
                            {category.description && (
                                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, maxWidth: 620, margin: 0 }}>
                                    {category.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* === STATS ROW === */}
            <section style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', zIndex: 10 }}>
                <div style={{ ...W, display: 'flex', justifyContent: 'center', gap: 0 }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{ flex: 1, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 14, borderRight: i < stats.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                            <div style={{ width: 46, height: 46, borderRadius: 12, background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 18, flexShrink: 0 }}>
                                <i className={s.icon}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#1B2A4A', lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* === ACTION CARDS === */}
            <section style={{ padding: '48px 0 0' }}>
                <div style={W}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2A4A', marginBottom: 24 }}>Contenu de la formation</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
                        {actionCards.map((card) => (
                            card.external ? (
                                <Link
                                    key={card.key}
                                    to={card.link}
                                    style={{ background: 'white', borderRadius: 16, padding: '26px 22px', textDecoration: 'none', border: '1px solid #f0f0f0', transition: 'all .2s', display: 'block' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${card.color}22`; e.currentTarget.style.borderColor = card.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{ width: 50, height: 50, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: card.color, marginBottom: 16 }}>
                                        <i className={card.icon}></i>
                                    </div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>{card.title}</h3>
                                    <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.65, margin: 0 }}>{card.desc}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, color: card.color, fontSize: 13, fontWeight: 600 }}>
                                        <span>Acceder</span>
                                        <i className="fas fa-arrow-right" style={{ fontSize: 11 }}></i>
                                    </div>
                                </Link>
                            ) : (
                                <button
                                    key={card.key}
                                    onClick={() => setActiveTab(activeTab === card.key ? null : card.key)}
                                    style={{ background: activeTab === card.key ? `${card.color}08` : 'white', borderRadius: 16, padding: '26px 22px', textAlign: 'left', border: activeTab === card.key ? `1.5px solid ${card.color}` : '1px solid #f0f0f0', transition: 'all .2s', cursor: 'pointer', width: '100%' }}
                                    onMouseEnter={e => { if (activeTab !== card.key) { e.currentTarget.style.boxShadow = `0 8px 28px ${card.color}22`; e.currentTarget.style.borderColor = card.color; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                                    onMouseLeave={e => { if (activeTab !== card.key) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                                >
                                    <div style={{ width: 50, height: 50, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: card.color, marginBottom: 16 }}>
                                        <i className={card.icon}></i>
                                    </div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>{card.title}</h3>
                                    <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.65, margin: 0 }}>{card.desc}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, color: card.color, fontSize: 13, fontWeight: 600 }}>
                                        <span>{activeTab === card.key ? 'Masquer' : 'Afficher'}</span>
                                        <i className={`fas fa-chevron-${activeTab === card.key ? 'up' : 'down'}`} style={{ fontSize: 11 }}></i>
                                    </div>
                                </button>
                            )
                        ))}
                    </div>
                </div>
            </section>

            {/* === DEBOUCHES INLINE PANEL === */}
            {activeTab === 'debouches' && (
                <section style={{ padding: '36px 0 0' }}>
                    <div style={W}>
                        <div style={{ background: 'white', borderRadius: 20, padding: '32px 32px 24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E74C3C', fontSize: 18 }}>
                                    <i className="fas fa-briefcase"></i>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2A4A', margin: 0 }}>Debouches professionnels</h3>
                                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Opportunites accessibles apres cette formation</p>
                                </div>
                            </div>

                            {debouches.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                    <i className="fas fa-folder-open" style={{ fontSize: 36, marginBottom: 12, display: 'block', opacity: 0.4 }}></i>
                                    <p style={{ fontSize: 14 }}>Aucun debouche renseigne pour le moment.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                    {debouches.map((d, i) => (
                                        <div key={d.id || i} style={{ background: '#fafafa', borderRadius: 14, padding: '20px 18px', border: '1px solid #f3f4f6', transition: 'all .2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E74C3C40'; e.currentTarget.style.background = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.background = '#fafafa'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#E74C3C', flexShrink: 0 }}>
                                                    <i className={d.icon || 'fas fa-briefcase'}></i>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1B2A4A', margin: '0 0 6px' }}>{d.title}</h4>
                                                    {d.description && (
                                                        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>{d.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* === CERTIFICATIONS INLINE PANEL === */}
            {activeTab === 'certifications' && (
                <section style={{ padding: '36px 0 0' }}>
                    <div style={W}>
                        <div style={{ background: 'white', borderRadius: 20, padding: '32px 32px 24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eef0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B2A4A', fontSize: 18 }}>
                                    <i className="fas fa-certificate"></i>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2A4A', margin: 0 }}>Certifications reconnues</h3>
                                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0' }}>Diplomes et certifications valorisees dans ce domaine</p>
                                </div>
                            </div>

                            {(!category.certifications || category.certifications.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                                    <i className="fas fa-certificate" style={{ fontSize: 36, marginBottom: 12, display: 'block', opacity: 0.3 }}></i>
                                    <p style={{ fontSize: 14 }}>Aucune certification renseignee pour le moment.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                    {category.certifications.map((c, i) => (
                                        <div key={c.id || i} style={{ background: '#fafafa', borderRadius: 14, padding: '20px 18px', border: '1px solid #f3f4f6' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eef0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#1B2A4A', flexShrink: 0 }}>
                                                    <i className={c.icon || 'fas fa-certificate'}></i>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1B2A4A', margin: '0 0 6px' }}>{c.title || c.name}</h4>
                                                    {c.description && (
                                                        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>{c.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* === DEBOUCHES ALWAYS-VISIBLE SECTION (when not toggled via card) === */}
            {activeTab === null && debouches.length > 0 && (
                <section style={{ padding: '48px 0 0' }}>
                    <div style={W}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2A4A', margin: 0 }}>Debouches professionnels</h2>
                            <span style={{ fontSize: 13, color: '#9ca3af' }}>{debouches.length} metier{debouches.length > 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            {debouches.map((d, i) => (
                                <div key={d.id || i} style={{ background: 'white', borderRadius: 16, padding: '22px 20px', border: '1px solid #f0f0f0', transition: 'all .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(231,76,60,0.1)'; e.currentTarget.style.borderColor = '#E74C3C40'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#E74C3C', flexShrink: 0 }}>
                                            <i className={d.icon || 'fas fa-briefcase'}></i>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1B2A4A', margin: '0 0 6px' }}>{d.title}</h4>
                                            {d.description && (
                                                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>{d.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* === QUICK LINKS FOOTER === */}
            <section style={{ padding: '48px 0 60px' }}>
                <div style={W}>
                    <div style={{ background: 'linear-gradient(135deg, #1B2A4A, #2d4270)', borderRadius: 20, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                        <div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Commencer l'apprentissage</h3>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Acces aux videos TP et au parcours de formation</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Link to={`/formations/${id}/videos`} style={{ background: '#5BBCB4', color: 'white', padding: '12px 26px', borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="fas fa-play-circle"></i>
                                Videos TP
                            </Link>
                            <Link to={`/formations/${id}/roadmap`} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 26px', borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="fas fa-route"></i>
                                Parcours
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
