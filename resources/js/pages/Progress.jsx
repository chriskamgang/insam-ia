import { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const PURPLE = '#7C3AED';
const AMBER = '#F59E0B';
const BLUE = '#3B82F6';
const GREEN = '#10B981';
const RED = '#EF4444';

const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const progressCSS = `
.prog-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.prog-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.prog-hero h1 { font-size: 30px; }
.prog-tabs { display: flex; gap: 0; overflow-x: auto; }
.prog-tabs button { padding: 16px 22px; white-space: nowrap; }
@media(max-width:900px) {
  .prog-stats { grid-template-columns: repeat(2, 1fr); }
}
@media(max-width:600px) {
  .prog-stats { grid-template-columns: 1fr; }
  .prog-grid2 { grid-template-columns: 1fr; }
  .prog-hero h1 { font-size: 22px !important; }
  .prog-hero { padding: 32px 0 36px !important; }
  .prog-hero .prog-hero-flex { flex-direction: column; gap: 12px !important; }
  .prog-hero .prog-icon { width: 44px !important; height: 44px !important; font-size: 20px !important; }
  .prog-tabs button { padding: 12px 14px !important; font-size: 12px !important; }
}
`;

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeDate(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'A l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `Il y a ${weeks} sem.`;
    const months = Math.floor(days / 30);
    return `Il y a ${months} mois`;
}

function typeColor(type) {
    if (!type) return TEAL;
    const t = type.toLowerCase();
    if (t.includes('quiz') || t.includes('eval')) return TEAL;
    if (t.includes('simul') || t.includes('exam')) return PURPLE;
    if (t.includes('fiche') || t.includes('revis')) return AMBER;
    if (t.includes('ia') || t.includes('chat') || t.includes('message')) return BLUE;
    return TEAL;
}

function typeLabel(type) {
    if (!type) return 'Activite';
    const t = type.toLowerCase();
    if (t.includes('quiz') || t.includes('eval')) return 'Quiz';
    if (t.includes('simul') || t.includes('exam')) return 'Simulation';
    if (t.includes('fiche') || t.includes('revis')) return 'Fiche';
    if (t.includes('ia') || t.includes('chat') || t.includes('message')) return 'IA';
    return type;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, bg }) {
    return (
        <div style={{
            background: 'white',
            borderRadius: 16,
            padding: '22px 20px',
            border: '1px solid #f0f0f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
        }}>
            <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: bg || `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color, flexShrink: 0,
            }}>
                <i className={icon}></i>
            </div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginTop: 3 }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    );
}

function ProgressBar({ value, color, height = 8 }) {
    const pct = Math.min(100, Math.max(0, value || 0));
    return (
        <div style={{ background: '#f3f4f6', borderRadius: 999, height, overflow: 'hidden', width: '100%' }}>
            <div style={{
                width: `${pct}%`,
                height: '100%',
                background: color,
                borderRadius: 999,
                transition: 'width 0.6s ease',
            }} />
        </div>
    );
}

function LoadingSpinner({ message = 'Chargement...' }) {
    return (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9ca3af' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, color: TEAL, marginBottom: 14, display: 'block' }}></i>
            <p style={{ fontSize: 14 }}>{message}</p>
        </div>
    );
}

function EmptyState({ icon, message }) {
    return (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9ca3af' }}>
            <i className={icon} style={{ fontSize: 40, color: '#e5e7eb', marginBottom: 16, display: 'block' }}></i>
            <p style={{ fontSize: 14, maxWidth: 320, margin: '0 auto' }}>{message}</p>
        </div>
    );
}

// ── Weekly Activity Bar Chart ──────────────────────────────────────────────────

function WeeklyBarChart({ data }) {
    if (!data || data.length === 0) return (
        <EmptyState icon="fas fa-chart-bar" message="Pas encore de donnees d'activite pour cette semaine." />
    );

    const max = Math.max(...data.map(d => d.count || 0), 1);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120, padding: '0 4px' }}>
                {data.map((d, i) => {
                    const pct = max > 0 ? ((d.count || 0) / max) * 100 : 0;
                    const barH = Math.max(4, (pct / 100) * 104);
                    return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
                                {d.count > 0 ? d.count : ''}
                            </div>
                            <div style={{
                                width: '100%',
                                height: barH,
                                background: d.count > 0
                                    ? `linear-gradient(180deg, ${TEAL} 0%, #3da89e 100%)`
                                    : '#f3f4f6',
                                borderRadius: '6px 6px 3px 3px',
                                transition: 'height 0.5s ease',
                                minHeight: 4,
                            }} />
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '8px 4px 0' }}>
                {data.map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                        {d.day || d.label || ''}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Monthly Scores Chart ───────────────────────────────────────────────────────

function MonthlyScoresChart({ data }) {
    if (!data || data.length === 0) return (
        <EmptyState icon="fas fa-chart-line" message="Pas encore de donnees de scores mensuels." />
    );

    const allVals = data.flatMap(d => [d.quiz_avg || 0, d.simulation_avg || 0]).filter(v => v > 0);
    const max = Math.max(...allVals, 100);

    return (
        <div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: TEAL }}></div>
                    Quiz
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: PURPLE }}></div>
                    Simulations
                </div>
            </div>

            {/* Chart area */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 120 }}>
                {data.map((d, i) => {
                    const qH = max > 0 ? Math.max(4, ((d.quiz_avg || 0) / max) * 104) : 4;
                    const sH = max > 0 ? Math.max(4, ((d.simulation_avg || 0) / max) * 104) : 4;
                    return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                                {/* Quiz bar */}
                                <div style={{ position: 'relative', flex: 1 }}>
                                    {d.quiz_avg > 0 && (
                                        <div style={{ fontSize: 9, color: TEAL, textAlign: 'center', fontWeight: 700, marginBottom: 2 }}>
                                            {Math.round(d.quiz_avg)}
                                        </div>
                                    )}
                                    <div style={{
                                        width: '100%',
                                        height: qH,
                                        background: d.quiz_avg > 0
                                            ? `linear-gradient(180deg, ${TEAL} 0%, #3da89e 100%)`
                                            : '#f3f4f6',
                                        borderRadius: '4px 4px 2px 2px',
                                        transition: 'height 0.5s ease',
                                    }} />
                                </div>
                                {/* Simulation bar */}
                                <div style={{ position: 'relative', flex: 1 }}>
                                    {d.simulation_avg > 0 && (
                                        <div style={{ fontSize: 9, color: PURPLE, textAlign: 'center', fontWeight: 700, marginBottom: 2 }}>
                                            {Math.round(d.simulation_avg)}
                                        </div>
                                    )}
                                    <div style={{
                                        width: '100%',
                                        height: sH,
                                        background: d.simulation_avg > 0
                                            ? `linear-gradient(180deg, ${PURPLE} 0%, #6d28d9 100%)`
                                            : '#f3f4f6',
                                        borderRadius: '4px 4px 2px 2px',
                                        transition: 'height 0.5s ease',
                                    }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Month labels */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {data.map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                        {d.month || d.label || ''}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Tab 1: Vue d'ensemble ──────────────────────────────────────────────────────

function OverviewTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/api/progress/overview')
            .then(r => setData(r.data?.data || r.data || null))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner message="Chargement de votre tableau de bord..." />;
    if (!data) return (
        <EmptyState icon="fas fa-chart-pie" message="Impossible de charger les donnees. Veuillez reessayer." />
    );

    const quizCount = data.quiz_count ?? 0;
    const quizAvg = data.quiz_avg_score ?? 0;
    const simCount = data.simulation_count ?? 0;
    const simAvg = data.simulation_avg_score ?? 0;
    const ficheCount = data.fiche_count ?? data.revision_count ?? 0;
    const iaCount = data.ia_message_count ?? data.chat_count ?? 0;
    const streakDays = data.active_days_this_month ?? 0;
    const weeklyActivity = data.weekly_activity || [];
    const monthlyScores = data.monthly_scores || [];
    const strongest = data.strongest_category || null;
    const weakest = data.weakest_category || null;

    const hasAnyActivity = quizCount > 0 || simCount > 0 || ficheCount > 0 || iaCount > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Stats Cards */}
            <div className="prog-stats">
                <StatCard
                    icon="fas fa-clipboard-check"
                    label="Quiz realises"
                    value={quizCount}
                    sub={quizCount > 0 ? `Moy. ${Math.round(quizAvg)}/100` : 'Aucun encore'}
                    color={TEAL}
                    bg="#e8f8f5"
                />
                <StatCard
                    icon="fas fa-flask"
                    label="Simulations"
                    value={simCount}
                    sub={simCount > 0 ? `Moy. ${Math.round(simAvg)}/100` : 'Aucune encore'}
                    color={PURPLE}
                    bg="#f3f0ff"
                />
                <StatCard
                    icon="fas fa-file-alt"
                    label="Fiches de revision"
                    value={ficheCount}
                    sub={ficheCount > 0 ? 'Fiches consultees' : 'Aucune encore'}
                    color={AMBER}
                    bg="#fffbeb"
                />
                <StatCard
                    icon="fas fa-robot"
                    label="Messages IA"
                    value={iaCount}
                    sub={iaCount > 0 ? 'Questions posees' : 'Commencez maintenant'}
                    color={BLUE}
                    bg="#eff6ff"
                />
            </div>

            {/* Activity Streak */}
            {streakDays > 0 && (
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'linear-gradient(135deg, #e8f8f5 0%, #d1fae5 100%)',
                    border: '1px solid #a7f3d0',
                    borderRadius: 12,
                    padding: '12px 20px',
                    alignSelf: 'flex-start',
                }}>
                    <i className="fas fa-fire" style={{ color: AMBER, fontSize: 20 }}></i>
                    <span style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>
                        <span style={{ color: TEAL, fontSize: 22 }}>{streakDays}</span> jours actifs ce mois
                    </span>
                </div>
            )}

            {!hasAnyActivity && (
                <div style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '32px 28px',
                    border: '1.5px dashed #e5e7eb',
                    textAlign: 'center',
                    color: '#9ca3af',
                }}>
                    <i className="fas fa-seedling" style={{ fontSize: 36, color: '#d1fae5', marginBottom: 14, display: 'block' }}></i>
                    <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Vous debutez votre parcours !</div>
                    <div style={{ fontSize: 13 }}>Completez des quiz, simulations et consultez des fiches pour voir vos statistiques apparaitre ici.</div>
                </div>
            )}

            {/* Charts Row */}
            <div className="prog-grid2" style={{ gap: 20 }}>
                {/* Weekly Activity */}
                <div style={{ background: 'white', borderRadius: 16, padding: '24px 22px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-chart-bar" style={{ color: TEAL, fontSize: 14 }}></i>
                        Activite des 7 derniers jours
                    </h3>
                    <WeeklyBarChart data={weeklyActivity} />
                </div>

                {/* Monthly Scores */}
                <div style={{ background: 'white', borderRadius: 16, padding: '24px 22px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-chart-line" style={{ color: TEAL, fontSize: 14 }}></i>
                        Scores des 6 derniers mois
                    </h3>
                    <MonthlyScoresChart data={monthlyScores} />
                </div>
            </div>

            {/* Strongest / Weakest */}
            {(strongest || weakest) && (
                <div className="prog-grid2" style={{ gap: 20 }}>
                    {/* Strongest */}
                    {strongest && (
                        <div style={{
                            background: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)',
                            border: '1px solid #a7f3d0',
                            borderRadius: 16,
                            padding: '22px 22px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: '#10b98120',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, color: GREEN,
                                }}>
                                    <i className="fas fa-trophy"></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 0.5, textTransform: 'uppercase' }}>Point fort</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{strongest.name || strongest.category_name || 'N/A'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <ProgressBar value={strongest.avg_score ?? strongest.score ?? 0} color={GREEN} height={10} />
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: GREEN, minWidth: 48, textAlign: 'right' }}>
                                    {Math.round(strongest.avg_score ?? strongest.score ?? 0)}<span style={{ fontSize: 12 }}>/100</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weakest */}
                    {weakest && (
                        <div style={{
                            background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
                            border: '1px solid #fcd34d',
                            borderRadius: 16,
                            padding: '22px 22px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: '#f59e0b20',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, color: AMBER,
                                }}>
                                    <i className="fas fa-bullseye"></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, letterSpacing: 0.5, textTransform: 'uppercase' }}>A ameliorer</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{weakest.name || weakest.category_name || 'N/A'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <div style={{ flex: 1 }}>
                                    <ProgressBar value={weakest.avg_score ?? weakest.score ?? 0} color={AMBER} height={10} />
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: AMBER, minWidth: 48, textAlign: 'right' }}>
                                    {Math.round(weakest.avg_score ?? weakest.score ?? 0)}<span style={{ fontSize: 12 }}>/100</span>
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.href = '/evaluations'}
                                style={{
                                    background: AMBER, color: 'white',
                                    border: 'none', borderRadius: 8,
                                    padding: '8px 18px',
                                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                <i className="fas fa-dumbbell"></i>
                                Ameliorer
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Tab 2: Par categorie ───────────────────────────────────────────────────────

function CategoriesTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/api/progress/categories')
            .then(r => setData(r.data?.data || r.data || null))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner message="Chargement des categories..." />;

    const categories = Array.isArray(data) ? data : (data?.categories || []);

    if (!categories || categories.length === 0) return (
        <div style={{ background: 'white', borderRadius: 16, padding: '48px 24px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
            <i className="fas fa-layer-group" style={{ fontSize: 40, color: '#e5e7eb', marginBottom: 16, display: 'block' }}></i>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Aucune categorie encore</div>
            <div style={{ fontSize: 13, color: '#9ca3af', maxWidth: 320, margin: '0 auto' }}>
                Commencez a faire des quiz et simulations pour voir vos progres par categorie.
            </div>
        </div>
    );

    return (
        <div className="prog-grid2" style={{ gap: 20 }}>
            {categories.map((cat, idx) => {
                const quizScore = cat.quiz_avg_score ?? cat.quiz_score ?? 0;
                const simScore = cat.simulation_avg_score ?? cat.simulation_score ?? 0;
                const ficheCount = cat.fiche_count ?? cat.revision_count ?? 0;
                const quizCount = cat.quiz_count ?? 0;
                const simCount = cat.simulation_count ?? 0;
                const overall = cat.overall_score ?? cat.overall_avg ?? Math.round((quizScore + simScore) / 2) ?? 0;

                return (
                    <div key={cat.id || idx} style={{
                        background: 'white',
                        borderRadius: 16,
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                    }}>
                        {/* Card Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1B2A4A 0%, #243758 100%)',
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 10,
                                    background: `${TEAL}30`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, color: TEAL, flexShrink: 0,
                                }}>
                                    <i className={cat.icon || 'fas fa-laptop-code'}></i>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{cat.name || cat.category_name}</div>
                            </div>
                            {/* Overall circle */}
                            <div style={{
                                width: 46, height: 46, borderRadius: '50%',
                                border: `3px solid ${TEAL}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                background: `${TEAL}18`,
                            }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: TEAL }}>{Math.round(overall)}%</span>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Quiz progress */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <i className="fas fa-clipboard-check" style={{ color: TEAL, fontSize: 11 }}></i>
                                        Quiz
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>{Math.round(quizScore)}/100</span>
                                </div>
                                <ProgressBar value={quizScore} color={TEAL} height={7} />
                            </div>

                            {/* Simulations progress */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <i className="fas fa-flask" style={{ color: PURPLE, fontSize: 11 }}></i>
                                        Simulations
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE }}>{Math.round(simScore)}/100</span>
                                </div>
                                <ProgressBar value={simScore} color={PURPLE} height={7} />
                            </div>

                            {/* Fiches */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <i className="fas fa-file-alt" style={{ color: AMBER, fontSize: 11 }}></i>
                                        Fiches de revision
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: AMBER }}>{ficheCount} fiche{ficheCount !== 1 ? 's' : ''}</span>
                                </div>
                                <ProgressBar value={ficheCount > 0 ? Math.min(100, ficheCount * 10) : 0} color={AMBER} height={7} />
                            </div>

                            {/* Mini stats row */}
                            <div style={{
                                display: 'flex', gap: 0,
                                borderTop: '1px solid #f3f4f6',
                                paddingTop: 12,
                                marginTop: 2,
                            }}>
                                {[
                                    { icon: 'fas fa-clipboard-check', val: quizCount, label: 'quiz', color: TEAL },
                                    { icon: 'fas fa-flask', val: simCount, label: 'simul.', color: PURPLE },
                                    { icon: 'fas fa-file-alt', val: ficheCount, label: 'fiches', color: AMBER },
                                ].map((s, i) => (
                                    <div key={i} style={{
                                        flex: 1, textAlign: 'center',
                                        borderRight: i < 2 ? '1px solid #f3f4f6' : 'none',
                                        padding: '0 8px',
                                    }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.val}</div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Tab 3: Analyse IA ──────────────────────────────────────────────────────────

function AIAnalysisTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchAnalysis = () => {
        setLoading(true);
        setError(false);
        api.get('/api/progress/strengths')
            .then(r => setData(r.data?.data || r.data || null))
            .catch(() => { setData(null); setError(true); })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAnalysis();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '72px 24px' }}>
                {/* Animated brain */}
                <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e8f8f5 0%, #d1fae5 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    border: `2px solid ${TEAL}40`,
                    animation: 'ai-pulse 2s ease-in-out infinite',
                }}>
                    <i className="fas fa-brain" style={{ fontSize: 34, color: TEAL }}></i>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 8 }}>
                    L'IA analyse vos performances...
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', maxWidth: 320, margin: '0 auto 20px' }}>
                    Cela peut prendre 10 a 20 secondes. Nous analysons vos quiz, simulations et activites.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                    {[0, 1, 2].map(i => (
                        <span key={i} style={{
                            width: 8, height: 8, borderRadius: '50%', background: TEAL,
                            display: 'inline-block',
                            animation: `typing-bounce 1.2s ease-in-out ${i * 0.3}s infinite`,
                        }} />
                    ))}
                </div>
                <style>{`
                    @keyframes ai-pulse {
                        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(91,188,180,0.3); }
                        50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(91,188,180,0); }
                    }
                    @keyframes typing-bounce {
                        0%, 100% { transform: translateY(0); opacity: 0.4; }
                        50% { transform: translateY(-6px); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: 36, color: AMBER, marginBottom: 14, display: 'block' }}></i>
                <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Analyse indisponible</div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
                    Impossible de generer l'analyse. Completez d'abord quelques quiz et simulations.
                </div>
                <button onClick={fetchAnalysis} style={{
                    background: TEAL, color: 'white', border: 'none', borderRadius: 10,
                    padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                    <i className="fas fa-redo"></i>
                    Reessayer
                </button>
            </div>
        );
    }

    const motivation = data.motivation || data.message || '';
    const strengths = data.strengths || data.points_forts || [];
    const weaknesses = data.weaknesses || data.points_faibles || [];
    const recommendations = data.recommendations || data.recommandations || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Motivation box */}
            {motivation && (
                <div style={{
                    background: 'linear-gradient(135deg, #e8f8f5 0%, #d1fae5 100%)',
                    border: `1.5px solid ${TEAL}60`,
                    borderRadius: 16,
                    padding: '20px 24px',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: TEAL,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: 'white', fontSize: 18,
                    }}>
                        <i className="fas fa-robot"></i>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
                            Message personnalise
                        </div>
                        <p style={{ fontSize: 14, color: NAVY, lineHeight: 1.6, margin: 0 }}>{motivation}</p>
                    </div>
                </div>
            )}

            <div className="prog-grid2" style={{ gap: 20 }}>
                {/* Points forts */}
                {strengths.length > 0 && (
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '22px 22px',
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: GREEN }}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                            Points forts
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(Array.isArray(strengths) ? strengths : []).slice(0, 3).map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: '#d1fae5',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, color: GREEN, flexShrink: 0, marginTop: 1,
                                    }}>
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.55, margin: 0 }}>
                                        {typeof s === 'string' ? s : (s.text || s.description || JSON.stringify(s))}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Points faibles */}
                {weaknesses.length > 0 && (
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '22px 22px',
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: AMBER }}>
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            Points a ameliorer
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(Array.isArray(weaknesses) ? weaknesses : []).slice(0, 3).map((w, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: '#fff7ed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, color: AMBER, flexShrink: 0, marginTop: 1,
                                    }}>
                                        <i className="fas fa-exclamation"></i>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.55, margin: 0 }}>
                                        {typeof w === 'string' ? w : (w.text || w.description || JSON.stringify(w))}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '22px 22px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: BLUE }}>
                            <i className="fas fa-lightbulb"></i>
                        </div>
                        Recommandations personnalisees
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {(Array.isArray(recommendations) ? recommendations : []).slice(0, 5).map((rec, i) => (
                            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #5BBCB4 0%, #1B2A4A 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, color: 'white', fontWeight: 800, flexShrink: 0, marginTop: 1,
                                }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                                        {typeof rec === 'string' ? rec : (rec.text || rec.description || JSON.stringify(rec))}
                                    </p>
                                </div>
                                <i className="fas fa-lightbulb" style={{ color: '#fcd34d', fontSize: 14, marginTop: 3, flexShrink: 0 }}></i>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Regenerate button */}
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <button
                    onClick={fetchAnalysis}
                    style={{
                        background: 'transparent',
                        color: TEAL,
                        border: `2px solid ${TEAL}`,
                        borderRadius: 10,
                        padding: '11px 28px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all .2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEAL; }}
                >
                    <i className="fas fa-sync-alt"></i>
                    Regenerer l'analyse
                </button>
            </div>
        </div>
    );
}

// ── Tab 4: Activite recente ────────────────────────────────────────────────────

function TimelineTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/api/progress/timeline')
            .then(r => setData(r.data?.data || r.data || null))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner message="Chargement de l'activite recente..." />;

    const items = Array.isArray(data) ? data : (data?.items || data?.timeline || []);

    if (!items || items.length === 0) {
        return (
            <div style={{ background: 'white', borderRadius: 16, padding: '56px 24px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
                <i className="fas fa-history" style={{ fontSize: 40, color: '#e5e7eb', marginBottom: 16, display: 'block' }}></i>
                <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Aucune activite recente</div>
                <div style={{ fontSize: 13, color: '#9ca3af', maxWidth: 300, margin: '0 auto' }}>
                    Completez un quiz, une simulation ou consultez une fiche pour voir votre activite ici.
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: 'white', borderRadius: 16, padding: '28px 28px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-history" style={{ color: TEAL }}></i>
                Historique d'activite
            </h3>
            <div style={{ position: 'relative' }}>
                {/* Vertical line */}
                <div style={{
                    position: 'absolute',
                    left: 11,
                    top: 6,
                    bottom: 6,
                    width: 2,
                    background: 'linear-gradient(180deg, #e5e7eb 0%, transparent 100%)',
                    borderRadius: 2,
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {items.map((item, i) => {
                        const color = typeColor(item.type);
                        const label = typeLabel(item.type);
                        const score = item.score ?? item.result ?? null;
                        const title = item.title || item.name || item.subject || 'Activite';
                        const category = item.category_name || item.category || '';
                        const date = item.created_at || item.date || item.completed_at || '';
                        const isLast = i === items.length - 1;

                        return (
                            <div key={item.id || i} style={{
                                display: 'flex',
                                gap: 20,
                                paddingBottom: isLast ? 0 : 24,
                                position: 'relative',
                            }}>
                                {/* Timeline dot */}
                                <div style={{ flexShrink: 0, zIndex: 1, paddingTop: 2 }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: `${color}20`,
                                        border: `2.5px solid ${color}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{
                                    flex: 1,
                                    background: '#f8fafb',
                                    borderRadius: 12,
                                    padding: '14px 18px',
                                    border: '1px solid #f0f0f0',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* Type badge */}
                                            <span style={{
                                                display: 'inline-block',
                                                background: `${color}18`,
                                                color: color,
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '3px 8px',
                                                borderRadius: 5,
                                                letterSpacing: 0.4,
                                                textTransform: 'uppercase',
                                                marginBottom: 6,
                                            }}>
                                                {label}
                                            </span>
                                            {/* Title */}
                                            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.35, marginBottom: 4 }}>
                                                {title}
                                            </div>
                                            {/* Category */}
                                            {category && (
                                                <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <i className="fas fa-folder" style={{ fontSize: 9 }}></i>
                                                    {category}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                                            {/* Score badge */}
                                            {score !== null && score !== undefined && (
                                                <div style={{
                                                    background: score >= 60 ? '#d1fae5' : '#fef3c7',
                                                    color: score >= 60 ? GREEN : AMBER,
                                                    fontSize: 13,
                                                    fontWeight: 800,
                                                    padding: '4px 10px',
                                                    borderRadius: 8,
                                                }}>
                                                    {Math.round(score)}/100
                                                </div>
                                            )}
                                            {/* Relative date */}
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                                <i className="fas fa-clock" style={{ marginRight: 4, fontSize: 9 }}></i>
                                                {relativeDate(date)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TABS = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: 'fas fa-chart-pie' },
    { key: 'categories', label: 'Par categorie', icon: 'fas fa-layer-group' },
    { key: 'ai', label: 'Analyse IA', icon: 'fas fa-brain' },
    { key: 'timeline', label: 'Activite recente', icon: 'fas fa-history' },
];

export default function Progress() {
    const { t } = useLang();
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60, fontFamily: 'inherit' }}>
            <style>{progressCSS}</style>

            {/* ── HEADER ── */}
            <section className="prog-hero" style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #243758 60%, #2d4470 100%)', padding: '48px 0 52px' }}>
                <div style={{ ...W }}>
                    <div className="prog-hero-flex" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div className="prog-icon" style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: `${TEAL}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, color: TEAL, flexShrink: 0,
                            border: `1.5px solid ${TEAL}50`,
                        }}>
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div>
                            <span style={{ color: TEAL, fontWeight: 700, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                                Suivi personnalise
                            </span>
                            <h1 style={{ fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.2 }}>
                                Rapports de Progression
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '6px 0 0', maxWidth: 480 }}>
                                Suivez vos performances et identifiez vos axes d'amelioration
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TABS ── */}
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ ...W }}>
                    <div className="prog-tabs">
                        {TABS.map(tab => {
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '16px 22px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: active ? `3px solid ${TEAL}` : '3px solid transparent',
                                        color: active ? TEAL : '#6b7280',
                                        fontWeight: active ? 700 : 500,
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all .15s',
                                        marginBottom: -1,
                                    }}
                                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = NAVY; } }}
                                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#6b7280'; } }}
                                >
                                    <i className={tab.icon} style={{ fontSize: 13 }}></i>
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{ ...W, marginTop: 32 }}>
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'categories' && <CategoriesTab />}
                {activeTab === 'ai' && <AIAnalysisTab />}
                {activeTab === 'timeline' && <TimelineTab />}
            </div>

        </div>
    );
}
