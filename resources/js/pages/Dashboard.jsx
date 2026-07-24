import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';

const dashCSS = `
.dash-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0; }
.dash-stat-item { display:flex; align-items:center; gap:16px; padding:24px 28px; }
.dash-main-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
.dash-hero-flex { display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; }
.dash-hero-title { font-size:34px; }
.dash-stat-val { font-size:26px; }

@media(max-width:1024px){
  .dash-main-grid { grid-template-columns:1fr 280px; }
  .dash-stats-grid { grid-template-columns:repeat(2,1fr); }
  .dash-stat-item { border-right:none!important; border-bottom:1px solid #f3f4f6; }
}
@media(max-width:768px){
  .dash-main-grid { grid-template-columns:1fr; }
  .dash-stats-grid { grid-template-columns:repeat(2,1fr); }
  .dash-stat-item { padding:16px 20px; }
  .dash-stat-val { font-size:22px; }
  .dash-hero-title { font-size:26px; }
  .dash-hero-flex { flex-direction:column; align-items:flex-start; }
}
@media(max-width:480px){
  .dash-stats-grid { grid-template-columns:1fr; }
  .dash-stat-item { border-right:none!important; border-bottom:1px solid #f3f4f6; }
  .dash-hero-title { font-size:22px; }
}
`;

export default function Dashboard() {
    const { user } = useAuth();
    const { t } = useLang();
    const [recentVideos, setRecentVideos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [loadingFormations, setLoadingFormations] = useState(true);
    const [watchHistory, setWatchHistory] = useState([]);
    const [ueProgress, setUeProgress] = useState([]);
    const [loadingProgress, setLoadingProgress] = useState(true);
    const [statsData, setStatsData] = useState(null);

    useEffect(() => {
        api.get('/api/public/recent-videos')
            .then(r => setRecentVideos(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoadingVideos(false));
        api.get('/api/public/categories')
            .then(r => {
                const all = r.data.data || [];
                // Prioritize categories matching user's filiere
                if (user?.filiere) {
                    const f = user.filiere.toLowerCase();
                    const matching = all.filter(c => c.name.toLowerCase().includes(f) || f.includes(c.name.toLowerCase()));
                    const rest = all.filter(c => !matching.includes(c));
                    setCategories([...matching, ...rest]);
                } else {
                    setCategories(all);
                }
            })
            .catch(() => {});
        // Load watch history from localStorage
        const history = JSON.parse(localStorage.getItem('insam_watch_history') || '[]');
        setWatchHistory(history.slice(0, 5));
        setLoadingFormations(false);
        // Load UE progression data
        api.get('/api/course-progress/ue')
            .then(r => setUeProgress(r.data?.subjects || []))
            .catch(() => {})
            .finally(() => setLoadingProgress(false));
        // Load real stats
        api.get('/api/progress/overview')
            .then(r => setStatsData(r.data?.data || r.data || null))
            .catch(() => {});
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Etudiant';

    const stats = [
        { icon: 'fas fa-clipboard-check', label: 'Quiz completes', value: statsData?.total_quizzes || '0', sub: 'evaluations', color: TEAL, bg: '#e8f8f5' },
        { icon: 'fas fa-book-reader',     label: 'Cours suivis', value: statsData?.total_courses || '0', sub: 'cours lus', color: '#F5A623', bg: '#fff8ec' },
        { icon: 'fas fa-file-alt',        label: 'Sujets consultes', value: statsData?.total_exams || '0', sub: 'sujets d\'examen', color: '#E74C3C', bg: '#fef2f2' },
        { icon: 'fas fa-trophy',          label: 'Score moyen', value: statsData?.avg_score ? `${Math.round(statsData.avg_score)}%` : '0%', sub: 'aux evaluations', color: NAVY, bg: '#f0f4ff' },
    ];

    const quickLinks = [
        { icon: 'fas fa-robot',           label: 'Assistant IA',       sub: 'Posez vos questions 24h/7', to: '/assistant',   color: TEAL,      bg: '#e8f8f5' },
        { icon: 'fas fa-clipboard-check', label: 'Evaluations',        sub: 'Quiz interactifs',          to: '/evaluations', color: '#F5A623', bg: '#fff8ec' },
        { icon: 'fas fa-book',             label: 'Bibliotheque',        sub: 'Sujets, epreuves, corrections',   to: '/bibliotheque', color: '#8B5CF6', bg: '#f5f3ff' },
        { icon: 'fas fa-comments',          label: 'Communaute',          sub: 'Chat entre etudiants',      to: '/communaute',  color: '#10B981', bg: '#ecfdf5' },
        { icon: 'fas fa-graduation-cap',  label: 'Formations',         sub: 'Toutes les specialites',       to: '/formations',  color: NAVY,      bg: '#f0f4ff' },
    ];

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>
            <style>{dashCSS}</style>

            {/* ── HERO WELCOME BANNER ── */}
            <section style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #243758 60%, #2d4470 100%)', padding: '48px 0 52px' }}>
                <div className="dash-hero-flex" style={{ ...W }}>
                    <div>
                        <span style={{ color: TEAL, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>TABLEAU DE BORD</span>
                        <h1 className="dash-hero-title" style={{ fontWeight: 800, color: 'white', margin: '10px 0 8px', lineHeight: 1.2 }}>
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
                <div className="dash-stats-grid" style={{ ...W }}>
                    {stats.map((s, i) => (
                        <div key={i} className="dash-stat-item" style={{
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
                                <div className="dash-stat-val" style={{ fontWeight: 800, color: NAVY, lineHeight: 1 }}>{s.value}</div>
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
                <div className="dash-main-grid">

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

                        {(() => {
                            const f = (user?.filiere || '').toLowerCase();
                            const myCat = f ? categories.find(c => c.name.toLowerCase().includes(f) || f.includes(c.name.toLowerCase())) : null;
                            return myCat ? (
                                <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#e8f8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24, color: TEAL }}>
                                        <i className={myCat.icon || 'fas fa-laptop-code'}></i>
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{myCat.name}</h3>
                                    <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>{myCat.courses_count || 0} cours disponibles</p>
                                    <Link to={`/formations/${myCat.id}`} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                        color: 'white', padding: '11px 24px', borderRadius: 10,
                                        fontWeight: 600, fontSize: 13, textDecoration: 'none',
                                        boxShadow: '0 3px 10px rgba(91,188,180,0.3)',
                                    }}>
                                        <i className="fas fa-book-open"></i> Acceder a mes cours
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', color: '#9ca3af', border: '1px solid #f0f0f0' }}>
                                    <i className="fas fa-book-open" style={{ fontSize: 32, marginBottom: 12, color: '#e5e7eb' }}></i>
                                    <p style={{ fontSize: 14 }}>Vous n'avez pas encore commence de cours.</p>
                                    <p style={{ fontSize: 12, color: '#b0b0b0' }}>Explorez les formations pour commencer vos cours.</p>
                                </div>
                            );
                        })()}
                    </div>

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
                                { icon: 'fas fa-book-reader', text: 'Cours Algorithmes lu', time: 'Il y a 2h', color: TEAL },
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
                        {categories.length > 0 && (() => {
                            const f = (user?.filiere || '').toLowerCase();
                            const mySpecs = f ? categories.filter(c => c.name.toLowerCase().includes(f) || f.includes(c.name.toLowerCase())) : [];
                            const displayCats = mySpecs.length > 0 ? mySpecs : categories.slice(0, 4);
                            return (
                            <div style={{ background: 'white', borderRadius: 16, padding: 22, border: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>
                                        <i className="fas fa-graduation-cap" style={{ color: TEAL, marginRight: 8 }}></i>
                                        {mySpecs.length > 0 ? 'Ma specialite' : 'Specialites disponibles'}
                                    </h3>
                                    <Link to="/formations" style={{ fontSize: 11, color: TEAL, fontWeight: 600, textDecoration: 'none' }}>Voir tout</Link>
                                </div>
                                {displayCats.slice(0, 4).map((cat, i) => (
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
                            );
                        })()}
                    </div>
                </div>

                {/* ── PROGRESSION PAR UE ── */}
                <div style={{ marginTop: 36 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>
                            <i className="fas fa-chart-line" style={{ color: TEAL, marginRight: 8, fontSize: 16 }}></i>
                            Progression par UE
                        </h2>
                        <Link to="/progression" style={{ color: TEAL, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                            Voir tout &rarr;
                        </Link>
                    </div>

                    {loadingProgress ? (
                        <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', color: '#9ca3af', border: '1px solid #f0f0f0' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12 }}></i>
                            <p>Chargement de la progression...</p>
                        </div>
                    ) : ueProgress.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                            {ueProgress.slice(0, 6).map((ue, i) => {
                                const readPct = Math.round(ue.course_progress || 0);
                                const quizPct = Math.round(ue.quiz_progress || ue.avg_score || 0);
                                return (
                                    <div key={i} style={{
                                        background: 'white', borderRadius: 14, padding: '18px 20px',
                                        border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <h3 style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {ue.subject || ue.name || 'UE'}
                                            </h3>
                                            <span style={{
                                                fontSize: 11, fontWeight: 700, color: readPct >= 80 ? '#10b981' : readPct >= 50 ? '#f59e0b' : '#ef4444',
                                                background: readPct >= 80 ? '#d1fae5' : readPct >= 50 ? '#fef3c7' : '#fee2e2',
                                                padding: '2px 8px', borderRadius: 6, flexShrink: 0, marginLeft: 8,
                                            }}>
                                                {readPct}%
                                            </span>
                                        </div>
                                        {/* Lecture progress */}
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                                                    <i className="fas fa-book-reader" style={{ marginRight: 4, color: TEAL }}></i>Lecture
                                                </span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: TEAL }}>{readPct}%</span>
                                            </div>
                                            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${readPct}%`, height: '100%', background: `linear-gradient(90deg, ${TEAL}, #3da89e)`, borderRadius: 3, transition: 'width 0.5s' }}></div>
                                            </div>
                                        </div>
                                        {/* Quiz progress */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                                                    <i className="fas fa-clipboard-check" style={{ marginRight: 4, color: '#f59e0b' }}></i>Quiz
                                                </span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>{quizPct}%</span>
                                            </div>
                                            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${quizPct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: 3, transition: 'width 0.5s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', color: '#9ca3af', border: '1px solid #f0f0f0' }}>
                            <i className="fas fa-chart-bar" style={{ fontSize: 32, marginBottom: 12, color: '#e5e7eb' }}></i>
                            <p style={{ fontSize: 14 }}>Aucune donnee de progression.</p>
                            <p style={{ fontSize: 12, color: '#b0b0b0' }}>Completez des quiz et des cours pour voir votre progression.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
