import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 900, margin: '0 auto', padding: '0 24px' };

const STEPS = ['ecole', 'filiere_quiz', 'filiere_result', 'specialite_quiz', 'specialite_result'];

export default function Orientation() {
    const [step, setStep] = useState('ecole');
    const [ecoles, setEcoles] = useState([]);
    const [selectedEcole, setSelectedEcole] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [answers, setAnswers] = useState({});
    const [scores, setScores] = useState({});
    const [topFiliere, setTopFiliere] = useState(null);
    const [specQuestions, setSpecQuestions] = useState([]);
    const [specialites, setSpecialites] = useState([]);
    const [specAnswers, setSpecAnswers] = useState({});
    const [specScores, setSpecScores] = useState({});
    const [topSpecialite, setTopSpecialite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQ, setCurrentQ] = useState(0);

    useEffect(() => {
        api.get('/api/public/orientation/ecoles')
            .then(r => setEcoles(r.data.ecoles || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const selectEcole = (ecole) => {
        setSelectedEcole(ecole);
        setLoading(true);
        api.get(`/api/public/orientation/ecoles/${ecole.id}/questions`)
            .then(r => {
                setQuestions(r.data.questions || []);
                setFilieres(r.data.filieres || []);
                if ((r.data.questions || []).length === 0) {
                    // No questions, show filieres directly
                    setStep('filiere_result');
                    setScores({});
                } else {
                    setStep('filiere_quiz');
                    setCurrentQ(0);
                    setAnswers({});
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const answerQuestion = (qIndex, optionIndex) => {
        const newAnswers = { ...answers, [qIndex]: optionIndex };
        setAnswers(newAnswers);

        // Calculate scores
        const q = questions[qIndex];
        const optKey = `option_${optionIndex}`;
        const optScores = q.scores?.[optKey] || {};

        const newScores = { ...scores };
        // Remove old answer scores if changing
        if (answers[qIndex] !== undefined) {
            const oldKey = `option_${answers[qIndex]}`;
            const oldScores = q.scores?.[oldKey] || {};
            Object.entries(oldScores).forEach(([name, val]) => {
                newScores[name] = (newScores[name] || 0) - val;
            });
        }
        Object.entries(optScores).forEach(([name, val]) => {
            newScores[name] = (newScores[name] || 0) + val;
        });
        setScores(newScores);

        // Auto-advance
        if (qIndex < questions.length - 1) {
            setTimeout(() => setCurrentQ(qIndex + 1), 400);
        }
    };

    const finishFiliereQuiz = () => {
        // Find top filiere
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const topName = sorted[0]?.[0];
        const found = filieres.find(f => f.name === topName);
        setTopFiliere(found || filieres[0]);
        setStep('filiere_result');
    };

    const selectFiliere = (filiere) => {
        setTopFiliere(filiere);
        setLoading(true);
        api.get(`/api/public/orientation/filieres/${filiere.id}/questions`)
            .then(r => {
                setSpecQuestions(r.data.questions || []);
                setSpecialites(r.data.specialites || []);
                if ((r.data.questions || []).length === 0) {
                    setStep('specialite_result');
                    setSpecScores({});
                } else {
                    setStep('specialite_quiz');
                    setCurrentQ(0);
                    setSpecAnswers({});
                    setSpecScores({});
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const answerSpecQuestion = (qIndex, optionIndex) => {
        const newAnswers = { ...specAnswers, [qIndex]: optionIndex };
        setSpecAnswers(newAnswers);

        const q = specQuestions[qIndex];
        const optKey = `option_${optionIndex}`;
        const optScores = q.scores?.[optKey] || {};

        const newScores = { ...specScores };
        if (specAnswers[qIndex] !== undefined) {
            const oldKey = `option_${specAnswers[qIndex]}`;
            const oldScores = q.scores?.[oldKey] || {};
            Object.entries(oldScores).forEach(([name, val]) => {
                newScores[name] = (newScores[name] || 0) - val;
            });
        }
        Object.entries(optScores).forEach(([name, val]) => {
            newScores[name] = (newScores[name] || 0) + val;
        });
        setSpecScores(newScores);

        if (qIndex < specQuestions.length - 1) {
            setTimeout(() => setCurrentQ(qIndex + 1), 400);
        }
    };

    const finishSpecialiteQuiz = () => {
        const sorted = Object.entries(specScores).sort((a, b) => b[1] - a[1]);
        const topName = sorted[0]?.[0];
        const found = specialites.find(s => s.name === topName);
        setTopSpecialite(found || specialites[0]);
        setStep('specialite_result');
    };

    const restart = () => {
        setStep('ecole');
        setSelectedEcole(null);
        setQuestions([]);
        setAnswers({});
        setScores({});
        setTopFiliere(null);
        setSpecQuestions([]);
        setSpecAnswers({});
        setSpecScores({});
        setTopSpecialite(null);
        setCurrentQ(0);
    };

    const stepIndex = STEPS.indexOf(step);
    const progress = ((stepIndex + 1) / STEPS.length) * 100;

    if (loading && step === 'ecole') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }}></div>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>Chargement...</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                .orient-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 28px rgba(91,188,180,0.18) !important; border-color: ${TEAL} !important; }
                .orient-option:hover { background: ${TEAL}10 !important; border-color: ${TEAL} !important; }
                @media(max-width:768px) {
                    .orient-grid { grid-template-columns: 1fr !important; }
                    .orient-hero-title { font-size: 24px !important; }
                }
            `}</style>

            {/* Hero */}
            <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #263d6b 50%, ${TEAL} 100%)`, padding: '44px 0 36px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: '50%', background: `${TEAL}20`, pointerEvents: 'none' }}></div>
                <div style={W}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <Link to="/" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>Accueil</Link>
                        <i className="fas fa-chevron-right" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}></i>
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Orientation</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white', flexShrink: 0 }}>
                            <i className="fas fa-compass"></i>
                        </div>
                        <div>
                            <h1 className="orient-hero-title" style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 6px' }}>
                                Test d'orientation
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>
                                Decouvrez la filiere et la specialite qui vous correspondent le mieux
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginTop: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            {['Ecole', 'Questions', 'Filiere', 'Specialisation', 'Resultat'].map((label, i) => (
                                <span key={i} style={{
                                    fontSize: 10, fontWeight: 700, color: i <= stepIndex ? 'white' : 'rgba(255,255,255,0.35)',
                                    textTransform: 'uppercase', letterSpacing: 0.8,
                                }}>{label}</span>
                            ))}
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: TEAL, width: `${progress}%`, transition: 'width 0.5s ease' }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section style={{ padding: '36px 0 60px' }}>
                <div style={W}>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }}></div>
                            <p style={{ color: '#9ca3af', fontSize: 14 }}>
                                {step === 'ecole' ? 'Chargement...' : (
                                    <>
                                        <i className="fas fa-robot" style={{ marginRight: 8, color: TEAL }}></i>
                                        L'IA prepare vos questions d'orientation...
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    {/* STEP 1: Choose Ecole */}
                    {!loading && step === 'ecole' && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 8 }}>
                                <i className="fas fa-building" style={{ color: TEAL, marginRight: 10 }}></i>
                                Choisissez votre ecole
                            </h2>
                            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 28 }}>
                                Selectionnez l'ecole dans laquelle vous souhaitez vous inscrire
                            </p>

                            {ecoles.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                                    <i className="fas fa-school" style={{ fontSize: 48, marginBottom: 16, display: 'block', opacity: 0.3 }}></i>
                                    <p style={{ fontSize: 16, fontWeight: 600 }}>Aucune ecole disponible</p>
                                    <p style={{ fontSize: 13 }}>L'administrateur n'a pas encore configure les ecoles.</p>
                                </div>
                            ) : (
                                <div className="orient-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                                    {ecoles.map(ecole => (
                                        <div
                                            key={ecole.id}
                                            className="orient-card"
                                            onClick={() => selectEcole(ecole)}
                                            style={{
                                                background: 'white', borderRadius: 16, padding: '24px 22px',
                                                border: '1px solid #f0f0f0', cursor: 'pointer',
                                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16,
                                            }}
                                        >
                                            <div style={{
                                                width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                                                background: ecole.logo ? `url(/storage/${ecole.logo}) center/cover` : `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontSize: 22, fontWeight: 800,
                                            }}>
                                                {!ecole.logo && ecole.name?.charAt(0)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>{ecole.name}</h3>
                                                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>
                                                    {ecole.ville && <span>{ecole.ville} &bull; </span>}
                                                    {ecole.filieres_count || 0} filieres
                                                </p>
                                                {ecole.description && <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{ecole.description}</p>}
                                            </div>
                                            <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', color: '#d1d5db', fontSize: 14 }}></i>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Filiere Quiz */}
                    {!loading && step === 'filiere_quiz' && questions.length > 0 && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <button onClick={() => setStep('ecole')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: 0 }}>
                                    Orientation vers une filiere - {selectedEcole?.name}
                                </h2>
                            </div>

                            {/* Question counter */}
                            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, fontWeight: 600 }}>
                                Question {currentQ + 1} sur {questions.length}
                            </div>

                            {/* Question card */}
                            <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 24, lineHeight: 1.5 }}>
                                    {questions[currentQ]?.question}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {(questions[currentQ]?.options || []).map((opt, oi) => (
                                        <button
                                            key={oi}
                                            className="orient-option"
                                            onClick={() => answerQuestion(currentQ, oi)}
                                            style={{
                                                background: answers[currentQ] === oi ? `${TEAL}15` : 'white',
                                                border: answers[currentQ] === oi ? `2px solid ${TEAL}` : '1.5px solid #e5e7eb',
                                                borderRadius: 12, padding: '14px 18px', textAlign: 'left',
                                                cursor: 'pointer', fontSize: 14, color: answers[currentQ] === oi ? TEAL : '#374151',
                                                fontWeight: answers[currentQ] === oi ? 600 : 400,
                                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
                                            }}
                                        >
                                            <div style={{
                                                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                                background: answers[currentQ] === oi ? TEAL : '#f3f4f6',
                                                color: answers[currentQ] === oi ? 'white' : '#9ca3af',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, fontWeight: 700,
                                            }}>
                                                {String.fromCharCode(65 + oi)}
                                            </div>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Navigation */}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button
                                    onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                                    disabled={currentQ === 0}
                                    style={{
                                        background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
                                        padding: '10px 20px', cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
                                        color: currentQ === 0 ? '#d1d5db' : NAVY, fontSize: 13, fontWeight: 600,
                                    }}
                                >
                                    <i className="fas fa-arrow-left" style={{ marginRight: 6 }}></i> Precedent
                                </button>

                                {currentQ === questions.length - 1 ? (
                                    <button
                                        onClick={finishFiliereQuiz}
                                        disabled={Object.keys(answers).length < questions.length}
                                        style={{
                                            background: Object.keys(answers).length < questions.length ? '#d1d5db' : TEAL,
                                            color: 'white', border: 'none', borderRadius: 10,
                                            padding: '10px 24px', cursor: Object.keys(answers).length < questions.length ? 'not-allowed' : 'pointer',
                                            fontSize: 13, fontWeight: 600,
                                        }}
                                    >
                                        Voir les resultats <i className="fas fa-arrow-right" style={{ marginLeft: 6 }}></i>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQ(currentQ + 1)}
                                        style={{
                                            background: TEAL, color: 'white', border: 'none', borderRadius: 10,
                                            padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                        }}
                                    >
                                        Suivant <i className="fas fa-arrow-right" style={{ marginLeft: 6 }}></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Filiere Result */}
                    {!loading && step === 'filiere_result' && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <button onClick={() => setStep(questions.length > 0 ? 'filiere_quiz' : 'ecole')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: 0 }}>
                                    {Object.keys(scores).length > 0 ? 'Votre filiere recommandee' : 'Choisissez votre filiere'}
                                </h2>
                            </div>

                            {/* Top result highlight */}
                            {topFiliere && Object.keys(scores).length > 0 && (
                                <div style={{
                                    background: `linear-gradient(135deg, ${TEAL}10, ${TEAL}05)`,
                                    border: `2px solid ${TEAL}40`, borderRadius: 20, padding: '28px 24px',
                                    marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20,
                                }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 16, background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, flexShrink: 0 }}>
                                        <i className="fas fa-star"></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Recommandee pour vous</div>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: '0 0 4px' }}>{topFiliere.name}</h3>
                                        {topFiliere.description && <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{topFiliere.description}</p>}
                                    </div>
                                    <button onClick={() => selectFiliere(topFiliere)} style={{
                                        background: TEAL, color: 'white', border: 'none', borderRadius: 10,
                                        padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                                    }}>
                                        Continuer <i className="fas fa-arrow-right" style={{ marginLeft: 6 }}></i>
                                    </button>
                                </div>
                            )}

                            {/* All filieres with scores */}
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                                {Object.keys(scores).length > 0 ? 'Toutes les filieres' : `Filieres de ${selectedEcole?.name}`}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {filieres
                                    .map(f => ({ ...f, score: scores[f.name] || 0 }))
                                    .sort((a, b) => b.score - a.score)
                                    .map((f, i) => {
                                        const maxScore = Math.max(...Object.values(scores).filter(v => v > 0), 1);
                                        const pct = Object.keys(scores).length > 0 ? Math.round((f.score / maxScore) * 100) : 0;
                                        return (
                                            <div
                                                key={f.id}
                                                className="orient-card"
                                                onClick={() => selectFiliere(f)}
                                                style={{
                                                    background: 'white', borderRadius: 14, padding: '18px 20px',
                                                    border: topFiliere?.id === f.id ? `1.5px solid ${TEAL}` : '1px solid #f0f0f0',
                                                    cursor: 'pointer', transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', gap: 16,
                                                }}
                                            >
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                                    background: i === 0 && pct > 0 ? `${TEAL}15` : '#f3f4f6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: i === 0 && pct > 0 ? TEAL : '#9ca3af', fontSize: 14,
                                                }}>
                                                    <i className={f.icon || 'fas fa-graduation-cap'}></i>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>{f.name}</h4>
                                                    {pct > 0 && (
                                                        <div style={{ height: 4, borderRadius: 2, background: '#f3f4f6', marginTop: 6 }}>
                                                            <div style={{ height: '100%', borderRadius: 2, background: TEAL, width: `${pct}%`, transition: 'width 0.5s' }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                {pct > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>{pct}%</span>}
                                                <i className="fas fa-chevron-right" style={{ color: '#d1d5db', fontSize: 12 }}></i>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Specialite Quiz */}
                    {!loading && step === 'specialite_quiz' && specQuestions.length > 0 && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <button onClick={() => setStep('filiere_result')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: 0 }}>
                                    Specialisation en {topFiliere?.name}
                                </h2>
                            </div>

                            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, fontWeight: 600 }}>
                                Question {currentQ + 1} sur {specQuestions.length}
                            </div>

                            <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 24 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 24, lineHeight: 1.5 }}>
                                    {specQuestions[currentQ]?.question}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {(specQuestions[currentQ]?.options || []).map((opt, oi) => (
                                        <button
                                            key={oi}
                                            className="orient-option"
                                            onClick={() => answerSpecQuestion(currentQ, oi)}
                                            style={{
                                                background: specAnswers[currentQ] === oi ? `${TEAL}15` : 'white',
                                                border: specAnswers[currentQ] === oi ? `2px solid ${TEAL}` : '1.5px solid #e5e7eb',
                                                borderRadius: 12, padding: '14px 18px', textAlign: 'left',
                                                cursor: 'pointer', fontSize: 14, color: specAnswers[currentQ] === oi ? TEAL : '#374151',
                                                fontWeight: specAnswers[currentQ] === oi ? 600 : 400,
                                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
                                            }}
                                        >
                                            <div style={{
                                                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                                background: specAnswers[currentQ] === oi ? TEAL : '#f3f4f6',
                                                color: specAnswers[currentQ] === oi ? 'white' : '#9ca3af',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, fontWeight: 700,
                                            }}>
                                                {String.fromCharCode(65 + oi)}
                                            </div>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button
                                    onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                                    disabled={currentQ === 0}
                                    style={{
                                        background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
                                        padding: '10px 20px', cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
                                        color: currentQ === 0 ? '#d1d5db' : NAVY, fontSize: 13, fontWeight: 600,
                                    }}
                                >
                                    <i className="fas fa-arrow-left" style={{ marginRight: 6 }}></i> Precedent
                                </button>

                                {currentQ === specQuestions.length - 1 ? (
                                    <button
                                        onClick={finishSpecialiteQuiz}
                                        disabled={Object.keys(specAnswers).length < specQuestions.length}
                                        style={{
                                            background: Object.keys(specAnswers).length < specQuestions.length ? '#d1d5db' : TEAL,
                                            color: 'white', border: 'none', borderRadius: 10,
                                            padding: '10px 24px', cursor: Object.keys(specAnswers).length < specQuestions.length ? 'not-allowed' : 'pointer',
                                            fontSize: 13, fontWeight: 600,
                                        }}
                                    >
                                        Voir les resultats <i className="fas fa-arrow-right" style={{ marginLeft: 6 }}></i>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQ(currentQ + 1)}
                                        style={{
                                            background: TEAL, color: 'white', border: 'none', borderRadius: 10,
                                            padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                        }}
                                    >
                                        Suivant <i className="fas fa-arrow-right" style={{ marginLeft: 6 }}></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Specialite Result */}
                    {!loading && step === 'specialite_result' && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>
                            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${TEAL}15`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-trophy" style={{ fontSize: 32, color: TEAL }}></i>
                                </div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
                                    {topSpecialite ? 'Votre specialite recommandee' : 'Specialites disponibles'}
                                </h2>
                                <p style={{ color: '#9ca3af', fontSize: 14 }}>
                                    {selectedEcole?.name} &bull; {topFiliere?.name}
                                </p>
                            </div>

                            {/* Top specialite card */}
                            {topSpecialite && Object.keys(specScores).length > 0 && (
                                <div style={{
                                    background: `linear-gradient(135deg, ${NAVY}, #2d4270)`,
                                    borderRadius: 20, padding: '32px 28px', marginBottom: 28, color: 'white',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                                            <i className="fas fa-star" style={{ color: '#F5A623' }}></i>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 1 }}>Meilleur choix pour vous</div>
                                            <h3 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 0' }}>{topSpecialite.name}</h3>
                                        </div>
                                    </div>
                                    {topSpecialite.description && <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', margin: '0 0 16px' }}>{topSpecialite.description}</p>}

                                    {topSpecialite.diplome && (
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                                                <i className="fas fa-graduation-cap" style={{ marginRight: 4 }}></i>{topSpecialite.diplome}
                                            </span>
                                            {topSpecialite.duree && (
                                                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                                                    <i className="fas fa-clock" style={{ marginRight: 4 }}></i>{topSpecialite.duree}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {topSpecialite.avantages && (
                                        <div style={{ marginTop: 16 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, marginBottom: 8 }}>Avantages</div>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{topSpecialite.avantages}</p>
                                        </div>
                                    )}

                                    {topSpecialite.debouches && (
                                        <div style={{ marginTop: 16 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#F5A623', marginBottom: 8 }}>Debouches</div>
                                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{topSpecialite.debouches}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* All specialites */}
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Toutes les specialites
                            </h3>
                            <div className="orient-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
                                {specialites
                                    .map(s => ({ ...s, score: specScores[s.name] || 0 }))
                                    .sort((a, b) => b.score - a.score)
                                    .map(s => (
                                        <div key={s.id} style={{
                                            background: 'white', borderRadius: 14, padding: '18px 18px',
                                            border: topSpecialite?.id === s.id ? `1.5px solid ${TEAL}` : '1px solid #f0f0f0',
                                        }}>
                                            <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>{s.name}</h4>
                                            {s.description && <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, margin: '0 0 8px' }}>{s.description}</p>}
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {s.diplome && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: `${TEAL}12`, color: TEAL }}>{s.diplome}</span>}
                                                {s.duree && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#f3f4f6', color: '#6b7280' }}>{s.duree}</span>}
                                                {s.score > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#F5A623', color: 'white' }}>{s.score} pts</span>}
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button onClick={restart} style={{
                                    background: 'white', border: `1.5px solid ${TEAL}`, color: TEAL,
                                    borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                                }}>
                                    <i className="fas fa-redo" style={{ marginRight: 8 }}></i>Recommencer
                                </button>
                                <Link to="/formations" style={{
                                    background: TEAL, color: 'white', border: 'none',
                                    borderRadius: 10, padding: '12px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <i className="fas fa-book"></i> Voir les formations
                                </Link>
                            </div>
                        </div>
                    )}

                </div>
            </section>
        </div>
    );
}
