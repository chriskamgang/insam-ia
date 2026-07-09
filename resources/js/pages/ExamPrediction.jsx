import { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

// ── Markdown renderer ─────────────────────────────────────────────────────────

function markdownToHtml(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const elements = [];
    let key = 0;
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // H2 heading
        if (/^##\s/.test(line)) {
            const content = line.replace(/^##\s+/, '');
            elements.push(
                <h3 key={key++} style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: NAVY,
                    margin: '20px 0 8px',
                    paddingBottom: 6,
                    borderBottom: `2px solid ${TEAL}`,
                }}>
                    {renderInline(content)}
                </h3>
            );
            i++;
            continue;
        }

        // H3 heading
        if (/^###\s/.test(line)) {
            const content = line.replace(/^###\s+/, '');
            elements.push(
                <h4 key={key++} style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: TEAL,
                    margin: '14px 0 6px',
                }}>
                    {renderInline(content)}
                </h4>
            );
            i++;
            continue;
        }

        // Numbered list item
        if (/^\d+\.\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s+/, ''));
                i++;
            }
            elements.push(
                <ol key={key++} style={{ margin: '8px 0', paddingLeft: 24 }}>
                    {items.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: 4, color: '#374151', lineHeight: 1.6 }}>
                            {renderInline(item)}
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // Bullet list item
        if (/^[-*]\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^[-*]\s+/, ''));
                i++;
            }
            elements.push(
                <ul key={key++} style={{ margin: '8px 0', paddingLeft: 24 }}>
                    {items.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: 4, color: '#374151', lineHeight: 1.6 }}>
                            {renderInline(item)}
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Blank line
        if (line.trim() === '') {
            elements.push(<div key={key++} style={{ height: 8 }} />);
            i++;
            continue;
        }

        // Paragraph
        elements.push(
            <p key={key++} style={{ margin: '6px 0', color: '#374151', lineHeight: 1.7 }}>
                {renderInline(line)}
            </p>
        );
        i++;
    }

    return elements;
}

function renderInline(text) {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
            return <strong key={idx} style={{ color: NAVY }}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}

// ── Brain pulse animation ─────────────────────────────────────────────────────

function BrainLoader({ message }) {
    const [dots, setDots] = useState('');
    useEffect(() => {
        const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
        return () => clearInterval(iv);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            gap: 24,
        }}>
            {/* Animated brain/pulse icon */}
            <div style={{ position: 'relative', width: 80, height: 80 }}>
                {[0, 1, 2].map(n => (
                    <div key={n} style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: `3px solid ${TEAL}`,
                        opacity: 0,
                        animation: `examPulse 2s ease-out ${n * 0.6}s infinite`,
                    }} />
                ))}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${TEAL}22, ${TEAL}44)`,
                    borderRadius: '50%',
                    border: `2px solid ${TEAL}`,
                }}>
                    <i className="fas fa-brain" style={{ fontSize: 32, color: TEAL }} />
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
                    L'IA analyse les tendances{dots}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>
                    {message || 'Veuillez patienter, cela peut prendre 10 à 20 secondes'}
                </div>
            </div>
            <style>{`
                @keyframes examPulse {
                    0%   { transform: scale(1);   opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function YearTag({ year }) {
    return (
        <span style={{
            display: 'inline-block',
            background: `${TEAL}18`,
            color: TEAL,
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 10,
            marginRight: 4,
            marginBottom: 4,
            border: `1px solid ${TEAL}44`,
        }}>
            {year}
        </span>
    );
}

function ExamBadge({ count }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: NAVY,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 12,
        }}>
            <i className="fas fa-file-alt" style={{ fontSize: 10 }} />
            {count} examen{count > 1 ? 's' : ''}
        </span>
    );
}

function MatiereCard({ matiere, onPredict }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff',
                borderRadius: 14,
                padding: '20px',
                boxShadow: hovered
                    ? '0 8px 24px rgba(91,188,180,0.18)'
                    : '0 2px 8px rgba(0,0,0,0.07)',
                border: hovered ? `1.5px solid ${TEAL}` : '1.5px solid #e5e7eb',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: NAVY,
                    lineHeight: 1.4,
                    flex: 1,
                }}>
                    {matiere.name}
                </div>
                <ExamBadge count={matiere.exam_count} />
            </div>

            {matiere.years && matiere.years.length > 0 && (
                <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Annees disponibles
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {matiere.years.map(y => <YearTag key={y} year={y} />)}
                    </div>
                </div>
            )}

            <button
                onClick={() => onPredict(matiere)}
                style={{
                    marginTop: 'auto',
                    background: hovered
                        ? `linear-gradient(135deg, ${TEAL}, #4aa8a0)`
                        : `linear-gradient(135deg, ${TEAL}ee, ${TEAL})`,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    transition: 'all 0.2s',
                    transform: hovered ? 'translateY(-1px)' : 'none',
                }}
            >
                <i className="fas fa-magic" />
                Predire le sujet
            </button>
        </div>
    );
}

function PredictionResult({ result, onBack }) {
    const { prediction, metadata } = result;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Result header card */}
            <div style={{
                background: '#fff',
                borderRadius: 16,
                border: `1.5px solid ${TEAL}44`,
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(91,188,180,0.12)',
            }}>
                {/* Card header bar */}
                <div style={{
                    background: `linear-gradient(135deg, ${NAVY}, #253560)`,
                    padding: '20px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                }}>
                    <div style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: `${TEAL}33`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <i className="fas fa-bullseye" style={{ fontSize: 20, color: TEAL }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                            {metadata?.matiere}
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {metadata?.category && (
                                <span style={{ fontSize: 13, color: `${TEAL}`, fontWeight: 500 }}>
                                    <i className="fas fa-graduation-cap" style={{ marginRight: 5 }} />
                                    {metadata.category}
                                </span>
                            )}
                            {metadata?.exam_count != null && (
                                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                                    <i className="fas fa-file-alt" style={{ marginRight: 5 }} />
                                    {metadata.exam_count} examen{metadata.exam_count > 1 ? 's' : ''} analyses
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Markdown content */}
                <div style={{ padding: '24px 28px' }}>
                    {markdownToHtml(prediction)}
                </div>
            </div>

            {/* Back button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: `2px solid ${TEAL}`,
                        color: TEAL,
                        borderRadius: 10,
                        padding: '11px 28px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = TEAL;
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = TEAL;
                    }}
                >
                    <i className="fas fa-arrow-left" />
                    Predire une autre matiere
                </button>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExamPrediction() {
    // Step 1 state
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Step 2 state
    const [analysisData, setAnalysisData] = useState(null); // { category, matieres, total_exams }
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    // Step 3 state
    const [predicting, setPredicting] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null); // { prediction, metadata }
    const [predictionError, setPredictionError] = useState('');
    const [predictingMatiere, setPredictingMatiere] = useState(null);

    useEffect(() => {
        api.get('/api/public/categories')
            .then(res => {
                const data = res.data;
                setCategories(Array.isArray(data) ? data : (data.data || []));
            })
            .catch(() => {})
            .finally(() => setLoadingCategories(false));
    }, []);

    function handleAnalyze() {
        if (!selectedCategoryId) return;
        setLoadingAnalysis(true);
        setAnalysisError('');
        setAnalysisData(null);
        setPredictionResult(null);
        setPredictionError('');

        api.get(`/api/exam-predictions/analyze?category_id=${selectedCategoryId}`)
            .then(res => setAnalysisData(res.data))
            .catch(err => {
                const msg = err?.response?.data?.message || 'Erreur lors de l\'analyse. Veuillez reessayer.';
                setAnalysisError(msg);
            })
            .finally(() => setLoadingAnalysis(false));
    }

    function handlePredict(matiere) {
        setPredictingMatiere(matiere);
        setPredicting(true);
        setPredictionError('');
        setPredictionResult(null);

        api.post('/api/exam-predictions/predict', {
            category_id: selectedCategoryId,
            matiere: matiere.name,
        })
            .then(res => setPredictionResult(res.data))
            .catch(err => {
                const msg = err?.response?.data?.message || 'Erreur lors de la prediction. Veuillez reessayer.';
                setPredictionError(msg);
            })
            .finally(() => setPredicting(false));
    }

    function handleBackToMatieres() {
        setPredictionResult(null);
        setPredictionError('');
        setPredictingMatiere(null);
    }

    // Determine current view
    const showStep3 = predicting || predictionResult || predictionError;
    const showStep2 = analysisData && !showStep3;

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', paddingBottom: 60 }}>
            {/* ── Header ── */}
            <div style={{
                background: `linear-gradient(135deg, ${NAVY} 0%, #253560 60%, #1a3a5c 100%)`,
                padding: '48px 24px 52px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute', top: -40, right: -40,
                    width: 200, height: 200,
                    borderRadius: '50%',
                    background: `${TEAL}18`,
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: -60, left: '30%',
                    width: 160, height: 160,
                    borderRadius: '50%',
                    background: `${TEAL}10`,
                    pointerEvents: 'none',
                }} />

                <div style={{ ...W, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: `${TEAL}33`,
                            border: `1.5px solid ${TEAL}66`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <i className="fas fa-bullseye" style={{ fontSize: 26, color: TEAL }} />
                        </div>
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: 28,
                                fontWeight: 800,
                                color: '#fff',
                                letterSpacing: '-0.02em',
                            }}>
                                Prediction des Sujets
                            </h1>
                            <p style={{
                                margin: '6px 0 0',
                                fontSize: 15,
                                color: '#94a3b8',
                                maxWidth: 520,
                            }}>
                                L'IA analyse les tendances des anciens sujets pour predire les futurs examens
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Page body ── */}
            <div style={{ ...W, marginTop: -20, position: 'relative' }}>

                {/* ── STEP 1: Category selection ── */}
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '24px 28px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    marginBottom: 28,
                    border: '1.5px solid #e5e7eb',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${TEAL}, #4aa8a0)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 700,
                            flexShrink: 0,
                        }}>
                            1
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                            Choisissez votre filiere
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#6b7280',
                                marginBottom: 6,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                Filiere / Categorie
                            </label>
                            <select
                                value={selectedCategoryId}
                                onChange={e => setSelectedCategoryId(e.target.value)}
                                disabled={loadingCategories}
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    border: `1.5px solid ${selectedCategoryId ? TEAL : '#d1d5db'}`,
                                    borderRadius: 10,
                                    fontSize: 14,
                                    color: selectedCategoryId ? NAVY : '#9ca3af',
                                    background: '#fff',
                                    outline: 'none',
                                    cursor: loadingCategories ? 'not-allowed' : 'pointer',
                                    appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%236b7280' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    paddingRight: 36,
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                <option value="">
                                    {loadingCategories ? 'Chargement...' : '-- Selectionner une filiere --'}
                                </option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={!selectedCategoryId || loadingAnalysis}
                            style={{
                                background: (!selectedCategoryId || loadingAnalysis)
                                    ? '#e5e7eb'
                                    : `linear-gradient(135deg, ${NAVY}, #253560)`,
                                color: (!selectedCategoryId || loadingAnalysis) ? '#9ca3af' : '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '11px 28px',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: (!selectedCategoryId || loadingAnalysis) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                            }}
                        >
                            {loadingAnalysis ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" />
                                    Analyse en cours...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-search" />
                                    Analyser
                                </>
                            )}
                        </button>
                    </div>

                    {analysisError && (
                        <div style={{
                            marginTop: 14,
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 8,
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: '#dc2626',
                            fontSize: 13,
                        }}>
                            <i className="fas fa-exclamation-circle" />
                            {analysisError}
                        </div>
                    )}
                </div>

                {/* ── STEP 2: Matieres overview ── */}
                {showStep2 && (
                    <div style={{ marginBottom: 28 }}>
                        {/* Step header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 18,
                            flexWrap: 'wrap',
                            gap: 12,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${TEAL}, #4aa8a0)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}>
                                    2
                                </div>
                                <div>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                                        {analysisData.category?.name || 'Matieres disponibles'}
                                    </span>
                                    <span style={{
                                        marginLeft: 10,
                                        fontSize: 13,
                                        color: '#6b7280',
                                        fontWeight: 500,
                                    }}>
                                        — {analysisData.total_exams} examen{analysisData.total_exams !== 1 ? 's' : ''} au total
                                    </span>
                                </div>
                            </div>
                            <div style={{
                                background: `${TEAL}18`,
                                color: TEAL,
                                fontSize: 13,
                                fontWeight: 600,
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: `1px solid ${TEAL}44`,
                            }}>
                                <i className="fas fa-layer-group" style={{ marginRight: 6 }} />
                                {analysisData.matieres?.length || 0} matiere{(analysisData.matieres?.length || 0) !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Matieres grid or empty state */}
                        {!analysisData.matieres || analysisData.matieres.length === 0 ? (
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '48px 24px',
                                textAlign: 'center',
                                border: '1.5px dashed #d1d5db',
                            }}>
                                <i className="fas fa-folder-open" style={{
                                    fontSize: 40,
                                    color: '#d1d5db',
                                    display: 'block',
                                    marginBottom: 16,
                                }} />
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
                                    Aucun sujet d'examen dans cette filiere
                                </div>
                                <div style={{ fontSize: 13, color: '#9ca3af' }}>
                                    Essayez une autre filiere pour voir les predictions disponibles.
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: 18,
                            }}>
                                {analysisData.matieres.map((matiere, idx) => (
                                    <MatiereCard
                                        key={matiere.name || idx}
                                        matiere={matiere}
                                        onPredict={handlePredict}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 3: Prediction ── */}
                {showStep3 && (
                    <div>
                        {/* Step header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: predicting
                                    ? '#e5e7eb'
                                    : `linear-gradient(135deg, ${TEAL}, #4aa8a0)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: predicting ? '#9ca3af' : '#fff',
                                fontSize: 14,
                                fontWeight: 700,
                                flexShrink: 0,
                                transition: 'all 0.3s',
                            }}>
                                3
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                                {predicting
                                    ? `Prediction en cours pour "${predictingMatiere?.name}"...`
                                    : `Prediction — ${predictingMatiere?.name}`}
                            </span>
                        </div>

                        {/* Loading state */}
                        {predicting && (
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                border: '1.5px solid #e5e7eb',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                            }}>
                                <BrainLoader />
                            </div>
                        )}

                        {/* Error state */}
                        {!predicting && predictionError && (
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px 28px',
                                border: '1.5px solid #fecaca',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                textAlign: 'center',
                            }}>
                                <i className="fas fa-exclamation-triangle" style={{
                                    fontSize: 36,
                                    color: '#ef4444',
                                    display: 'block',
                                    marginBottom: 14,
                                }} />
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
                                    Erreur de prediction
                                </div>
                                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                                    {predictionError}
                                </div>
                                <button
                                    onClick={handleBackToMatieres}
                                    style={{
                                        background: 'transparent',
                                        border: `2px solid ${TEAL}`,
                                        color: TEAL,
                                        borderRadius: 8,
                                        padding: '9px 22px',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 7,
                                    }}
                                >
                                    <i className="fas fa-arrow-left" />
                                    Retour aux matieres
                                </button>
                            </div>
                        )}

                        {/* Result */}
                        {!predicting && predictionResult && (
                            <PredictionResult
                                result={predictionResult}
                                onBack={handleBackToMatieres}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
