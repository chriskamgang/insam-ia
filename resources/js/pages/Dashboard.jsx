import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';

export default function Dashboard() {
    const { user } = useAuth();
    const { t } = useLang();
    const [recentVideos, setRecentVideos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [formations, setFormations] = useState([]);
    const [formationsCat, setFormationsCat] = useState(null);
    const [loadingFormations, setLoadingFormations] = useState(true);

    useEffect(() => {
        api.get('/api/public/recent-videos')
            .then(r => setRecentVideos(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoadingVideos(false));
        api.get('/api/public/categories')
            .then(r => setCategories(r.data.data || []))
            .catch(() => {});
        api.get('/api/my-formations')
            .then(r => {
                setFormations(r.data.formations || []);
                setFormationsCat(r.data.category || null);
            })
            .catch(() => {})
            .finally(() => setLoadingFormations(false));
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Etudiant';

    const stats = [
        { icon: 'fas fa-clipboard-check', label: 'Quiz completes', value: '3', sub: 'evaluations', color: TEAL, bg: '#e8f8f5' },
        { icon: 'fas fa-play-circle',     label: 'Videos regardees', value: '12', sub: 'videos TP', color: '#F5A623', bg: '#fff8ec' },
        { icon: 'fas fa-file-alt',        label: 'Sujets consultes', value: '7', sub: 'sujets d\'examen', color: '#E74C3C', bg: '#fef2f2' },
        { icon: 'fas fa-trophy',          label: 'Score moyen', value: '76%', sub: 'aux evaluations', color: NAVY, bg: '#f0f4ff' },
    ];

    const quickLinks = [
        { icon: 'fas fa-robot',           label: 'Assistant IA',       sub: 'Posez vos questions 24h/7', to: '/assistant',   color: TEAL,      bg: '#e8f8f5' },
        { icon: 'fas fa-clipboard-check', label: 'Evaluations',        sub: 'Quiz interactifs',          to: '/evaluations', color: '#F5A623', bg: '#fff8ec' },
        { icon: 'fas fa-file-alt',        label: "Sujets d'examens",   sub: 'Par filiere et niveau',     to: '/sujets',      color: '#E74C3C', bg: '#fef2f2' },
        { icon: 'fas fa-book',             label: 'Bibliotheque',        sub: 'Cours, videos, epreuves',   to: '/bibliotheque', color: '#8B5CF6', bg: '#f5f3ff' },
        { icon: 'fas fa-comments',          label: 'Communaute',          sub: 'Chat entre etudiants',      to: '/communaute',  color: '#10B981', bg: '#ecfdf5' },
        { icon: 'fas fa-graduation-cap',  label: 'Formations',         sub: 'Toutes les filieres',       to: '/formations',  color: NAVY,      bg: '#f0f4ff' },
    ];

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>

            {/* ── HERO WELCOME BANNER ── */}
            <section style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #243758 60%, #2d4470 100%)', padding: '48px 0 52px' }}>
                <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ color: TEAL, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>TABLEAU DE BORD</span>
                        <h1 style={{ fontSize: 34, fontWeight: 800, color: 'white', margin: '10px 0 8px', lineHeight: 1.2 }}>
                            Bon retour, <span style={{ color: TEAL }}>{firstName}</span> !
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, maxWidth: 480 }}>
                            Pret pour votre prochaine lecon ? Continuez votre apprentissage la ou vous vous etes arrete.
                        </p>
                    </div>

                    <Link to="/assistant" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: TEAL, color: 'white',
                        padding: '14px 26px', borderRadius: 50,
                        fontWeight: 700, textDecoration: 'none', fontSize: 14,
                        boxShadow: '0 4px 16px rgba(91,188,180,0.35)',
                        transition: 'all .2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <i className="fas fa-robot"></i>
                        Ouvrir l'Assistant IA
                    </Link>
                </div>
            </section>

            {/* ── STATS STRIP ── */}
            <section style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ ...W, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '24px 28px',
                            borderRight: i < stats.length - 1 ? '1px solid #f3f4f6' : 'none',
                        }}>
                            <div style={{
                                width: 50, height: 50, borderRadius: 14,
                                background: s.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, color: s.color, flexShrink: 0,
                            }}>
                                <i className={s.icon}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{s.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div style={{ ...W, marginTop: 36 }}>

                {/* ── QUICK LINKS ── */}
                <div style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 18 }}>
                        <i className="fas fa-bolt" style={{ color: TEAL, marginRight: 8, fontSize: 16 }}></i>
                        Acces rapide
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {quickLinks.map((lk, i) => (
                            <Link key={i} to={lk.to} style={{
                                background: 'white', borderRadius: 16,
                                padding: '22px 20px',
                                textDecoration: 'none',
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                display: 'flex', alignItems: 'center', gap: 14,
                                transition: 'all .2s',
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(91,188,180,0.12)';
                                    e.currentTarget.style.borderColor = TEAL;
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                                    e.currentTarget.style.borderColor = '#f0f0f0';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    width: 46, height: 46, borderRadius: 12,
                                    background: lk.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, color: lk.color, flexShrink: 0,
                                }}>
                                    <i className={lk.icon}></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{lk.label}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{lk.sub}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── MAIN CONTENT: Recent Videos + Progress ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

                    {/* Recent Videos */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>
                                <i className="fas fa-play-circle" style={{ color: TEAL, marginRight: 8, fontSize: 16 }}></i>
                                Derniers cours
                            </h2>
                            <Link to="/formations" style={{ color: TEAL, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                                Voir tout &rarr;
                            </Link>
                        </div>

                        {loadingVideos ? (
                            <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', color: '#9ca3af', border: '1px solid #f0f0f0' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12 }}></i>
                                <p>Chargement...</p>
                            </div>
                        ) : recentVideos.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', color: '#9ca3af', border: '1px solid #f0f0f0' }}>
                                <i className="fas fa-video" style={{ fontSize: 32, marginBottom: 12, color: '#e5e7eb' }}></i>
                                <p style={{ fontSize: 14 }}>Aucune video disponible pour le moment.</p>
                                <Link to="/formations" style={{ display: 'inline-block', marginTop: 12, color: TEAL, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                                    Explorer les formations &rarr;
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {recentVideos.slice(0, 4).map(v => (
                                    <Link to={`/video/${v.id}`} key={v.id} style={{
                                        background: 'white', borderRadius: 14,
                                        overflow: 'hidden', textDecoration: 'none',
                                        border: '1px solid #f0f0f0',
                                        transition: 'all .2s',
                                    }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(91,188,180,0.12)';
                                            e.currentTarget.style.borderColor = TEAL;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.borderColor = '#f0f0f0';
                                        }}
                                    >
                                        <div style={{
                                            height: 110,
                                            background: 'linear-gradient(135deg, #5BBCB440 0%, #1B2A4A30 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 28, color: TEAL,
                                        }}>
                                            <i className="fas fa-play-circle"></i>
                                        </div>
                                        <div style={{ padding: '12px 14px' }}>
                                            {v.category_name && (
                                                <span style={{ fontSize: 10, background: '#e8f8f5', color: TEAL, padding: '3px 8px', borderRadius: 4, fontWeight: 600, display: 'inline-block', marginBottom: 6 }}>
                                                    {v.category_name}
                                                </span>
                                            )}
                                            <h3 style={{ fontSize: 13, fontWeight: 700, color: NAVY, lineHeight: 1.4, marginBottom: 6 }}>
                                                {v.title}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: 11 }}>
                                                <span><i className="fas fa-eye" style={{ marginRight: 3 }}></i>{v.views_count || 0}</span>
                                                {v.duration && <span><i className="fas fa-clock" style={{ marginRight: 3 }}></i>{v.duration}</span>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Formations InsamTechs for user's filière */}
                    {!loadingFormations && formations.length > 0 && (
                        <div style={{ gridColumn: '1 / -1', marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>
                                    <i className="fas fa-graduation-cap" style={{ color: TEAL, marginRight: 8, fontSize: 16 }}></i>
                                    Cours de votre filiere {formationsCat ? `- ${formationsCat.name}` : ''}
                                </h2>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {formations.map((f, fi) => (
                                    <div key={fi} style={{
                                        background: 'white', borderRadius: 16, overflow: 'hidden',
                                        border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                    }}>
                                        <div style={{
                                            height: 100,
                                            background: `linear-gradient(135deg, ${TEAL}30, ${NAVY}20)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative',
                                        }}>
                                            {f.img ? (
                                                <img src={f.img} alt={f.intitule} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                     onError={e => { e.target.style.display = 'none'; }} />
                                            ) : (
                                                <i className="fas fa-book-open" style={{ fontSize: 28, color: TEAL }}></i>
                                            )}
                                        </div>
                                        <div style={{ padding: '14px 16px' }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 6, lineHeight: 1.4, textTransform: 'capitalize' }}>
                                                {f.intitule || 'Formation'}
                                            </h3>
                                            {f.chapitres && f.chapitres.length > 0 && (
                                                <div style={{ marginTop: 8 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                                                        {f.chapitres.length} chapitre{f.chapitres.length > 1 ? 's' : ''}
                                                    </div>
                                                    {f.chapitres.slice(0, 3).map((ch, ci) => (
                                                        <div key={ci} style={{ marginBottom: 4 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 2, textTransform: 'capitalize' }}>
                                                                {ch.intitule}
                                                            </div>
                                                            {ch.videos && ch.videos.slice(0, 2).map((vid, vi) => (
                                                                <a
                                                                    key={vi}
                                                                    href={vid.lien || '#'}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                                        padding: '4px 8px', marginLeft: 8,
                                                                        fontSize: 11, color: TEAL, textDecoration: 'none',
                                                                        borderRadius: 6,
                                                                        transition: 'background .15s',
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = '#e8f8f5'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <i className="fas fa-play-circle" style={{ fontSize: 10 }}></i>
                                                                    <span style={{ textTransform: 'capitalize' }}>{vid.intitule || 'Video'}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    ))}
                                                    {f.chapitres.length > 3 && (
                                                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                                            +{f.chapitres.length - 3} autres chapitres...
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* User profile card */}
                        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #5BBCB4, #1B2A4A)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 24, fontWeight: 800,
                                margin: '0 auto 14px',
                            }}>
                                {firstName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{user?.name || 'Etudiant'}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{user?.email || ''}</div>
                            {(user?.filiere || user?.niveau) && (
                                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    {user.filiere && (
                                        <span style={{ fontSize: 10, background: '#e8f8f5', color: TEAL, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                                            {user.filiere}
                                        </span>
                                    )}
                                    {user.niveau && (
                                        <span style={{ fontSize: 10, background: '#f0f4ff', color: NAVY, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                                            {user.niveau}
                                        </span>
                                    )}
                                </div>
                            )}
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'center', gap: 20 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>3</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Quiz</div>
                                </div>
                                <div style={{ width: 1, background: '#f3f4f6' }}></div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>12</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Videos</div>
                                </div>
                                <div style={{ width: 1, background: '#f3f4f6' }}></div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: TEAL }}>76%</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Score</div>
                                </div>
                            </div>
                            <Link to="/profil" style={{
                                display: 'block', marginTop: 16,
                                padding: '10px', borderRadius: 10,
                                background: '#f8fafb', color: NAVY,
                                fontSize: 13, fontWeight: 600,
                                textDecoration: 'none', border: '1px solid #f0f0f0',
                                transition: 'all .2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = TEAL; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.color = NAVY; }}
                            >
                                <i className="fas fa-user-cog" style={{ marginRight: 6 }}></i>Mon profil
                            </Link>
                        </div>

                        {/* Activite recente placeholder */}
                        <div style={{ background: 'white', borderRadius: 16, padding: 22, border: '1px solid #f0f0f0' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 16 }}>
                                <i className="fas fa-history" style={{ color: TEAL, marginRight: 8 }}></i>
                                Activite recente
                            </h3>
                            {[
                                { icon: 'fas fa-play-circle', text: 'Video TP Python regardee', time: 'Il y a 2h', color: TEAL },
                                { icon: 'fas fa-clipboard-check', text: 'Quiz Algorithmes complete', time: 'Hier', color: '#F5A623' },
                                { icon: 'fas fa-file-alt', text: 'Sujet examen consulte', time: 'Il y a 3j', color: '#E74C3C' },
                                { icon: 'fas fa-robot', text: 'Session Assistant IA', time: 'Il y a 5j', color: NAVY },
                            ].map((a, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 0',
                                    borderBottom: i < 3 ? '1px solid #f9fafb' : 'none',
                                }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: 10,
                                        background: `${a.color}12`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, color: a.color, flexShrink: 0,
                                    }}>
                                        <i className={a.icon}></i>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.text}</div>
                                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{a.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formations disponibles */}
                        {categories.length > 0 && (
                            <div style={{ background: 'white', borderRadius: 16, padding: 22, border: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>
                                        <i className="fas fa-graduation-cap" style={{ color: TEAL, marginRight: 8 }}></i>
                                        Mes filieres
                                    </h3>
                                    <Link to="/formations" style={{ fontSize: 11, color: TEAL, fontWeight: 600, textDecoration: 'none' }}>Voir tout</Link>
                                </div>
                                {categories.slice(0, 4).map((cat, i) => (
                                    <Link key={cat.id} to={`/formations/${cat.id}`} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '9px 0',
                                        borderBottom: i < Math.min(categories.length, 4) - 1 ? '1px solid #f9fafb' : 'none',
                                        textDecoration: 'none',
                                        transition: 'all .15s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.paddingLeft = '4px'}
                                        onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: '#e8f8f5',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, color: TEAL, flexShrink: 0,
                                        }}>
                                            <i className={cat.icon || 'fas fa-laptop-code'}></i>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</div>
                                            {cat.videos_count > 0 && <div style={{ fontSize: 11, color: '#9ca3af' }}>{cat.videos_count} video{cat.videos_count > 1 ? 's' : ''}</div>}
                                        </div>
                                        <i className="fas fa-chevron-right" style={{ fontSize: 10, color: '#d1d5db' }}></i>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
