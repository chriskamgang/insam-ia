import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';

function pad(n) {
    return String(n).padStart(2, '0');
}

export default function QuizPlay() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Quiz state
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});   // { questionId: selectedIndex }
    const [secondsLeft, setSecondsLeft] = useState(null);
    const timerRef = useRef(null);

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);   // { score, total, percentage, passed }

    /* ── FETCH QUIZ ── */
    useEffect(() => {
        api.get(`/api/quizzes/${id}`)
            .then(r => {
                const q = r.data.data || r.data;
                setQuiz(q);
                if (q.duration_minutes) {
                    setSecondsLeft(q.duration_minutes * 60);
                }
            })
            .catch(() => setError('Impossible de charger ce quiz.'))
            .finally(() => setLoading(false));
    }, [id]);

    /* ── COUNTDOWN TIMER ── */
    useEffect(() => {
        if (secondsLeft === null || result) return;
        if (secondsLeft <= 0) {
            handleSubmit(true);
            return;
        }
        timerRef.current = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [secondsLeft, result]);

    /* ── SUBMIT ── */
    const handleSubmit = async (auto = false) => {
        if (submitting) return;
        clearTimeout(timerRef.current);
        setSubmitting(true);
        try {
            const { data } = await api.post(`/api/quizzes/${id}/submit`, { answers });
            setResult(data);
        } catch {
            // Compute client-side fallback if API fails
            const questions = quiz?.questions || [];
            let correct = 0;
            questions.forEach(q => {
                const chosen = answers[q.id];
                if (chosen !== undefined && q.correct_index !== undefined && chosen === q.correct_index) {
                    correct++;
                }
            });
            const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
            setResult({ score: correct, total: questions.length, percentage: pct, passed: pct >= 50 });
        } finally {
            setSubmitting(false);
        }
    };

    /* ── LOADING / ERROR ── */
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#F8FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: 36, color: TEAL, marginBottom: 16 }}></i>
                    <p style={{ fontSize: 15 }}>Chargement du quiz...</p>
                </div>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div style={{ minHeight: '100vh', background: '#F8FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#9ca3af', maxWidth: 400 }}>
                    <i className="fas fa-exclamation-circle" style={{ fontSize: 40, color: '#ef4444', marginBottom: 16 }}></i>
                    <p style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                        {error || 'Quiz introuvable'}
                    </p>
                    <Link to="/evaluations" style={{ color: TEAL, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                        &larr; Retour aux evaluations
                    </Link>
                </div>
            </div>
        );
    }

    const questions = quiz.questions || [];
    const total = questions.length;
    const q = questions[current];

    /* ── RESULT SCREEN ── */
    if (result) {
        const pct = result.percentage ?? 0;
        const passed = result.passed ?? pct >= 50;
        return (
            <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>
                {/* Header bar */}
                <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
                    <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, height: 60 }}>
                        <Link to="/evaluations" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                            <i className="fas fa-arrow-left" style={{ marginRight: 6 }}></i>Evaluations
                        </Link>
                        <span style={{ color: '#e5e7eb' }}>/</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{quiz.title}</span>
                    </div>
                </div>

                <div style={{ maxWidth: 620, margin: '60px auto 0', padding: '0 24px' }}>
                    <div style={{
                        background: 'white', borderRadius: 20,
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        padding: '48px 40px',
                        textAlign: 'center',
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: 90, height: 90, borderRadius: '50%',
                            background: passed ? 'linear-gradient(135deg, #5BBCB4, #3da89f)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: passed ? '0 8px 24px rgba(91,188,180,0.35)' : '0 8px 24px rgba(239,68,68,0.3)',
                        }}>
                            <i className={passed ? 'fas fa-trophy' : 'fas fa-times'} style={{ fontSize: 36, color: 'white' }}></i>
                        </div>

                        {/* Score ring */}
                        <div style={{
                            width: 140, height: 140, borderRadius: '50%',
                            background: `conic-gradient(${passed ? TEAL : '#ef4444'} ${pct * 3.6}deg, #f3f4f6 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 28px',
                            position: 'relative',
                        }}>
                            <div style={{
                                width: 110, height: 110, borderRadius: '50%',
                                background: 'white',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{ fontSize: 30, fontWeight: 900, color: passed ? TEAL : '#ef4444', lineHeight: 1 }}>
                                    {pct}%
                                </span>
                                <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>score</span>
                            </div>
                        </div>

                        <h2 style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 8 }}>
                            {passed ? 'Felicitations !' : 'Pas encore...'}
                        </h2>
                        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
                            {passed
                                ? `Vous avez reussi avec un score de ${pct}%. Excellent travail !`
                                : `Vous avez obtenu ${pct}%. Continuez a pratiquer et reessayez !`}
                        </p>

                        {/* Detail */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', gap: 32,
                            padding: '20px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6',
                            marginBottom: 28,
                        }}>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{result.score ?? '—'}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>Correctes</div>
                            </div>
                            <div style={{ width: 1, background: '#f3f4f6' }}></div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{result.total ?? total}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>Total</div>
                            </div>
                            <div style={{ width: 1, background: '#f3f4f6' }}></div>
                            <div>
                                <div style={{
                                    fontSize: 14, fontWeight: 800,
                                    color: passed ? '#059669' : '#dc2626',
                                    background: passed ? '#d1fae5' : '#fee2e2',
                                    padding: '4px 12px', borderRadius: 8,
                                    display: 'inline-block',
                                }}>
                                    {passed ? 'Reussi' : 'Echoue'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => { setResult(null); setCurrent(0); setAnswers({}); if (quiz.duration_minutes) setSecondsLeft(quiz.duration_minutes * 60); }}
                                style={{
                                    padding: '12px 24px', borderRadius: 10,
                                    border: `2px solid ${TEAL}`, background: 'transparent',
                                    color: TEAL, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                }}
                            >
                                <i className="fas fa-redo" style={{ marginRight: 8 }}></i>Reessayer
                            </button>
                            <Link
                                to="/evaluations"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '12px 24px', borderRadius: 10,
                                    background: TEAL, color: 'white', fontWeight: 700, fontSize: 14,
                                    textDecoration: 'none',
                                }}
                            >
                                <i className="fas fa-th-list"></i>Tous les quiz
                            </Link>
                        </div>
                    </div>

                    {/* Corrections detaillees */}
                    {result.corrections && result.corrections.length > 0 && (
                        <div style={{
                            background: 'white', borderRadius: 20, border: '1px solid #f0f0f0',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            padding: '32px 32px', marginTop: 24, textAlign: 'left',
                        }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <i className="fas fa-check-double" style={{ color: TEAL }}></i>
                                Corrections detaillees
                            </h3>
                            {result.corrections.map((c, i) => {
                                const opts = c.options || [];
                                return (
                                    <div key={i} style={{
                                        padding: '16px 0',
                                        borderBottom: i < result.corrections.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                                background: c.is_correct ? '#d1fae5' : '#fee2e2',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, color: c.is_correct ? '#059669' : '#dc2626',
                                            }}>
                                                <i className={c.is_correct ? 'fas fa-check' : 'fas fa-times'}></i>
                                            </div>
                                            <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.4 }}>
                                                {i + 1}. {c.question}
                                            </p>
                                        </div>
                                        <div style={{ marginLeft: 38, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {opts.map((opt, oi) => {
                                                const isChosen = c.submitted === oi;
                                                const isCorrectOpt = c.correct_answer === oi;
                                                let bg = '#f9fafb';
                                                let border = '#e5e7eb';
                                                let color = '#374151';
                                                if (isCorrectOpt) { bg = '#d1fae5'; border = '#059669'; color = '#065f46'; }
                                                else if (isChosen && !isCorrectOpt) { bg = '#fee2e2'; border = '#dc2626'; color = '#991b1b'; }
                                                return (
                                                    <div key={oi} style={{
                                                        padding: '8px 12px', borderRadius: 8,
                                                        border: `1.5px solid ${border}`, background: bg,
                                                        fontSize: 13, color, fontWeight: (isChosen || isCorrectOpt) ? 600 : 400,
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                    }}>
                                                        {isCorrectOpt && <i className="fas fa-check-circle" style={{ color: '#059669', fontSize: 12 }}></i>}
                                                        {isChosen && !isCorrectOpt && <i className="fas fa-times-circle" style={{ color: '#dc2626', fontSize: 12 }}></i>}
                                                        {!isChosen && !isCorrectOpt && <span style={{ width: 12 }}></span>}
                                                        {opt}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {c.explanation && (
                                            <div style={{
                                                marginLeft: 38, marginTop: 8, padding: '10px 14px',
                                                background: '#f0f9ff', borderRadius: 8, borderLeft: `3px solid ${TEAL}`,
                                            }}>
                                                <p style={{ fontSize: 12, color: '#0369a1', margin: 0, fontWeight: 600 }}>
                                                    <i className="fas fa-lightbulb" style={{ marginRight: 6, color: '#f59e0b' }}></i>
                                                    {c.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* AI Feedback */}
                    {result.result?.ai_feedback && (
                        <div style={{
                            background: 'white', borderRadius: 20, border: '1px solid #f0f0f0',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            padding: '32px 32px', marginTop: 24, textAlign: 'left',
                        }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <i className="fas fa-robot" style={{ color: TEAL }}></i>
                                Analyse IA de votre evaluation
                            </h3>
                            <div style={{
                                fontSize: 14, color: '#374151', lineHeight: 1.8,
                                whiteSpace: 'pre-wrap',
                            }}>
                                {result.result.ai_feedback}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ── QUIZ PLAYER ── */
    const progress = total > 0 ? ((current + 1) / total) * 100 : 0;
    const answeredCount = Object.keys(answers).length;
    const isLast = current === total - 1;
    const timerWarning = secondsLeft !== null && secondsLeft <= 60;

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>

            {/* ── TOP BAR ── */}
            <div style={{
                background: 'white', borderBottom: '1px solid #f0f0f0',
                position: 'sticky', top: 0, zIndex: 100,
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
            }}>
                <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>
                    <Link to="/evaluations" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 22, lineHeight: 1 }}>
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {quiz.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                            Question {current + 1} sur {total} &bull; {answeredCount} repondu{answeredCount !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Timer */}
                    {secondsLeft !== null && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: timerWarning ? '#fee2e2' : '#e8f8f5',
                            color: timerWarning ? '#dc2626' : TEAL,
                            padding: '8px 14px', borderRadius: 10,
                            fontWeight: 800, fontSize: 15,
                            transition: 'all .3s',
                            animation: timerWarning ? 'pulse 1s infinite' : 'none',
                        }}>
                            <i className="fas fa-clock"></i>
                            {pad(Math.floor(secondsLeft / 60))}:{pad(secondsLeft % 60)}
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: '#f3f4f6' }}>
                    <div style={{
                        height: '100%', width: `${progress}%`,
                        background: `linear-gradient(90deg, ${TEAL}, #3da89f)`,
                        transition: 'width .3s ease',
                        borderRadius: '0 2px 2px 0',
                    }}></div>
                </div>
            </div>

            {/* ── QUESTION AREA ── */}
            <div style={{ maxWidth: 720, margin: '40px auto 0', padding: '0 24px' }}>

                {/* Question dots */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
                    {questions.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                border: `2px solid ${i === current ? TEAL : answers[questions[i].id] !== undefined ? TEAL : '#e5e7eb'}`,
                                background: i === current ? TEAL : answers[questions[i].id] !== undefined ? '#e8f8f5' : 'white',
                                color: i === current ? 'white' : answers[questions[i].id] !== undefined ? TEAL : '#9ca3af',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                transition: 'all .15s',
                            }}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                {/* Question card */}
                <div style={{
                    background: 'white', borderRadius: 20,
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    padding: '36px 36px 28px',
                    marginBottom: 20,
                }}>
                    {/* Question header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
                        <div style={{
                            minWidth: 40, height: 40, borderRadius: 12,
                            background: 'linear-gradient(135deg, #5BBCB4, #3da89f)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800, fontSize: 14,
                        }}>
                            {current + 1}
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, lineHeight: 1.5, margin: 0, flex: 1 }}>
                            {q?.question || q?.text || ''}
                        </h2>
                    </div>

                    {/* Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(q?.options || []).map((opt, idx) => {
                            const selected = answers[q.id] === idx;
                            const label = typeof opt === 'string' ? opt : opt.text || opt.label || '';
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: idx }))}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 18px',
                                        borderRadius: 12,
                                        border: `2px solid ${selected ? TEAL : '#e5e7eb'}`,
                                        background: selected ? '#e8f8f5' : 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all .15s',
                                        width: '100%',
                                        boxShadow: selected ? `0 0 0 3px rgba(91,188,180,0.15)` : 'none',
                                    }}
                                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#c7e8e5'; }}
                                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                >
                                    {/* Radio indicator */}
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '50%',
                                        border: `2.5px solid ${selected ? TEAL : '#d1d5db'}`,
                                        background: selected ? TEAL : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, transition: 'all .15s',
                                    }}>
                                        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }}></div>}
                                    </div>

                                    {/* Letter label */}
                                    <span style={{
                                        minWidth: 24, height: 24, borderRadius: 6,
                                        background: selected ? TEAL : '#f3f4f6',
                                        color: selected ? 'white' : '#6b7280',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                                    }}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>

                                    <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? NAVY : '#374151', lineHeight: 1.4 }}>
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── NAVIGATION ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <button
                        onClick={() => setCurrent(c => Math.max(0, c - 1))}
                        disabled={current === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '12px 22px', borderRadius: 10,
                            border: '2px solid #e5e7eb', background: 'white',
                            color: current === 0 ? '#d1d5db' : NAVY,
                            fontWeight: 700, fontSize: 14, cursor: current === 0 ? 'not-allowed' : 'pointer',
                            transition: 'all .15s',
                        }}
                    >
                        <i className="fas fa-arrow-left"></i>
                        Precedent
                    </button>

                    {/* Center: unanswered info */}
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {total - answeredCount > 0
                            ? `${total - answeredCount} sans reponse`
                            : <span style={{ color: TEAL, fontWeight: 600 }}><i className="fas fa-check-circle" style={{ marginRight: 4 }}></i>Tout reponde</span>
                        }
                    </span>

                    {isLast ? (
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 24px', borderRadius: 10,
                                background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #5BBCB4, #3da89f)',
                                color: 'white',
                                border: 'none',
                                fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
                                boxShadow: submitting ? 'none' : '0 4px 16px rgba(91,188,180,0.35)',
                                transition: 'all .2s',
                            }}
                        >
                            {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                            {submitting ? 'Envoi...' : 'Soumettre le quiz'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 22px', borderRadius: 10,
                                background: TEAL, color: 'white',
                                border: 'none',
                                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(91,188,180,0.3)',
                                transition: 'all .2s',
                            }}
                        >
                            Suivant
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.75; }
                }
            `}</style>
        </div>
    );
}
