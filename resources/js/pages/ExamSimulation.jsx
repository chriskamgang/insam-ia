import { useEffect, useState, useRef, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatMMSS(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${pad(m)}:${pad(s)}`;
}

function scoreColor(score) {
    if (score === null || score === undefined) return '#9ca3af';
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
}

function scoreBg(score) {
    if (score === null || score === undefined) return '#f3f4f6';
    if (score >= 70) return '#d1fae5';
    if (score >= 50) return '#fef3c7';
    return '#fee2e2';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Simple markdown renderer: handles **bold**, ## headings, - bullets, newlines
function renderMarkdown(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const elements = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Heading ## or ###
        if (/^###\s/.test(line)) {
            elements.push(
                <h4 key={key++} style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '16px 0 6px' }}>
                    {inlineFormat(line.replace(/^###\s/, ''))}
                </h4>
            );
        } else if (/^##\s/.test(line)) {
            elements.push(
                <h3 key={key++} style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: '20px 0 8px', paddingBottom: 6, borderBottom: `2px solid ${TEAL}30` }}>
                    {inlineFormat(line.replace(/^##\s/, ''))}
                </h3>
            );
        } else if (/^#\s/.test(line)) {
            elements.push(
                <h2 key={key++} style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: '24px 0 10px' }}>
                    {inlineFormat(line.replace(/^#\s/, ''))}
                </h2>
            );
        // Bullet point
        } else if (/^[-*]\s/.test(line)) {
            elements.push(
                <div key={key++} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 5 }}>
                    <span style={{ color: TEAL, fontWeight: 700, marginTop: 2, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                        {inlineFormat(line.replace(/^[-*]\s/, ''))}
                    </span>
                </div>
            );
        // Empty line → spacer
        } else if (line.trim() === '') {
            elements.push(<div key={key++} style={{ height: 8 }} />);
        // Normal paragraph
        } else {
            elements.push(
                <p key={key++} style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '0 0 8px' }}>
                    {inlineFormat(line)}
                </p>
            );
        }
    }
    return elements;
}

function inlineFormat(text) {
    // Handle **bold**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
            return <strong key={i} style={{ color: NAVY, fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}

const DURATIONS = [30, 45, 60, 90, 120];

// ── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({ exam, onClose, onStart }) {
    const [duration, setDuration] = useState(60);
    const [starting, setStarting] = useState(false);

    const handleStart = async () => {
        setStarting(true);
        await onStart(exam, duration);
        setStarting(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: 'white', borderRadius: 20, width: '100%', maxWidth: 480,
                boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    background: `linear-gradient(135deg, ${NAVY}, #243758)`,
                    padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                            <i className="fas fa-clock"></i>
                        </div>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Lancer la simulation</h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
                        color: 'white', width: 30, height: 30, cursor: 'pointer', fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 28 }}>
                    {/* Exam info */}
                    <div style={{
                        background: '#f8fafb', borderRadius: 12, padding: '14px 18px',
                        marginBottom: 24, border: '1px solid #f0f0f0',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{exam.title}</div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {exam.category_name && (
                                <span style={{ fontSize: 11, color: '#6b7280' }}>
                                    <i className="fas fa-tag" style={{ marginRight: 4, color: TEAL }}></i>{exam.category_name}
                                </span>
                            )}
                            {exam.annee && (
                                <span style={{ fontSize: 11, color: '#6b7280' }}>
                                    <i className="fas fa-calendar" style={{ marginRight: 4, color: TEAL }}></i>{exam.annee}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Duration picker */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 12 }}>
                            <i className="fas fa-hourglass-half" style={{ marginRight: 7, color: TEAL }}></i>
                            Choisissez la duree
                        </label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {DURATIONS.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    style={{
                                        padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                                        border: duration === d ? `2px solid ${TEAL}` : '2px solid #e5e7eb',
                                        background: duration === d ? '#e8f8f5' : 'white',
                                        color: duration === d ? TEAL : '#6b7280',
                                    }}
                                >
                                    {d} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Warning */}
                    <div style={{
                        background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10,
                        padding: '12px 16px', marginBottom: 24,
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}>
                        <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: 14, marginTop: 1, flexShrink: 0 }}></i>
                        <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                            Une fois lance, le chronometre ne peut pas etre mis en pause. Assurez-vous d'etre pret avant de commencer.
                        </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '12px', borderRadius: 10,
                                border: '1.5px solid #e5e7eb', background: 'white',
                                color: '#6b7280', fontWeight: 600, fontSize: 14,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleStart}
                            disabled={starting}
                            style={{
                                flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                                background: starting ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                color: 'white', fontWeight: 700, fontSize: 14,
                                cursor: starting ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                boxShadow: starting ? 'none' : '0 4px 12px rgba(91,188,180,0.35)',
                            }}
                        >
                            {starting
                                ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }}></i>Lancement...</>
                                : <><i className="fas fa-play" style={{ marginRight: 8 }}></i>Commencer ({duration} min)</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Exam Card (list view) ─────────────────────────────────────────────────────
function ExamCard({ exam, onStart }) {
    return (
        <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #f0f0f0',
            overflow: 'hidden', transition: 'all .2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column',
        }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(91,188,180,0.12)';
                e.currentTarget.style.borderColor = `${TEAL}50`;
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{ height: 5, background: `linear-gradient(90deg, ${TEAL}, ${NAVY})` }} />

            <div style={{ padding: '18px 20px', flex: 1 }}>
                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {exam.annee && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>
                            <i className="fas fa-calendar" style={{ marginRight: 4 }}></i>{exam.annee}
                        </span>
                    )}
                    {exam.niveau && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6' }}>
                            {exam.niveau}
                        </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#e8f8f5', color: TEAL }}>
                        <i className="fas fa-clock" style={{ marginRight: 4 }}></i>60 min
                    </span>
                </div>

                {/* Icon + Title */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: '#f0fdf9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: TEAL,
                    }}>
                        <i className="fas fa-file-alt"></i>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.45, margin: 0 }}>
                        {exam.title}
                    </h3>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {exam.matiere && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6b7280' }}>
                            <i className="fas fa-book" style={{ color: '#9ca3af', width: 12 }}></i>
                            <span>{exam.matiere}</span>
                        </div>
                    )}
                    {exam.category_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6b7280' }}>
                            <i className="fas fa-tag" style={{ color: '#9ca3af', width: 12 }}></i>
                            <span>{exam.category_name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '12px 20px', borderTop: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            }}>
                <button
                    onClick={() => onStart(exam)}
                    style={{
                        background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                        color: 'white', border: 'none', borderRadius: 20,
                        padding: '8px 20px', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                        fontFamily: 'inherit', transition: 'all .2s',
                        boxShadow: '0 2px 8px rgba(91,188,180,0.30)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,188,180,0.45)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(91,188,180,0.30)'}
                >
                    <i className="fas fa-play"></i>
                    Commencer
                </button>
            </div>
        </div>
    );
}

// ── Simulation Row (results tab) ──────────────────────────────────────────────
function SimulationRow({ sim, onView }) {
    const score = sim.score;
    return (
        <div style={{
            background: 'white', borderRadius: 14, border: '1px solid #f0f0f0',
            padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16,
            transition: 'all .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
        }}
            onClick={() => onView(sim)}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(91,188,180,0.10)';
                e.currentTarget.style.borderColor = `${TEAL}40`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#f0f0f0';
            }}
        >
            {/* Score badge */}
            <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: scoreBg(score),
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                {score !== null && score !== undefined
                    ? <>
                        <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>{score}</span>
                        <span style={{ fontSize: 9, color: scoreColor(score), fontWeight: 600 }}>/100</span>
                    </>
                    : <i className="fas fa-hourglass-half" style={{ color: '#9ca3af', fontSize: 16 }}></i>
                }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sim.exam?.title || sim.exam_title || 'Examen'}
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                        <i className="fas fa-calendar" style={{ marginRight: 4 }}></i>
                        {formatDate(sim.created_at)}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                        <i className="fas fa-clock" style={{ marginRight: 4 }}></i>
                        {sim.duration_minutes} min
                    </span>
                    {sim.exam?.category_name && (
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            <i className="fas fa-tag" style={{ marginRight: 4 }}></i>
                            {sim.exam.category_name}
                        </span>
                    )}
                </div>
            </div>

            {/* Status */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                {sim.status === 'completed' ? (
                    <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                        background: scoreBg(score), color: scoreColor(score),
                    }}>
                        {score >= 70 ? 'Reussi' : score >= 50 ? 'Passable' : 'A revoir'}
                    </span>
                ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#fef3c7', color: '#b45309' }}>
                        En cours
                    </span>
                )}
                <i className="fas fa-chevron-right" style={{ fontSize: 11, color: '#d1d5db' }}></i>
            </div>
        </div>
    );
}

// ── Score Circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score }) {
    const color = scoreColor(score);
    const radius = 60;
    const circ = 2 * Math.PI * radius;
    const pct = Math.min(Math.max(score || 0, 0), 100);
    const dashOffset = circ - (pct / 100) * circ;

    return (
        <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
            <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle
                    cx="80" cy="80" r={radius}
                    fill="none" stroke={color} strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>{score ?? '–'}</span>
                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>/100</span>
            </div>
        </div>
    );
}

// ── AI Loading Screen ─────────────────────────────────────────────────────────
function AILoadingScreen() {
    const [dot, setDot] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setDot(d => (d + 1) % 4), 500);
        return () => clearInterval(t);
    }, []);

    const dots = '.'.repeat(dot);

    return (
        <div style={{
            minHeight: 'calc(100vh - 64px)',
            background: `linear-gradient(135deg, ${NAVY} 0%, #243758 60%, #2d4470 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{ textAlign: 'center', padding: 40 }}>
                {/* Animated brain/AI icon */}
                <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'rgba(91,188,180,0.15)',
                    border: `3px solid ${TEAL}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                    animation: 'pulse 2s infinite',
                    fontSize: 42, color: TEAL,
                }}>
                    <i className="fas fa-robot"></i>
                </div>

                {/* Pulsing dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: TEAL,
                            opacity: dot === i ? 1 : 0.3,
                            transition: 'opacity .3s',
                        }} />
                    ))}
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10 }}>
                    L'IA evalue vos reponses{dots}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 360, margin: '0 auto', lineHeight: 1.7 }}>
                    Notre intelligence artificielle analyse votre copie et prepare un retour personnalise. Cela peut prendre quelques secondes.
                </p>

                <style>{`
                    @keyframes pulse {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(91,188,180,0.3); }
                        50% { box-shadow: 0 0 0 20px rgba(91,188,180,0); }
                    }
                `}</style>
            </div>
        </div>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ExamSimulation() {
    const { t } = useLang();

    // View state: 'list' | 'simulation' | 'evaluating' | 'results'
    const [view, setView] = useState('list');
    const [activeTab, setActiveTab] = useState('start'); // 'start' | 'results'

    // List view data
    const [exams, setExams] = useState([]);
    const [simulations, setSimulations] = useState([]);
    const [stats, setStats] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [loadingExams, setLoadingExams] = useState(true);
    const [loadingSims, setLoadingSims] = useState(true);

    // Confirmation modal
    const [confirmExam, setConfirmExam] = useState(null);

    // Active simulation
    const [activeSimulation, setActiveSimulation] = useState(null); // { id, exam, duration_minutes }
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [answers, setAnswers] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [autoSubmitted, setAutoSubmitted] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]); // base64 data URLs
    const imageInputRef = useRef(null);
    const timerRef = useRef(null);

    // Results view
    const [currentResult, setCurrentResult] = useState(null);

    // Error
    const [error, setError] = useState(null);

    // ── Data Fetching ──────────────────────────────────────────────────────────

    const fetchExams = useCallback(() => {
        setLoadingExams(true);
        const params = categoryFilter ? `?category_id=${categoryFilter}` : '';
        api.get(`/api/exams${params}`)
            .then(r => setExams(r.data?.exams || r.data?.data || []))
            .catch(() => setExams([]))
            .finally(() => setLoadingExams(false));
    }, [categoryFilter]);

    const fetchSimulations = useCallback(() => {
        setLoadingSims(true);
        api.get('/api/exam-simulations')
            .then(r => setSimulations(r.data?.data || r.data || []))
            .catch(() => setSimulations([]))
            .finally(() => setLoadingSims(false));
    }, []);

    const fetchStats = useCallback(() => {
        api.get('/api/exam-simulations-stats')
            .then(r => setStats(r.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        api.get('/api/public/categories')
            .then(r => setCategories(r.data?.data || []))
            .catch(() => {});
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    useEffect(() => {
        if (activeTab === 'results') {
            fetchSimulations();
        }
    }, [activeTab, fetchSimulations]);

    // ── Timer Logic ────────────────────────────────────────────────────────────

    const handleAutoSubmit = useCallback(async () => {
        if (autoSubmitted || submitting) return;
        setAutoSubmitted(true);
        clearInterval(timerRef.current);
        setView('evaluating');
        setSubmitting(true);
        try {
            const { data } = await api.post(`/api/exam-simulations/${activeSimulation.id}/submit`, {
                answers: answers,
            });
            setCurrentResult(data);
            fetchSimulations();
            fetchStats();
            setView('results');
        } catch (err) {
            setError('Erreur lors de la soumission automatique. Veuillez reessayer.');
            setView('simulation');
            setAutoSubmitted(false);
        } finally {
            setSubmitting(false);
        }
    }, [activeSimulation, answers, autoSubmitted, submitting, fetchSimulations, fetchStats]);

    useEffect(() => {
        if (view !== 'simulation' || secondsLeft === null) return;

        if (secondsLeft <= 0) {
            handleAutoSubmit();
            return;
        }

        timerRef.current = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [view]); // Only re-run when view changes (timer starts when simulation begins)

    // Watch for secondsLeft hitting 0
    useEffect(() => {
        if (view === 'simulation' && secondsLeft === 0 && activeSimulation) {
            handleAutoSubmit();
        }
    }, [secondsLeft, view, activeSimulation, handleAutoSubmit]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleStartConfirm = async (exam, duration) => {
        setError(null);
        try {
            const { data } = await api.post('/api/exam-simulations/start', {
                exam_id: exam.id,
                duration_minutes: duration,
            });
            const sim = data?.data || data;
            setActiveSimulation(sim);
            setSecondsLeft(duration * 60);
            setAnswers('');
            setAutoSubmitted(false);
            setConfirmExam(null);
            setView('simulation');
        } catch (err) {
            const msg = err.response?.data?.message || 'Impossible de lancer la simulation.';
            setError(msg);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        files.forEach(file => {
            if (uploadedImages.length >= 5) return;
            const reader = new FileReader();
            reader.onload = () => {
                setUploadedImages(prev => prev.length < 5 ? [...prev, reader.result] : prev);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeImage = (idx) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== idx));
    };

    const handleManualSubmit = async () => {
        if (submitting || !activeSimulation) return;
        if (!answers.trim() && uploadedImages.length === 0) {
            setError('Veuillez rediger vos reponses ou ajouter des photos de votre copie.');
            return;
        }
        setError(null);
        clearInterval(timerRef.current);
        setView('evaluating');
        setSubmitting(true);
        try {
            let data;
            if (uploadedImages.length > 0) {
                // Use image-based correction
                const exam = activeSimulation.exam || activeSimulation;
                const res = await api.post('/api/exams/correct-image', {
                    exam_id: exam.id,
                    images: uploadedImages,
                    text_answers: answers || '',
                    time_spent: (activeSimulation.duration_minutes * 60) - secondsLeft,
                });
                // Also submit to simulation endpoint for history
                try {
                    await api.post(`/api/exam-simulations/${activeSimulation.id}/submit`, {
                        answers: '[Reponses soumises par photo] ' + (answers || ''),
                    });
                } catch {}
                data = {
                    score: res.data.correction?.note ? (res.data.correction.note / 20) * 100 : null,
                    ai_feedback: res.data.correction?.details || '',
                    exam: exam,
                };
            } else {
                const res = await api.post(`/api/exam-simulations/${activeSimulation.id}/submit`, {
                    answers: answers,
                });
                data = res.data;
            }
            setCurrentResult(data);
            fetchSimulations();
            fetchStats();
            setView('results');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la soumission.');
            setView('simulation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewResult = async (sim) => {
        if (sim.ai_feedback || sim.score !== null) {
            setCurrentResult(sim);
            setView('results');
        } else {
            try {
                const { data } = await api.get(`/api/exam-simulations/${sim.id}`);
                setCurrentResult(data?.data || data);
                setView('results');
            } catch {
                setCurrentResult(sim);
                setView('results');
            }
        }
    };

    const handleBackToList = () => {
        clearInterval(timerRef.current);
        setView('list');
        setActiveSimulation(null);
        setCurrentResult(null);
        setAnswers('');
        setError(null);
        setActiveTab('results');
        fetchSimulations();
        fetchStats();
    };

    const handleNewSimulation = () => {
        clearInterval(timerRef.current);
        setView('list');
        setActiveSimulation(null);
        setCurrentResult(null);
        setAnswers('');
        setError(null);
        setActiveTab('start');
    };

    // Timer display helpers
    const isTimeLow = secondsLeft <= 300; // 5 min
    const timerColor = isTimeLow ? '#ef4444' : NAVY;

    // ── EVALUATING SCREEN ──────────────────────────────────────────────────────
    if (view === 'evaluating') {
        return <AILoadingScreen />;
    }

    // ── SIMULATION VIEW ────────────────────────────────────────────────────────
    if (view === 'simulation' && activeSimulation) {
        const exam = activeSimulation.exam || activeSimulation;
        const fileUrl = exam.file_path
            ? `/api/exams/view-pdf?path=${encodeURIComponent(exam.file_path)}#toolbar=0&navpanes=0`
            : null;

        return (
            <div style={{ background: '#F8FAFB', minHeight: 'calc(100vh - 64px)' }}>

                {/* Sticky top bar */}
                <div style={{
                    position: 'sticky', top: 0, zIndex: 50,
                    background: 'white', borderBottom: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    padding: '0 24px',
                }}>
                    <div style={{
                        maxWidth: 1200, margin: '0 auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        height: 64, gap: 16,
                    }}>
                        {/* Exam title */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: TEAL, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Simulation en cours
                            </div>
                            <div style={{
                                fontSize: 14, fontWeight: 700, color: NAVY,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {exam.title}
                            </div>
                        </div>

                        {/* Timer */}
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            minWidth: 120,
                        }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                                Temps restant
                            </div>
                            <div style={{
                                fontSize: 28, fontWeight: 800, color: timerColor,
                                fontVariantNumeric: 'tabular-nums', letterSpacing: 1,
                                animation: isTimeLow ? 'timerPulse 1s infinite' : 'none',
                            }}>
                                {formatMMSS(secondsLeft)}
                            </div>
                            <style>{`
                                @keyframes timerPulse {
                                    0%, 100% { opacity: 1; }
                                    50% { opacity: 0.5; }
                                }
                            `}</style>
                        </div>

                        {/* Submit button */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleManualSubmit}
                                disabled={submitting}
                                style={{
                                    background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                    color: 'white', border: 'none', borderRadius: 10,
                                    padding: '10px 22px', fontSize: 14, fontWeight: 700,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    boxShadow: '0 3px 10px rgba(91,188,180,0.35)',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    opacity: submitting ? 0.7 : 1,
                                }}
                            >
                                <i className="fas fa-paper-plane"></i>
                                Soumettre
                            </button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 3, background: '#f3f4f6' }}>
                        <div style={{
                            height: '100%',
                            background: isTimeLow ? '#ef4444' : TEAL,
                            width: `${(secondsLeft / (activeSimulation.duration_minutes * 60)) * 100}%`,
                            transition: 'width 1s linear, background .5s',
                        }} />
                    </div>
                </div>

                {/* Main content: PDF left + answers right */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 64px)' }}>

                    {/* Left: PDF viewer */}
                    {fileUrl ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `2px solid ${TEAL}30` }}>
                            <iframe
                                src={fileUrl}
                                style={{ flex: 1, border: 'none', background: 'white' }}
                                title={exam.title}
                            />
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                <i className="fas fa-file-pdf" style={{ fontSize: 48, marginBottom: 12, color: '#e5e7eb' }}></i>
                                <p style={{ fontSize: 14 }}>Aucun fichier PDF disponible pour ce sujet.</p>
                                <p style={{ fontSize: 12 }}>Redigez vos reponses directement.</p>
                            </div>
                        </div>
                    )}

                    {/* Right: Answer panel */}
                    <div style={{
                        width: 440, flexShrink: 0, display: 'flex', flexDirection: 'column',
                        background: '#f8fafb',
                    }}>
                        {error && (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fecaca',
                                padding: '8px 14px', margin: '10px 14px 0',
                                borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center',
                            }}>
                                <i className="fas fa-exclamation-circle" style={{ color: '#ef4444', flexShrink: 0, fontSize: 12 }}></i>
                                <span style={{ fontSize: 12, color: '#b91c1c', flex: 1 }}>{error}</span>
                                <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 11 }}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        )}

                        {/* Answer header */}
                        <div style={{
                            padding: '14px 18px', borderBottom: '1px solid #e5e7eb',
                            display: 'flex', alignItems: 'center', gap: 10, background: 'white',
                        }}>
                            <i className="fas fa-pen-alt" style={{ color: TEAL, fontSize: 14 }}></i>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Vos reponses</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>Lisez le sujet a gauche et redigez ici</div>
                            </div>
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={answers}
                            onChange={e => setAnswers(e.target.value)}
                            placeholder={"Redigez vos reponses ici...\nOu utilisez le bouton photo ci-dessous pour envoyer une photo de votre copie papier."}
                            style={{
                                flex: 1, border: 'none', outline: 'none', resize: 'none',
                                padding: '16px 18px', fontSize: 13, lineHeight: 1.7,
                                fontFamily: 'inherit', color: '#1e293b', background: 'white',
                                minHeight: uploadedImages.length > 0 ? 80 : undefined,
                            }}
                        />

                        {/* Image upload section */}
                        {uploadedImages.length > 0 && (
                            <div style={{ padding: '8px 14px', background: '#f8fafb', borderTop: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {uploadedImages.map((img, i) => (
                                        <div key={i} style={{ position: 'relative', width: 70, height: 70, borderRadius: 8, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                                            <img src={img} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button onClick={() => removeImage(i)}
                                                style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: 10, color: '#9ca3af', margin: '6px 0 0' }}>
                                    {uploadedImages.length}/5 photo{uploadedImages.length > 1 ? 's' : ''} — L'IA analysera vos reponses manuscrites
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{
                            padding: '10px 14px', borderTop: '1px solid #e5e7eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'white', gap: 8,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    capture="environment"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={uploadedImages.length >= 5}
                                    style={{
                                        background: uploadedImages.length > 0 ? '#e8f8f5' : '#f3f4f6',
                                        color: uploadedImages.length > 0 ? TEAL : '#6b7280',
                                        border: uploadedImages.length > 0 ? `1.5px solid ${TEAL}` : '1.5px solid #e5e7eb',
                                        borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600,
                                        cursor: uploadedImages.length >= 5 ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                                    }}
                                >
                                    <i className="fas fa-camera"></i> Photo
                                    {uploadedImages.length > 0 && <span style={{ fontSize: 10 }}>({uploadedImages.length})</span>}
                                </button>
                                <span style={{ fontSize: 10, color: '#9ca3af' }}>
                                    {answers.length > 0 ? `${answers.length} car.` : ''}
                                </span>
                            </div>
                            <button
                                onClick={handleManualSubmit}
                                disabled={submitting}
                                style={{
                                    background: submitting ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                    color: 'white', border: 'none', borderRadius: 10,
                                    padding: '9px 16px', fontSize: 12, fontWeight: 700,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    boxShadow: submitting ? 'none' : '0 3px 10px rgba(91,188,180,0.30)',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                {submitting ? (
                                    <><i className="fas fa-circle-notch fa-spin"></i> Correction...</>
                                ) : (
                                    <><i className="fas fa-paper-plane"></i> Soumettre</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── RESULTS VIEW ───────────────────────────────────────────────────────────
    if (view === 'results' && currentResult) {
        const score = currentResult.score ?? currentResult.percentage ?? null;
        const feedback = currentResult.ai_feedback || currentResult.feedback || '';
        const exam = currentResult.exam || currentResult;

        return (
            <div style={{ background: '#F8FAFB', minHeight: 'calc(100vh - 64px)', paddingBottom: 60 }}>

                {/* Header */}
                <div style={{
                    background: `linear-gradient(165deg, ${NAVY} 0%, #243758 60%, #2d4470 100%)`,
                    padding: '48px 0 52px',
                }}>
                    <div style={{ ...W, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
                            <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>
                            Simulation terminee
                        </div>

                        <ScoreCircle score={score} />

                        <div style={{ marginTop: 20 }}>
                            <div style={{
                                fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6,
                            }}>
                                {score !== null
                                    ? (score >= 70 ? 'Excellent travail !' : score >= 50 ? 'Travail correct' : 'A renforcer')
                                    : 'Evaluation terminee'
                                }
                            </div>
                            {exam?.title && (
                                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                                    {exam.title}
                                </div>
                            )}
                        </div>

                        {/* Mini stats */}
                        {score !== null && (
                            <div style={{
                                display: 'inline-flex', gap: 28, marginTop: 24,
                                background: 'rgba(255,255,255,0.08)', borderRadius: 14,
                                padding: '14px 28px', border: '1px solid rgba(255,255,255,0.12)',
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171' }}>
                                        {score}/100
                                    </div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Score</div>
                                </div>
                                {currentResult.duration_minutes && <>
                                    <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{currentResult.duration_minutes} min</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Duree</div>
                                    </div>
                                </>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback */}
                <div style={{ ...W, padding: '32px 24px' }}>
                    {feedback ? (
                        <div style={{
                            background: 'white', borderRadius: 16, border: '1px solid #f0f0f0',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
                            marginBottom: 24,
                        }}>
                            <div style={{
                                padding: '18px 28px', borderBottom: '1px solid #f3f4f6',
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: '#e8f8f5',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: TEAL, fontSize: 16,
                                }}>
                                    <i className="fas fa-robot"></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>Correction par IA</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Analyse detaillee de votre copie</div>
                                </div>
                            </div>
                            <div style={{ padding: '24px 28px' }}>
                                {renderMarkdown(feedback)}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: 'white', borderRadius: 16, border: '1px solid #f0f0f0',
                            padding: '40px', textAlign: 'center', marginBottom: 24,
                        }}>
                            <i className="fas fa-clock" style={{ fontSize: 32, color: '#d1d5db', marginBottom: 12, display: 'block' }}></i>
                            <p style={{ color: '#9ca3af', fontSize: 14 }}>L'evaluation IA n'est pas encore disponible pour cette simulation.</p>
                        </div>
                    )}

                    {/* Your answers recap */}
                    {currentResult.answers && (
                        <div style={{
                            background: 'white', borderRadius: 16, border: '1px solid #f0f0f0',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
                            marginBottom: 24,
                        }}>
                            <div style={{
                                padding: '16px 28px', borderBottom: '1px solid #f3f4f6',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <i className="fas fa-pen-alt" style={{ color: TEAL, fontSize: 14 }}></i>
                                <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Votre copie</span>
                            </div>
                            <div style={{ padding: '20px 28px' }}>
                                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {currentResult.answers}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button
                            onClick={handleNewSimulation}
                            style={{
                                flex: 1, minWidth: 200, padding: '14px 28px', borderRadius: 12,
                                background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                color: 'white', border: 'none', fontWeight: 700, fontSize: 14,
                                cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            <i className="fas fa-play"></i>
                            Nouvelle simulation
                        </button>
                        <button
                            onClick={handleBackToList}
                            style={{
                                flex: 1, minWidth: 200, padding: '14px 28px', borderRadius: 12,
                                background: 'white', color: NAVY,
                                border: `1.5px solid #e5e7eb`, fontWeight: 600, fontSize: 14,
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            <i className="fas fa-list"></i>
                            Retour a la liste
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── LIST VIEW ──────────────────────────────────────────────────────────────
    return (
        <div style={{ background: '#F8FAFB', minHeight: 'calc(100vh - 64px)', paddingBottom: 60 }}>

            {/* Header */}
            <div style={{
                background: `linear-gradient(165deg, ${NAVY} 0%, #243758 60%, #2d4470 100%)`,
                padding: '48px 0 0',
            }}>
                <div style={W}>
                    <div style={{ marginBottom: 32 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: 1, textTransform: 'uppercase' }}>
                            <i className="fas fa-clock" style={{ marginRight: 6 }}></i>
                            INSAM-IA
                        </span>
                        <h1 style={{ fontSize: 30, fontWeight: 800, color: 'white', margin: '10px 0 10px', lineHeight: 1.2 }}>
                            Simulation d'Examen
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
                            Testez-vous en conditions reelles avec chronometre et correction IA
                        </p>
                    </div>

                    {/* Stats row */}
                    {stats && (
                        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', marginBottom: 0 }}>
                            {[
                                { icon: 'fas fa-clipboard-list', val: stats.total ?? 0, label: 'Simulations', color: TEAL },
                                { icon: 'fas fa-chart-bar', val: stats.average_score != null ? `${Math.round(stats.average_score)}/100` : '–', label: 'Score moyen', color: '#fbbf24' },
                                { icon: 'fas fa-trophy', val: stats.best_score != null ? `${stats.best_score}/100` : '–', label: 'Meilleur score', color: '#34d399' },
                                { icon: 'fas fa-check-circle', val: stats.completed ?? 0, label: 'Terminees', color: '#818cf8' },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '18px 28px',
                                    borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: `${s.color}18`,
                                        border: `1px solid ${s.color}30`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: s.color, fontSize: 16,
                                    }}>
                                        <i className={s.icon}></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1 }}>{s.val}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 0, marginTop: stats ? 8 : 0 }}>
                        {[
                            { key: 'start', label: 'Lancer une simulation', icon: 'fas fa-play' },
                            { key: 'results', label: 'Mes resultats', icon: 'fas fa-chart-line' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '14px 28px', fontSize: 14, fontWeight: 700,
                                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                    background: 'transparent', transition: 'all .15s',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    color: activeTab === tab.key ? TEAL : 'rgba(255,255,255,0.55)',
                                    borderBottom: activeTab === tab.key ? `3px solid ${TEAL}` : '3px solid transparent',
                                    marginBottom: -1,
                                }}
                            >
                                <i className={tab.icon}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ ...W, padding: '32px 24px' }}>

                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                        padding: '12px 16px', marginBottom: 20,
                        display: 'flex', gap: 10, alignItems: 'center',
                    }}>
                        <i className="fas fa-exclamation-circle" style={{ color: '#ef4444', flexShrink: 0 }}></i>
                        <span style={{ fontSize: 13, color: '#b91c1c' }}>{error}</span>
                        <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}

                {/* ── TAB: Start simulation ── */}
                {activeTab === 'start' && (
                    <div>
                        {/* Category filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', minWidth: 200 }}>
                                <i className="fas fa-tag" style={{
                                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                    color: '#9ca3af', fontSize: 13, pointerEvents: 'none',
                                }}></i>
                                <select
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                    style={{
                                        paddingLeft: 34, paddingRight: 32, paddingTop: 10, paddingBottom: 10,
                                        border: `1.5px solid ${categoryFilter ? TEAL : '#e5e7eb'}`,
                                        borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
                                        color: categoryFilter ? NAVY : '#6b7280',
                                        background: categoryFilter ? '#f0fdf9' : 'white',
                                        cursor: 'pointer', outline: 'none', appearance: 'none',
                                        fontWeight: categoryFilter ? 600 : 400,
                                        minWidth: 200,
                                    }}
                                >
                                    <option value="">Toutes les categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <i className="fas fa-chevron-down" style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    fontSize: 10, color: '#9ca3af', pointerEvents: 'none',
                                }}></i>
                            </div>

                            {!loadingExams && (
                                <span style={{ fontSize: 13, color: '#6b7280' }}>
                                    {exams.length} examen{exams.length !== 1 ? 's' : ''} disponible{exams.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Loading */}
                        {loadingExams && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} style={{ background: 'white', borderRadius: 16, height: 200, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                                        <div style={{ height: 5, background: '#f3f4f6' }} />
                                        <div style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                                                <div style={{ width: 60, height: 20, borderRadius: 10, background: '#f3f4f6' }} />
                                                <div style={{ width: 50, height: 20, borderRadius: 10, background: '#f3f4f6' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', flexShrink: 0 }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ width: '80%', height: 14, borderRadius: 4, background: '#f3f4f6', marginBottom: 8 }} />
                                                    <div style={{ width: '55%', height: 12, borderRadius: 4, background: '#f3f4f6' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty */}
                        {!loadingExams && exams.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20,
                                    background: '#f3f4f6', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 20px', fontSize: 34, color: '#d1d5db',
                                }}>
                                    <i className="fas fa-file-alt"></i>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                                    Aucun examen disponible
                                </h3>
                                <p style={{ color: '#9ca3af', fontSize: 14 }}>
                                    {categoryFilter ? 'Aucun examen pour cette categorie.' : 'Aucun examen disponible pour le moment.'}
                                </p>
                                {categoryFilter && (
                                    <button
                                        onClick={() => setCategoryFilter('')}
                                        style={{
                                            marginTop: 16, background: TEAL, color: 'white',
                                            border: 'none', borderRadius: 10, padding: '10px 24px',
                                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                        }}
                                    >
                                        Voir tous les examens
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Grid */}
                        {!loadingExams && exams.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                {exams.map(exam => (
                                    <ExamCard
                                        key={exam.id}
                                        exam={exam}
                                        onStart={e => setConfirmExam(e)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: My results ── */}
                {activeTab === 'results' && (
                    <div>
                        {loadingSims && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{
                                        background: 'white', borderRadius: 14, padding: '20px 22px',
                                        border: '1px solid #f0f0f0', display: 'flex', gap: 16, alignItems: 'center',
                                    }}>
                                        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f3f4f6', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ width: '50%', height: 14, borderRadius: 4, background: '#f3f4f6', marginBottom: 8 }} />
                                            <div style={{ width: '30%', height: 11, borderRadius: 4, background: '#f3f4f6' }} />
                                        </div>
                                        <div style={{ width: 80, height: 28, borderRadius: 10, background: '#f3f4f6' }} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loadingSims && simulations.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20,
                                    background: '#f3f4f6', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 20px', fontSize: 34, color: '#d1d5db',
                                }}>
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                                    Aucune simulation pour le moment
                                </h3>
                                <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
                                    Lancez votre premiere simulation pour voir vos resultats ici.
                                </p>
                                <button
                                    onClick={() => setActiveTab('start')}
                                    style={{
                                        background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                        color: 'white', border: 'none', borderRadius: 10,
                                        padding: '12px 28px', fontSize: 14, fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        boxShadow: '0 4px 12px rgba(91,188,180,0.35)',
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                    }}
                                >
                                    <i className="fas fa-play"></i>
                                    Lancer une simulation
                                </button>
                            </div>
                        )}

                        {!loadingSims && simulations.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {simulations.map(sim => (
                                    <SimulationRow
                                        key={sim.id}
                                        sim={sim}
                                        onView={handleViewResult}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirmation modal */}
            {confirmExam && (
                <ConfirmModal
                    exam={confirmExam}
                    onClose={() => setConfirmExam(null)}
                    onStart={handleStartConfirm}
                />
            )}
        </div>
    );
}
