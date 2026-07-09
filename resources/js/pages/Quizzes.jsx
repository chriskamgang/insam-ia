import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

function QuizCard({ quiz }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'white',
                borderRadius: 16,
                border: `1.5px solid ${hovered ? TEAL : '#f0f0f0'}`,
                boxShadow: hovered ? '0 8px 28px rgba(91,188,180,0.14)' : '0 1px 4px rgba(0,0,0,0.04)',
                padding: '24px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transition: 'all .2s',
                transform: hovered ? 'translateY(-2px)' : 'none',
            }}
        >
            {/* Category badge */}
            {quiz.category_name && (
                <span style={{
                    display: 'inline-block',
                    background: '#e8f8f5',
                    color: TEAL,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 6,
                    letterSpacing: 0.3,
                    alignSelf: 'flex-start',
                }}>
                    {quiz.category_name}
                </span>
            )}

            {/* Title */}
            <h3 style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1.35, margin: 0 }}>
                {quiz.title}
            </h3>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                    <i className="fas fa-question-circle" style={{ color: TEAL }}></i>
                    {quiz.questions_count ?? quiz.questions?.length ?? 0} questions
                </span>
                {quiz.duration_minutes && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                        <i className="fas fa-clock" style={{ color: TEAL }}></i>
                        {quiz.duration_minutes} min
                    </span>
                )}
            </div>

            {/* Description */}
            {quiz.description && (
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {quiz.description}
                </p>
            )}

            {/* CTA */}
            <Link
                to={`/evaluations/${quiz.id}`}
                style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 'auto',
                    background: hovered ? TEAL : 'transparent',
                    color: hovered ? 'white' : TEAL,
                    border: `2px solid ${TEAL}`,
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all .2s',
                }}
            >
                <i className="fas fa-play-circle"></i>
                Commencer
            </Link>
        </div>
    );
}

export default function Quizzes() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [results, setResults] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);
    const [loadingResults, setLoadingResults] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/api/quizzes')
            .then(r => setQuizzes(r.data.quizzes || r.data.data || []))
            .catch(() => {})
            .finally(() => setLoadingQuizzes(false));

        api.get('/api/my-results')
            .then(r => setResults(r.data.results || r.data.data || []))
            .catch(() => {})
            .finally(() => setLoadingResults(false));
    }, []);

    const filtered = quizzes.filter(q =>
        q.title?.toLowerCase().includes(search.toLowerCase()) ||
        q.category_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>

            {/* ── HERO ── */}
            <section style={{
                background: 'linear-gradient(135deg, #1B2A4A 0%, #243758 60%, #2d4470 100%)',
                padding: '48px 0 52px',
            }}>
                <div style={W}>
                    <span style={{ color: TEAL, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>EVALUATIONS</span>
                    <h1 style={{ fontSize: 34, fontWeight: 800, color: 'white', margin: '10px 0 8px', lineHeight: 1.2 }}>
                        Quiz & <span style={{ color: TEAL }}>Evaluations</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, maxWidth: 520, marginBottom: 28 }}>
                        Testez vos connaissances avec nos quiz interactifs et suivez votre progression en temps reel.
                    </p>

                    {/* Search bar */}
                    <div style={{ position: 'relative', maxWidth: 480 }}>
                        <i className="fas fa-search" style={{
                            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                            color: '#9ca3af', fontSize: 15,
                        }}></i>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher un quiz..."
                            style={{
                                width: '100%', padding: '13px 16px 13px 44px',
                                borderRadius: 12, border: 'none', fontSize: 14,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>
            </section>

            <div style={{ ...W, marginTop: 36 }}>

                {/* ── STATS STRIP ── */}
                <div style={{
                    background: 'white', borderRadius: 16, border: '1px solid #f0f0f0',
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    marginBottom: 36, overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                    {[
                        { icon: 'fas fa-clipboard-list', label: 'Quiz disponibles', value: quizzes.length, color: TEAL, bg: '#e8f8f5' },
                        { icon: 'fas fa-check-circle', label: 'Completes', value: results.length, color: '#F5A623', bg: '#fff8ec' },
                        { icon: 'fas fa-trophy', label: 'Score moyen', color: NAVY, bg: '#f0f4ff',
                            value: results.length
                                ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length) + '%'
                                : '—' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '22px 26px',
                            borderRight: i < 2 ? '1px solid #f3f4f6' : 'none',
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 14, background: s.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, color: s.color, flexShrink: 0,
                            }}>
                                <i className={s.icon}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── QUIZ GRID ── */}
                <div style={{ marginBottom: 48 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 20 }}>
                        <i className="fas fa-clipboard-check" style={{ color: TEAL, marginRight: 8 }}></i>
                        Tous les quiz
                        {search && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af', marginLeft: 10 }}>
                                — {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </h2>

                    {loadingQuizzes ? (
                        <div style={{
                            background: 'white', borderRadius: 16, padding: 60,
                            textAlign: 'center', color: '#9ca3af', border: '1px solid #f0f0f0',
                        }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 14, color: TEAL }}></i>
                            <p style={{ fontSize: 14 }}>Chargement des evaluations...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{
                            background: 'white', borderRadius: 16, padding: 60,
                            textAlign: 'center', color: '#9ca3af', border: '1px solid #f0f0f0',
                        }}>
                            <i className="fas fa-search" style={{ fontSize: 32, marginBottom: 14, color: '#e5e7eb' }}></i>
                            <p style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>Aucun quiz trouve</p>
                            <p style={{ fontSize: 13, marginTop: 6 }}>
                                {search ? 'Essayez un autre terme de recherche.' : 'Aucun quiz disponible pour le moment.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: 20,
                        }}>
                            {filtered.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
                        </div>
                    )}
                </div>

                {/* ── MY RESULTS ── */}
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 20 }}>
                        <i className="fas fa-chart-bar" style={{ color: TEAL, marginRight: 8 }}></i>
                        Mes resultats
                    </h2>

                    <div style={{
                        background: 'white', borderRadius: 16,
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                    }}>
                        {loadingResults ? (
                            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: 22, color: TEAL }}></i>
                            </div>
                        ) : results.length === 0 ? (
                            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                                <i className="fas fa-clipboard" style={{ fontSize: 32, marginBottom: 12, color: '#e5e7eb' }}></i>
                                <p style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Aucun resultat pour le moment</p>
                                <p style={{ fontSize: 13, marginTop: 6 }}>Commencez un quiz pour voir votre score ici.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafb', borderBottom: '1px solid #f0f0f0' }}>
                                        {['Quiz', 'Categorie', 'Score', 'Statut', 'Date'].map(h => (
                                            <th key={h} style={{
                                                padding: '14px 20px', textAlign: 'left',
                                                fontSize: 12, fontWeight: 700, color: '#6b7280',
                                                letterSpacing: 0.3, textTransform: 'uppercase',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((r, i) => {
                                        const passed = (r.score ?? 0) >= (r.passing_score ?? 50);
                                        return (
                                            <tr key={r.id ?? i} style={{
                                                borderBottom: i < results.length - 1 ? '1px solid #f9fafb' : 'none',
                                                transition: 'background .15s',
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafb'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '14px 20px', fontWeight: 600, color: NAVY }}>
                                                    {r.quiz_title || r.quiz?.title || '—'}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: '#6b7280' }}>
                                                    {r.category_name || r.quiz?.category_name || '—'}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                        fontWeight: 800,
                                                        color: passed ? '#10b981' : '#ef4444',
                                                        fontSize: 15,
                                                    }}>
                                                        {r.score ?? 0}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '3px 10px', borderRadius: 6,
                                                        fontSize: 11, fontWeight: 700,
                                                        background: passed ? '#d1fae5' : '#fee2e2',
                                                        color: passed ? '#059669' : '#dc2626',
                                                    }}>
                                                        {passed ? 'Reussi' : 'Echoue'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: 13 }}>
                                                    {r.created_at
                                                        ? new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
