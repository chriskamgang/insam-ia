import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api';

const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

// Gradient palettes for thumbnail placeholders
const THUMB_GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #5BBCB4 0%, #1B2A4A 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];

const CATEGORY_COLORS = [
    { bg: '#fff4e6', color: '#f59e0b' },
    { bg: '#e8f8f5', color: '#5BBCB4' },
    { bg: '#fef2f2', color: '#ef4444' },
    { bg: '#eff6ff', color: '#3b82f6' },
    { bg: '#f5f3ff', color: '#8b5cf6' },
    { bg: '#ecfdf5', color: '#10b981' },
    { bg: '#fff7ed', color: '#f97316' },
    { bg: '#fdf4ff', color: '#d946ef' },
];

const AUTHOR_NAMES = ['Dr. Nguema', 'Prof. Obiang', 'M. Mba', 'Mme. Eyene', 'Dr. Nze', 'Prof. Ondo'];

function CourseCard({ video, index }) {
    const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
    const authorName = AUTHOR_NAMES[index % AUTHOR_NAMES.length];
    const authorInitial = authorName.charAt(0);
    const avatarColors = ['#5BBCB4', '#1B2A4A', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];
    const avatarColor = avatarColors[index % avatarColors.length];

    return (
        <Link
            to={`/video/${video.id}`}
            style={{
                background: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                textDecoration: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
            }}
        >
            {/* Thumbnail */}
            <div style={{ position: 'relative', height: 160, background: gradient, flexShrink: 0 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                    }}>
                        <i className="fas fa-play" style={{ color: 'white', fontSize: 16, marginLeft: 3 }}></i>
                    </div>
                </div>
                {/* Pills overlay */}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                    {video.category_name && (
                        <span style={{
                            fontSize: 11, fontWeight: 700,
                            background: '#5BBCB4', color: 'white',
                            padding: '3px 10px', borderRadius: 20,
                            backdropFilter: 'blur(4px)',
                        }}>{video.category_name}</span>
                    )}
                    {video.duration && (
                        <span style={{
                            fontSize: 11, fontWeight: 600,
                            background: 'rgba(255,255,255,0.85)', color: '#374151',
                            padding: '3px 10px', borderRadius: 20,
                        }}>
                            <i className="fas fa-clock" style={{ marginRight: 4, fontSize: 10 }}></i>
                            {video.duration}
                        </span>
                    )}
                </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '16px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                    fontSize: 14, fontWeight: 700, color: '#1B2A4A',
                    marginBottom: 6, lineHeight: 1.45,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{video.title}</h3>
                <p style={{
                    fontSize: 12, color: '#9ca3af', lineHeight: 1.55,
                    flex: 1, marginBottom: 12,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{(video.description || '').substring(0, 90)}</p>

                {/* Author + views */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid #f3f4f6', paddingTop: 10,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: avatarColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 10, fontWeight: 800, flexShrink: 0,
                        }}>{authorInitial}</div>
                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{authorName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9ca3af' }}>
                        <i className="fas fa-eye" style={{ fontSize: 11 }}></i>
                        <span style={{ fontSize: 11 }}>{video.views_count || 0}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function Landing() {
    const { t } = useLang();
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [recentVideos, setRecentVideos] = useState([]);
    const [stats, setStats] = useState({});

    useEffect(() => {
        api.get('/api/public/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
        api.get('/api/public/recent-videos').then(r => setRecentVideos(r.data.data || [])).catch(() => {});
        api.get('/api/public/stats').then(r => setStats(r.data)).catch(() => {});
    }, []);

    const firstBatch = recentVideos.slice(0, 4);
    const secondBatch = recentVideos.slice(4, 8);
    const thirdBatch = recentVideos.slice(8, 12);

    return (
        <div style={{ background: '#F5F5F5', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

            {/* ============================
                1. HERO SECTION
            ============================= */}
            <section style={{
                background: 'linear-gradient(160deg, #eafaf8 0%, #f4fdfc 45%, #fafafa 100%)',
                padding: '80px 0 60px',
            }}>
                <div style={{ ...W, display: 'flex', alignItems: 'center', gap: 60 }}>

                    {/* Left: text */}
                    <div style={{ flex: 1.1, minWidth: 0 }}>
                        {/* Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: '#5BBCB4',
                            }}></div>
                            <span style={{
                                fontSize: 13, fontWeight: 700, color: '#5BBCB4',
                                letterSpacing: 1.5, textTransform: 'uppercase',
                            }}>INSAM-IA PLATFORM</span>
                        </div>

                        <h1 style={{
                            fontSize: 48, fontWeight: 800, color: '#1B2A4A',
                            lineHeight: 1.12, margin: '0 0 20px',
                        }}>
                            {t('hero.title')}
                        </h1>

                        <p style={{
                            fontSize: 16, color: '#6b7280', lineHeight: 1.8,
                            marginBottom: 36, maxWidth: 500,
                        }}>
                            {t('hero.subtitle')}
                        </p>

                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Link
                                to={user ? '/formations' : '/register'}
                                style={{
                                    display: 'inline-block',
                                    padding: '14px 36px',
                                    background: '#5BBCB4',
                                    color: 'white',
                                    borderRadius: 50,
                                    fontWeight: 700,
                                    fontSize: 15,
                                    textDecoration: 'none',
                                    boxShadow: '0 4px 18px rgba(91,188,180,0.35)',
                                    transition: 'background .2s, box-shadow .2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#48aaa3'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#5BBCB4'; }}
                            >
                                {t('hero.cta')}
                            </Link>
                            <Link
                                to="/formations"
                                style={{
                                    display: 'inline-block',
                                    padding: '13px 34px',
                                    border: '2px solid #5BBCB4',
                                    color: '#5BBCB4',
                                    borderRadius: 50,
                                    fontWeight: 700,
                                    fontSize: 15,
                                    textDecoration: 'none',
                                    transition: 'all .2s',
                                    background: 'transparent',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#5BBCB4'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5BBCB4'; }}
                            >
                                {t('hero.cta2')}
                            </Link>
                        </div>

                        {/* Mini trust row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 36 }}>
                            <div style={{ display: 'flex' }}>
                                {['#5BBCB4','#1B2A4A','#f59e0b','#ef4444'].map((c, i) => (
                                    <div key={i} style={{
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: c, border: '2px solid white',
                                        marginLeft: i === 0 ? 0 : -8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: 11, fontWeight: 800,
                                    }}>{['A','B','C','D'][i]}</div>
                                ))}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A' }}>{stats.students || '150'}+ etudiants</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>nous rejoignent chaque mois</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: hero card */}
                    <div style={{ flex: 0.9, minWidth: 0 }}>
                        <div style={{
                            background: 'white',
                            borderRadius: 24,
                            padding: 20,
                            boxShadow: '0 24px 64px rgba(27,42,74,0.10)',
                        }}>
                            {/* Main thumbnail */}
                            <div style={{
                                width: '100%', height: 260, borderRadius: 16,
                                background: 'linear-gradient(135deg, #1B2A4A 0%, #5BBCB4 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* Simulated classroom scene */}
                                <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} style={{
                                            position: 'absolute',
                                            width: 60 + i * 20, height: 60 + i * 20,
                                            borderRadius: '50%',
                                            border: '1px solid rgba(255,255,255,0.4)',
                                            top: `${10 + i * 8}%`, left: `${5 + i * 12}%`,
                                        }}></div>
                                    ))}
                                </div>
                                <div style={{ textAlign: 'center', zIndex: 1 }}>
                                    <div style={{
                                        width: 60, height: 60, borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 12px',
                                        backdropFilter: 'blur(8px)',
                                        border: '2px solid rgba(255,255,255,0.4)',
                                    }}>
                                        <i className="fas fa-play" style={{ color: 'white', fontSize: 22, marginLeft: 4 }}></i>
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>
                                        Cours en ligne
                                    </span>
                                </div>

                                {/* Floating badge */}
                                <div style={{
                                    position: 'absolute', bottom: 14, left: 14,
                                    background: 'white', borderRadius: 10,
                                    padding: '8px 12px',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1B2A4A' }}>En direct maintenant</span>
                                </div>
                                <div style={{
                                    position: 'absolute', top: 14, right: 14,
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: 8, padding: '6px 10px',
                                }}>
                                    <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>
                                        <i className="fas fa-users" style={{ marginRight: 5 }}></i>
                                        {stats.students || '150'}+
                                    </span>
                                </div>
                            </div>

                            {/* 3 small preview thumbnails */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                                {[
                                    { gradient: 'linear-gradient(135deg, #667eea, #764ba2)', icon: 'fa-laptop-code', label: 'Dev Web' },
                                    { gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', icon: 'fa-chart-bar', label: 'Gestion' },
                                    { gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', icon: 'fa-calculator', label: 'Maths' },
                                ].map((thumb, i) => (
                                    <div key={i} style={{
                                        flex: 1, height: 68, borderRadius: 12,
                                        background: thumb.gradient,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        gap: 4, cursor: 'pointer',
                                    }}>
                                        <i className={`fas ${thumb.icon}`} style={{ color: 'white', fontSize: 16 }}></i>
                                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 600 }}>{thumb.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================
                2. STATS BAR
            ============================= */}
            <section style={{ background: 'white', padding: '32px 0', borderBottom: '1px solid #f0f0f0', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ ...W, display: 'flex', justifyContent: 'center', gap: 0 }}>
                    {[
                        { val: `${stats.students || '15K'}+`, label: t('home.stats_students'), icon: 'fas fa-user-graduate', color: '#5BBCB4', bg: '#e8f8f5' },
                        { val: '75%', label: t('home.stats_success'), icon: 'fas fa-trophy', color: '#f59e0b', bg: '#fffbeb' },
                        { val: `${stats.courses || 35}`, label: t('home.stats_courses'), icon: 'fas fa-book-open', color: '#8b5cf6', bg: '#f5f3ff' },
                        { val: `${stats.videos || '50'}+`, label: t('home.stats_videos'), icon: 'fas fa-play-circle', color: '#ef4444', bg: '#fef2f2' },
                    ].map((s, i, arr) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '0 48px',
                            borderRight: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
                        }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: s.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: s.color, fontSize: 22, flexShrink: 0,
                            }}>
                                <i className={s.icon}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: '#1B2A4A', lineHeight: 1 }}>{s.val}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============================
                3. CATEGORY SECTION
            ============================= */}
            <section style={{ padding: '72px 0' }}>
                <div style={W}>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <h2 style={{ fontSize: 30, fontWeight: 800, color: '#1B2A4A', marginBottom: 12 }}>
                            {t('home.categories_title')}
                        </h2>
                        <p style={{ fontSize: 15, color: '#9ca3af', maxWidth: 520, margin: '0 auto' }}>
                            Explorez nos categories de cours et trouvez la formation qui vous convient
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 20,
                    }}>
                        {(categories.length > 0 ? categories : Array(8).fill(null)).map((cat, i) => {
                            const palette = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                            const icons = ['fa-laptop-code', 'fa-chart-line', 'fa-calculator', 'fa-flask', 'fa-balance-scale', 'fa-language', 'fa-brain', 'fa-database'];
                            const icon = cat?.icon || `fas ${icons[i % icons.length]}`;
                            const names = ['Informatique', 'Gestion', 'Mathematiques', 'Sciences', 'Droit', 'Langues', 'IA & Data', 'Base de donnees'];
                            const descs = ['Programmation, reseaux, systemes', 'Comptabilite, finance, marketing', 'Algebre, analyse, statistiques', 'Physique, chimie, biologie', 'Droit des affaires, civil', 'Francais, anglais, communication', 'Machine learning, big data', 'SQL, NoSQL, modeles de donnees'];
                            return (
                                <Link
                                    key={cat?.id || i}
                                    to={cat ? `/formations/${cat.id}` : '/formations'}
                                    style={{
                                        background: 'white',
                                        borderRadius: 16,
                                        padding: '24px 20px',
                                        textDecoration: 'none',
                                        border: '1px solid #f3f4f6',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                        transition: 'all .2s',
                                        display: 'block',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(91,188,180,0.14)';
                                        e.currentTarget.style.borderColor = palette.color;
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                                        e.currentTarget.style.borderColor = '#f3f4f6';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Icon box */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 12,
                                        background: palette.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 14, fontSize: 20, color: palette.color,
                                    }}>
                                        <i className={icon}></i>
                                    </div>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2A4A', marginBottom: 6 }}>
                                        {cat?.name || names[i % names.length]}
                                    </h3>
                                    <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                                        {cat?.description || descs[i % descs.length]}
                                    </p>
                                    {cat?.videos_count > 0 && (
                                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span style={{
                                                fontSize: 11, fontWeight: 600, color: palette.color,
                                            }}>
                                                {cat.videos_count} {t('categories.videos')}
                                            </span>
                                            <i className="fas fa-arrow-right" style={{ fontSize: 9, color: palette.color }}></i>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ============================
                4. RECOMMENDED COURSES
            ============================= */}
            <section style={{ padding: '60px 0', background: 'white' }}>
                <div style={W}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1B2A4A', margin: 0 }}>
                                {t('home.recent_title')}
                            </h2>
                            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, marginBottom: 0 }}>
                                Des cours selectionnes pour vous
                            </p>
                        </div>
                        <Link
                            to="/formations"
                            style={{
                                color: '#5BBCB4', fontWeight: 700, fontSize: 13,
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            {t('common.see_all')}
                            <i className="fas fa-arrow-right" style={{ fontSize: 12 }}></i>
                        </Link>
                    </div>

                    {recentVideos.length === 0 ? (
                        /* Skeleton placeholders */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} style={{ background: '#f9fafb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                                    <div style={{ height: 160, background: THUMB_GRADIENTS[i], opacity: 0.6 }}></div>
                                    <div style={{ padding: 16 }}>
                                        <div style={{ height: 12, background: '#e5e7eb', borderRadius: 6, marginBottom: 8, width: '80%' }}></div>
                                        <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, marginBottom: 6, width: '60%' }}></div>
                                        <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, width: '90%' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                            {firstBatch.map((v, i) => <CourseCard key={v.id} video={v} index={i} />)}
                        </div>
                    )}
                </div>
            </section>

            {/* ============================
                5. CTA BANNER
            ============================= */}
            <section style={{
                background: 'linear-gradient(120deg, #5BBCB4 0%, #3da89e 100%)',
                padding: '60px 24px',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 14, lineHeight: 1.25 }}>
                        Cours en ligne pour un apprentissage a distance
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
                        Acces aux cours, sujets d'examens, videos TP et un assistant IA disponible 24h/7 pour vous aider dans vos etudes.
                    </p>
                    <Link
                        to={user ? '/formations' : '/register'}
                        style={{
                            display: 'inline-block',
                            background: '#1B2A4A',
                            color: 'white',
                            padding: '14px 40px',
                            borderRadius: 50,
                            fontWeight: 700,
                            fontSize: 15,
                            textDecoration: 'none',
                            boxShadow: '0 4px 18px rgba(27,42,74,0.30)',
                            transition: 'background .2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#243a63'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#1B2A4A'; }}
                    >
                        Commencer maintenant
                    </Link>
                </div>
            </section>

            {/* ============================
                6a. "GET CHOICE OF YOUR COURSE"
            ============================= */}
            {secondBatch.length > 0 && (
                <section style={{ padding: '60px 0' }}>
                    <div style={W}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1B2A4A', margin: 0 }}>
                                    {t('home.features_title')}
                                </h2>
                                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, marginBottom: 0 }}>
                                    Choisissez parmi nos meilleures formations
                                </p>
                            </div>
                            <Link
                                to="/formations"
                                style={{ color: '#5BBCB4', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                {t('common.see_all')}
                                <i className="fas fa-arrow-right" style={{ fontSize: 12 }}></i>
                            </Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                            {secondBatch.map((v, i) => <CourseCard key={v.id} video={v} index={i + 4} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* ============================
                6b. "STUDENTS ARE VIEWING"
            ============================= */}
            {thirdBatch.length > 0 && (
                <section style={{ padding: '0 0 72px' }}>
                    <div style={W}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1B2A4A', margin: 0 }}>
                                    Les etudiants regardent en ce moment
                                </h2>
                                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, marginBottom: 0 }}>
                                    Cours populaires cette semaine
                                </p>
                            </div>
                            <Link
                                to="/formations"
                                style={{ color: '#5BBCB4', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                {t('common.see_all')}
                                <i className="fas fa-arrow-right" style={{ fontSize: 12 }}></i>
                            </Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                            {thirdBatch.map((v, i) => <CourseCard key={v.id} video={v} index={i + 8} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* Features strip (shown when fewer videos exist) */}
            {thirdBatch.length === 0 && (
                <section style={{ padding: '0 0 72px' }}>
                    <div style={W}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                            {[
                                { icon: 'fas fa-robot', title: t('home.feature1'), desc: t('home.feature1_desc'), color: '#5BBCB4', bg: '#e8f8f5' },
                                { icon: 'fas fa-file-alt', title: t('home.feature2'), desc: t('home.feature2_desc'), color: '#f59e0b', bg: '#fffbeb' },
                                { icon: 'fas fa-clipboard-check', title: t('home.feature3'), desc: t('home.feature3_desc'), color: '#ef4444', bg: '#fef2f2' },
                                { icon: 'fas fa-play-circle', title: t('home.feature4'), desc: t('home.feature4_desc'), color: '#8b5cf6', bg: '#f5f3ff' },
                            ].map((f, i) => (
                                <div key={i} style={{
                                    background: 'white', borderRadius: 16,
                                    padding: '28px 22px', border: '1px solid #f0f0f0',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 14,
                                        background: f.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 16, fontSize: 22, color: f.color,
                                    }}>
                                        <i className={f.icon}></i>
                                    </div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>{f.title}</h3>
                                    <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ============================
                7. FOOTER
            ============================= */}
            <footer style={{ background: '#1B2A4A', padding: '56px 0 28px' }}>
                <div style={{ ...W, textAlign: 'center' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: 'linear-gradient(135deg, #5BBCB4 0%, #3da89e 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800, fontSize: 15,
                            boxShadow: '0 4px 12px rgba(91,188,180,0.4)',
                        }}>IA</div>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>INSAM-IA</span>
                    </div>

                    {/* Virtual class badge */}
                    <div style={{ marginBottom: 24 }}>
                        <span style={{
                            display: 'inline-block',
                            background: 'rgba(91,188,180,0.15)',
                            border: '1px solid rgba(91,188,180,0.3)',
                            color: '#5BBCB4',
                            padding: '4px 16px', borderRadius: 20,
                            fontSize: 12, fontWeight: 600,
                        }}>
                            Classe Virtuelle
                        </span>
                    </div>

                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
                        Institut Universitaire et Strategique de l'Estuaire<br />
                        Votre plateforme d'apprentissage numerique
                    </p>

                    {/* Newsletter */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 8,
                        marginBottom: 36, flexWrap: 'wrap',
                    }}>
                        <input
                            placeholder="Votre adresse email"
                            style={{
                                width: 280, borderRadius: 50,
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: 'rgba(255,255,255,0.07)',
                                color: 'white',
                                padding: '11px 22px',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <button style={{
                            background: '#5BBCB4', color: 'white', border: 'none',
                            borderRadius: 50, padding: '11px 28px',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            transition: 'background .2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#48aaa3'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#5BBCB4'; }}
                        >
                            S'abonner
                        </button>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}></div>

                    {/* Links */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 20, flexWrap: 'wrap' }}>
                        {['Carrieres', 'Politique de confidentialite', 'Conditions d\'utilisation'].map(l => (
                            <span key={l} style={{
                                color: 'rgba(255,255,255,0.4)', fontSize: 12,
                                cursor: 'pointer', transition: 'color .2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                            >{l}</span>
                        ))}
                    </div>

                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>
                        &copy; 2026 INSAM-IA. Tous droits reserves.
                    </p>
                </div>
            </footer>
        </div>
    );
}
