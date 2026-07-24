import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };
const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const css = `
.db-grid { display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:start; }
.db-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.db-quick { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.db-courses { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
@media(max-width:1024px){
  .db-grid { grid-template-columns:1fr 280px; }
  .db-stats { grid-template-columns:repeat(2,1fr); }
}
@media(max-width:768px){
  .db-grid { grid-template-columns:1fr; }
  .db-stats { grid-template-columns:repeat(2,1fr); }
  .db-quick { grid-template-columns:repeat(2,1fr); }
  .db-courses { grid-template-columns:1fr; }
}
@media(max-width:480px){
  .db-stats { grid-template-columns:1fr; }
  .db-quick { grid-template-columns:1fr; }
}
`;

export default function Dashboard() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [statsData, setStatsData] = useState(null);
    const [myCourses, setMyCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    const firstName = user?.name?.split(' ')[0] || 'Etudiant';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir';

    useEffect(() => {
        api.get('/api/public/categories')
            .then(r => setCategories(r.data.data || []))
            .catch(() => {});
        api.get('/api/progress/overview')
            .then(r => setStatsData(r.data?.data || r.data || null))
            .catch(() => {});
    }, []);

    // Load courses for user's specialty
    useEffect(() => {
        if (!categories.length || !user?.filiere) { setLoadingCourses(false); return; }
        const myCat = categories.find(c => norm(c.name).includes(norm(user.filiere)) || norm(user.filiere).includes(norm(c.name)));
        if (myCat) {
            api.get(`/api/public/categories/${myCat.id}/cours`)
                .then(r => setMyCourses(r.data.ues || []))
                .catch(() => {})
                .finally(() => setLoadingCourses(false));
        } else {
            setLoadingCourses(false);
        }
    }, [categories, user?.filiere]);

    const myCat = user?.filiere ? categories.find(c => norm(c.name).includes(norm(user.filiere)) || norm(user.filiere).includes(norm(c.name))) : null;

    const stats = [
        { icon: 'fas fa-book-open', value: myCourses.reduce((s, ue) => s + (ue.knowledge_documents?.length || 0), 0), label: 'Cours disponibles', color: TEAL, bg: '#e8f8f5' },
        { icon: 'fas fa-layer-group', value: myCourses.length, label: 'Unites d\'enseignement', color: '#8B5CF6', bg: '#f5f3ff' },
        { icon: 'fas fa-clipboard-check', value: statsData?.total_quizzes || 0, label: 'Quiz completes', color: '#F5A623', bg: '#fff8ec' },
        { icon: 'fas fa-trophy', value: statsData?.avg_score ? `${Math.round(statsData.avg_score)}%` : '—', label: 'Score moyen', color: '#E74C3C', bg: '#fef2f2' },
    ];

    const quickActions = [
        { icon: 'fas fa-robot', label: 'Assistant IA', to: '/assistant', color: TEAL, bg: 'linear-gradient(135deg, #e8f8f5, #d1f2ed)' },
        { icon: 'fas fa-file-alt', label: 'Epreuves', to: '/bibliotheque', color: '#8B5CF6', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
        { icon: 'fas fa-clipboard-check', label: 'Evaluations', to: '/evaluations', color: '#F5A623', bg: 'linear-gradient(135deg, #fff8ec, #fef3c7)' },
        { icon: 'fas fa-comments', label: 'Communaute', to: '/communaute', color: '#10B981', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
        { icon: 'fas fa-graduation-cap', label: 'Formations', to: '/formations', color: NAVY, bg: 'linear-gradient(135deg, #f0f4ff, #e0e7ff)' },
        { icon: 'fas fa-chart-line', label: 'Progression', to: '/progression', color: '#E74C3C', bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)' },
    ];

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>
            <style>{css}</style>

            {/* Hero */}
            <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #243758 60%, #2d4470 100%)`, padding: '40px 0 44px' }}>
                <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <p style={{ color: TEAL, fontWeight: 700, fontSize: 13, letterSpacing: 1, margin: '0 0 8px' }}>TABLEAU DE BORD</p>
                        <h1 style={{ fontSize: 30, fontWeight: 800, color: 'white', margin: '0 0 6px', lineHeight: 1.2 }}>
                            {greeting}, <span style={{ color: TEAL }}>{firstName}</span> !
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0 }}>
                            {user?.filiere || 'Bienvenue sur votre espace etudiant'}
                            {user?.niveau ? ` · ${user.niveau}` : ''}
                        </p>
                    </div>
                    <Link to="/assistant" style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: TEAL, color: 'white', padding: '12px 22px',
                        borderRadius: 12, fontWeight: 700, fontSize: 13,
                        textDecoration: 'none', boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                    }}>
                        <i className="fas fa-robot"></i> Assistant IA
                    </Link>
                </div>
            </section>

            <div style={{ ...W, marginTop: -20 }}>

                {/* Stats */}
                <div className="db-stats" style={{ marginBottom: 28 }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{
                            background: 'white', borderRadius: 14, padding: '20px 18px',
                            border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            display: 'flex', alignItems: 'center', gap: 14,
                        }}>
                            <div style={{
                                width: 46, height: 46, borderRadius: 12, background: s.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18, color: s.color, flexShrink: 0,
                            }}>
                                <i className={s.icon}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main grid */}
                <div className="db-grid">

                    {/* Left column */}
                    <div>
                        {/* Quick actions */}
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 14 }}>
                            <i className="fas fa-bolt" style={{ color: '#F5A623', marginRight: 8, fontSize: 14 }}></i>
                            Acces rapide
                        </h2>
                        <div className="db-quick" style={{ marginBottom: 28 }}>
                            {quickActions.map((a, i) => (
                                <Link key={i} to={a.to} style={{
                                    background: a.bg, borderRadius: 14, padding: '18px 16px',
                                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                                    border: '1px solid transparent', transition: 'all .2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, color: a.color, flexShrink: 0,
                                    }}>
                                        <i className={a.icon}></i>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{a.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* My courses */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: 0 }}>
                                <i className="fas fa-book-open" style={{ color: TEAL, marginRight: 8, fontSize: 14 }}></i>
                                Mes cours
                            </h2>
                            {myCat && (
                                <Link to={`/formations/${myCat.id}`} style={{ fontSize: 12, color: TEAL, fontWeight: 600, textDecoration: 'none' }}>
                                    Voir tout &rarr;
                                </Link>
                            )}
                        </div>

                        {loadingCourses ? (
                            <div style={{ background: 'white', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid #f0f0f0' }}>
                                <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }}></div>
                                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Chargement...</p>
                            </div>
                        ) : myCourses.length > 0 ? (
                            <div className="db-courses">
                                {myCourses.slice(0, 6).map(ue => {
                                    const docs = ue.knowledge_documents?.length || 0;
                                    return (
                                        <Link key={ue.id} to={myCat ? `/formations/${myCat.id}` : '/formations'} style={{
                                            background: 'white', borderRadius: 14, padding: '16px 18px',
                                            border: '1px solid #f0f0f0', textDecoration: 'none',
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            transition: 'all .2s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(91,188,180,0.1)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10, background: '#e8f8f5',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 16, color: TEAL, flexShrink: 0,
                                            }}>
                                                <i className="fas fa-layer-group"></i>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ue.nom}</div>
                                                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                                                    {ue.code && `${ue.code} · `}S{ue.semestre} · {docs} cours
                                                </div>
                                            </div>
                                            <i className="fas fa-chevron-right" style={{ fontSize: 10, color: '#d1d5db' }}></i>
                                        </Link>
                                    );
                                })}
                                {myCourses.length > 6 && (
                                    <Link to={myCat ? `/formations/${myCat.id}` : '/formations'} style={{
                                        background: `${TEAL}08`, borderRadius: 14, padding: '16px',
                                        border: `1.5px dashed ${TEAL}40`, textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        color: TEAL, fontSize: 12, fontWeight: 700,
                                    }}>
                                        <i className="fas fa-plus-circle"></i> Voir les {myCourses.length - 6} autres UEs
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div style={{ background: 'white', borderRadius: 14, padding: '32px 24px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                                <i className="fas fa-book-open" style={{ fontSize: 28, color: '#e5e7eb', marginBottom: 10, display: 'block' }}></i>
                                <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 14px' }}>
                                    {user?.filiere ? `Aucun cours pour ${user.filiere} pour le moment.` : 'Explorez les formations disponibles.'}
                                </p>
                                <Link to="/formations" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    background: TEAL, color: 'white', padding: '9px 18px',
                                    borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                                }}>
                                    <i className="fas fa-search"></i> Explorer les formations
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Profile card */}
                        <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                <div style={{
                                    width: 50, height: 50, borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: 20, fontWeight: 800, flexShrink: 0,
                                }}>
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{user?.name || 'Etudiant'}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                                </div>
                            </div>
                            {(user?.filiere || user?.niveau) && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                    {user.filiere && <span style={{ fontSize: 10, background: '#e8f8f5', color: TEAL, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{user.filiere}</span>}
                                    {user.niveau && <span style={{ fontSize: 10, background: '#f0f4ff', color: NAVY, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{user.niveau}</span>}
                                </div>
                            )}
                            <Link to="/profil" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                padding: '9px', borderRadius: 8, background: '#f8fafb',
                                color: NAVY, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                                border: '1px solid #f0f0f0', transition: 'all .15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = TEAL; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.color = NAVY; }}
                            >
                                <i className="fas fa-user-cog"></i> Mon profil
                            </Link>
                        </div>

                        {/* My specialty */}
                        {myCat && (
                            <div style={{
                                background: `linear-gradient(135deg, ${NAVY}, #2d4470)`,
                                borderRadius: 14, padding: 22, color: 'white',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: 'rgba(91,188,180,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 18, color: TEAL, flexShrink: 0,
                                    }}>
                                        <i className={myCat.icon || 'fas fa-laptop-code'}></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>MA SPECIALITE</div>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{myCat.name}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: TEAL }}>{myCourses.length}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>UEs</div>
                                    </div>
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#F5A623' }}>{myCourses.reduce((s, ue) => s + (ue.knowledge_documents?.length || 0), 0)}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Cours</div>
                                    </div>
                                </div>
                                <Link to={`/formations/${myCat.id}`} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    background: TEAL, color: 'white', padding: '10px',
                                    borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                                }}>
                                    <i className="fas fa-book-open"></i> Acceder aux cours
                                </Link>
                            </div>
                        )}

                        {/* Quick links */}
                        <div style={{ background: 'white', borderRadius: 14, padding: 18, border: '1px solid #f0f0f0' }}>
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: NAVY, margin: '0 0 12px' }}>
                                <i className="fas fa-link" style={{ color: TEAL, marginRight: 6 }}></i>
                                Liens utiles
                            </h3>
                            {[
                                { icon: 'fas fa-clipboard-list', label: 'Programme de revision', to: '/revision', color: '#8B5CF6' },
                                { icon: 'fas fa-store', label: 'Marketplace', to: '/marketplace', color: '#F5A623' },
                                { icon: 'fas fa-compass', label: 'Test d\'orientation', to: '/orientation', color: '#10B981' },
                            ].map((lk, i) => (
                                <Link key={i} to={lk.to} style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                                    borderBottom: i < 2 ? '1px solid #f9fafb' : 'none',
                                    textDecoration: 'none', transition: 'all .15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.paddingLeft = '4px'}
                                    onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
                                >
                                    <div style={{
                                        width: 30, height: 30, borderRadius: 8, background: `${lk.color}12`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, color: lk.color, flexShrink: 0,
                                    }}>
                                        <i className={lk.icon}></i>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{lk.label}</span>
                                    <i className="fas fa-chevron-right" style={{ fontSize: 9, color: '#d1d5db', marginLeft: 'auto' }}></i>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
