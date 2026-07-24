import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import toast from 'react-hot-toast';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const TAB_KEYS = [
    { key: 'sujets', tKey: 'library.tab_subjects', icon: 'fas fa-file-alt' },
    { key: 'generate', tKey: 'library.tab_generate', icon: 'fas fa-magic' },
    { key: 'enrich', tKey: 'library.tab_enrich', icon: 'fas fa-plus-circle' },
    { key: 'correct', tKey: 'library.tab_correct', icon: 'fas fa-check-double' },
];

const libCSS = `
.lib-grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.lib-tabs { display:flex; gap:0; overflow-x:auto; scrollbar-width:none; }
.lib-modal-body { max-height:70vh; overflow-y:auto; }
@media(max-width:1024px){ .lib-grid3 { grid-template-columns:repeat(2,1fr); } }
@media(max-width:768px){ .lib-grid3 { grid-template-columns:1fr; } .lib-tabs { gap:0; } }
.lib-md h1,.lib-md h2,.lib-md h3 { color:${NAVY}; margin:16px 0 8px; }
.lib-md h1 { font-size:20px; } .lib-md h2 { font-size:17px; } .lib-md h3 { font-size:15px; }
.lib-md p { margin:6px 0; line-height:1.7; color:#374151; }
.lib-md ul,.lib-md ol { margin:6px 0 6px 20px; color:#374151; }
.lib-md li { margin:4px 0; line-height:1.6; }
.lib-md strong { color:${NAVY}; }
.lib-md code { background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:13px; }
.lib-md pre { background:#1e293b; color:#e2e8f0; padding:16px; border-radius:10px; overflow-x:auto; font-size:13px; }
`;

// ── Markdown renderer (simple) ──
function Markdown({ text }) {
    if (!text) return null;
    const html = text
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/## (.*)/g, '<h2>$1</h2>')
        .replace(/# (.*)/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^- (.*)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*)/gm, '<li>$2</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
    return <div className="lib-md" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
}

// ── Exam Card ──
function ExamCard({ exam, onCorrect, onTake }) {
    const { t } = useLang();
    return (
        <div style={{
            background: 'white', borderRadius: 14, border: '1px solid #f0f0f0',
            overflow: 'hidden', transition: 'all .2s',
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(91,188,180,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
        >
            <div style={{ height: 4, background: `linear-gradient(90deg, ${TEAL}, ${NAVY})` }} />
            <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {exam.annee && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>{exam.annee}</span>}
                    {exam.niveau && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6' }}>{exam.niveau}</span>}
                    {exam.source === 'admin' && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#e8f8f5', color: TEAL }}>{t('library.official')}</span>}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 6px', lineHeight: 1.4 }}>{exam.title}</h3>
                {exam.matiere && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}><i className="fas fa-book" style={{ marginRight: 6, color: '#9ca3af' }}></i>{exam.matiere}</div>}
                {exam.filiere && <div style={{ fontSize: 12, color: '#6b7280' }}><i className="fas fa-graduation-cap" style={{ marginRight: 6, color: '#9ca3af' }}></i>{exam.filiere}</div>}
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                <button onClick={() => onTake(exam)} style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                    background: `linear-gradient(135deg, ${TEAL}, #3da89e)`, color: 'white',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 2px 6px rgba(91,188,180,0.30)',
                }}>
                    <i className="fas fa-pen-fancy" style={{ marginRight: 5 }}></i>Traiter
                </button>
                <button onClick={() => onCorrect(exam)} style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${TEAL}`,
                    background: 'white', color: TEAL, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    <i className="fas fa-check-double" style={{ marginRight: 5 }}></i>{t('library.ai_correction')}
                </button>
            </div>
        </div>
    );
}

// ── Exam Taker (split view: PDF left + answers right) ──
function LibExamTaker({ exam, onClose }) {
    const [answers, setAnswers] = useState('');
    const [correction, setCorrection] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [timer, setTimer] = useState(0);
    const [started, setStarted] = useState(false);
    const [showCorrection, setShowCorrection] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const imgInputRef = useRef(null);

    const fileUrl = exam.file_path
        ? `/api/exams/view-pdf?path=${encodeURIComponent(exam.file_path)}#toolbar=0&navpanes=0`
        : null;

    useEffect(() => {
        if (!started) return;
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [started]);

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleImgUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (uploadedImages.length >= 5) return;
            const reader = new FileReader();
            reader.onload = () => setUploadedImages(prev => prev.length < 5 ? [...prev, reader.result] : prev);
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleSubmit = async () => {
        if (!answers.trim() && uploadedImages.length === 0) return;
        setSubmitting(true);
        try {
            let res;
            if (uploadedImages.length > 0) {
                res = await api.post('/api/exams/correct-image', {
                    exam_id: exam.id,
                    images: uploadedImages,
                    text_answers: answers || '',
                    time_spent: timer,
                });
            } else {
                res = await api.post('/api/exams/correct', {
                    exam_id: exam.id,
                    answers: answers,
                    time_spent: timer,
                });
            }
            setCorrection(res.data?.correction || res.data);
            setStarted(false);
        } catch {
            toast.error('Erreur lors de la correction.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                background: NAVY, padding: '10px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                flexShrink: 0, borderBottom: `2px solid ${TEAL}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <i className="fas fa-pen-fancy" style={{ color: TEAL, fontSize: 16 }}></i>
                    <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exam.title}
                    </h3>
                    {exam.matiere && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>— {exam.matiere}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {started && (
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', borderRadius: 8,
                            padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
                            color: '#F5A623', fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                        }}>
                            <i className="fas fa-clock"></i>{formatTime(timer)}
                        </div>
                    )}
                    {correction && (
                        <button onClick={() => setShowCorrection(!showCorrection)} style={{
                            background: showCorrection ? '#F5A623' : 'rgba(255,255,255,0.1)',
                            color: 'white', border: 'none', borderRadius: 8,
                            padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <i className="fas fa-check-circle"></i>
                            {showCorrection ? 'Voir le sujet' : 'Voir la correction'}
                        </button>
                    )}
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                        color: 'white', width: 32, height: 32, cursor: 'pointer', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left: PDF or correction */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {showCorrection && correction ? (
                        <div style={{ flex: 1, overflow: 'auto', background: 'white', padding: '24px 32px' }}>
                            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                    {correction.note && (
                                        <div style={{ fontSize: 36, fontWeight: 900, color: TEAL, marginBottom: 8 }}>
                                            {correction.note}/20
                                        </div>
                                    )}
                                    <h3 style={{ color: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <i className="fas fa-check-circle"></i> Correction IA
                                    </h3>
                                    <p style={{ fontSize: 12, color: '#9ca3af' }}>Temps: {formatTime(timer)}</p>
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14, color: '#1f2937' }}>
                                    {correction.details || correction.correction || (typeof correction === 'string' ? correction : JSON.stringify(correction, null, 2))}
                                </div>
                            </div>
                        </div>
                    ) : fileUrl ? (
                        <iframe src={fileUrl} style={{ flex: 1, border: 'none', background: 'white' }} title="Epreuve" />
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                <i className="fas fa-file-pdf" style={{ fontSize: 48, marginBottom: 12, color: '#e5e7eb' }}></i>
                                <p>Aucun fichier PDF disponible</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Answer panel */}
                <div style={{
                    width: 420, flexShrink: 0, background: '#f8fafb',
                    display: 'flex', flexDirection: 'column', borderLeft: `2px solid ${TEAL}30`,
                }}>
                    {!correction ? (
                        <>
                            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #e5e7eb' }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <i className="fas fa-edit" style={{ color: TEAL }}></i>
                                    Vos reponses
                                </h4>
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                                    Lisez l'epreuve a gauche et redigez vos reponses ci-dessous
                                </p>
                            </div>

                            {!started ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            width: 70, height: 70, borderRadius: '50%', margin: '0 auto 16px',
                                            background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <i className="fas fa-play" style={{ fontSize: 28, color: TEAL, marginLeft: 4 }}></i>
                                        </div>
                                        <h4 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Pret a composer ?</h4>
                                        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
                                            Le chronometre demarrera.<br />Redigez puis soumettez pour correction IA.
                                        </p>
                                        <button onClick={() => setStarted(true)} style={{
                                            background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                            color: 'white', border: 'none', borderRadius: 12,
                                            padding: '12px 28px', fontSize: 14, fontWeight: 700,
                                            cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                                        }}>
                                            <i className="fas fa-play" style={{ marginRight: 8 }}></i>Commencer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        value={answers}
                                        onChange={e => setAnswers(e.target.value)}
                                        placeholder={"Redigez vos reponses ici...\nOu prenez en photo votre copie papier avec le bouton Photo."}
                                        style={{
                                            flex: 1, border: 'none', outline: 'none', resize: 'none',
                                            padding: '16px 18px', fontSize: 13, lineHeight: 1.7,
                                            fontFamily: 'inherit', color: '#1e293b', background: 'white',
                                            minHeight: uploadedImages.length > 0 ? 60 : undefined,
                                        }}
                                    />
                                    {uploadedImages.length > 0 && (
                                        <div style={{ padding: '8px 14px', background: '#f8fafb', borderTop: '1px solid #f0f0f0' }}>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {uploadedImages.map((img, i) => (
                                                    <div key={i} style={{ position: 'relative', width: 60, height: 60, borderRadius: 6, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                                                        <img src={img} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                                                            style={{ position: 'absolute', top: 1, right: 1, width: 16, height: 16, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        ><i className="fas fa-times"></i></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <p style={{ fontSize: 10, color: '#9ca3af', margin: '4px 0 0' }}>{uploadedImages.length}/5 photo(s)</p>
                                        </div>
                                    )}
                                    <div style={{
                                        padding: '10px 14px', borderTop: '1px solid #e5e7eb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', gap: 8,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <input ref={imgInputRef} type="file" accept="image/*" multiple capture="environment" onChange={handleImgUpload} style={{ display: 'none' }} />
                                            <button onClick={() => imgInputRef.current?.click()} disabled={uploadedImages.length >= 5}
                                                style={{ background: uploadedImages.length > 0 ? '#e8f8f5' : '#f3f4f6', color: uploadedImages.length > 0 ? TEAL : '#6b7280', border: uploadedImages.length > 0 ? `1.5px solid ${TEAL}` : '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}
                                            ><i className="fas fa-camera"></i> Photo{uploadedImages.length > 0 && ` (${uploadedImages.length})`}</button>
                                            <span style={{ fontSize: 10, color: '#9ca3af' }}>{answers.length > 0 ? `${answers.length} car.` : ''}</span>
                                        </div>
                                        <button onClick={handleSubmit} disabled={submitting || (!answers.trim() && uploadedImages.length === 0)} style={{
                                            background: submitting || (!answers.trim() && uploadedImages.length === 0) ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                            color: 'white', border: 'none', borderRadius: 10,
                                            padding: '8px 16px', fontSize: 12, fontWeight: 700,
                                            cursor: submitting || (!answers.trim() && uploadedImages.length === 0) ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            boxShadow: submitting ? 'none' : '0 3px 10px rgba(91,188,180,0.3)',
                                        }}>
                                            {submitting ? <><i className="fas fa-circle-notch fa-spin"></i> Correction...</>
                                                : <><i className="fas fa-paper-plane"></i> Soumettre</>}
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: 70, height: 70, borderRadius: '50%', margin: '0 auto 16px',
                                    background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <i className="fas fa-check-double" style={{ fontSize: 28, color: TEAL }}></i>
                                </div>
                                <h4 style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Correction terminee !</h4>
                                {correction.note && <div style={{ fontSize: 28, fontWeight: 900, color: TEAL, margin: '8px 0' }}>{correction.note}/20</div>}
                                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Temps: {formatTime(timer)}</p>
                                <p style={{ fontSize: 13, color: '#6b7280' }}>
                                    Cliquez sur <strong>"Voir la correction"</strong> en haut pour consulter les details.
                                </p>
                                <button onClick={() => { setCorrection(null); setAnswers(''); setTimer(0); setStarted(false); setShowCorrection(false); }} style={{
                                    marginTop: 16, background: NAVY, color: 'white', border: 'none', borderRadius: 10,
                                    padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    <i className="fas fa-redo" style={{ marginRight: 8 }}></i>Recommencer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Modal ──
function Modal({ title, children, onClose, wide }) {
    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
            <div style={{
                background: 'white', borderRadius: 20, width: '100%', maxWidth: wide ? 800 : 580,
                boxShadow: '0 24px 60px rgba(0,0,0,0.15)', overflow: 'hidden',
            }}>
                <div style={{
                    background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                    padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'white' }}>{title}</h2>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
                        color: 'white', width: 30, height: 30, cursor: 'pointer', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><i className="fas fa-times"></i></button>
                </div>
                <div className="lib-modal-body" style={{ padding: 24 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// ── Input style helper ──
const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', fontSize: 14, color: '#1e293b',
    outline: 'none', fontFamily: 'inherit', background: 'white', boxSizing: 'border-box',
};

const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };

const NIVEAUX = ['BTS 1', 'BTS 2', 'Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'DUT'];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Library() {
    const { user } = useAuth();
    const { t } = useLang();
    const [tab, setTab] = useState('sujets');
    const [exams, setExams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterNiveau, setFilterNiveau] = useState('');
    const [filterFiliere, setFilterFiliere] = useState('');

    // Modal states
    const [correctionModal, setCorrectionModal] = useState(null);
    const [takingExam, setTakingExam] = useState(null);
    const [generateResult, setGenerateResult] = useState(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/api/exams').catch(() => ({ data: { exams: [] } })),
            api.get('/api/public/categories').catch(() => ({ data: { data: [] } })),
        ]).then(([exRes, catRes]) => {
            setExams(exRes.data?.exams || []);
            setCategories(catRes.data?.data || []);
        }).finally(() => setLoading(false));
    }, []);

    const refreshExams = () => {
        api.get('/api/exams').then(r => setExams(r.data?.exams || [])).catch(() => {});
    };

    const filtered = exams.filter(e => {
        if (search && !e.title?.toLowerCase().includes(search.toLowerCase()) && !e.matiere?.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterNiveau && e.niveau !== filterNiveau) return false;
        if (filterFiliere && !e.filiere?.toLowerCase().includes(filterFiliere.toLowerCase())) return false;
        return true;
    });

    const handleCorrect = async (exam) => {
        setCorrectionModal({ exam, correction: null, loading: true });
        try {
            const r = await api.get(`/api/exams/${exam.id}/ai-correction`);
            setCorrectionModal({ exam, correction: r.data.correction, loading: false });
        } catch {
            setCorrectionModal({ exam, correction: 'Erreur lors de la generation de la correction.', loading: false });
        }
    };

    const filiereOptions = [...new Set(exams.map(e => e.filiere).filter(Boolean))];

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>
            <style>{libCSS}</style>

            {/* ── Header ── */}
            <div style={{ background: `linear-gradient(165deg, #e6faf8 0%, #f0fdfa 40%, white 100%)`, padding: '42px 0 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={W}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: 1, textTransform: 'uppercase' }}>
                        <i className="fas fa-book-open" style={{ marginRight: 6 }}></i>INSAM-IA
                    </span>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: NAVY, margin: '8px 0 10px' }}>
                        {t('library.title')}
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 600, margin: '0 0 24px' }}>
                        {t('library.subtitle')}
                    </p>

                    {/* Tabs */}
                    <div className="lib-tabs">
                        {TAB_KEYS.map(tb => (
                            <button key={tb.key} onClick={() => setTab(tb.key)} style={{
                                padding: '12px 22px', border: 'none', borderBottom: tab === tb.key ? `3px solid ${TEAL}` : '3px solid transparent',
                                background: 'transparent', color: tab === tb.key ? TEAL : '#6b7280',
                                fontWeight: tab === tb.key ? 700 : 500, fontSize: 13, cursor: 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
                                transition: 'all .15s', whiteSpace: 'nowrap',
                            }}>
                                <i className={tb.icon}></i>{t(tb.tKey)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ ...W, padding: '28px 24px 60px' }}>

                {/* ═══════════════════════════════════════
                    TAB 1: ANCIENS SUJETS BTS
                ═══════════════════════════════════════ */}
                {tab === 'sujets' && (
                    <>
                        {/* Filters */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: '1 1 220px' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder={t('library.search_subject')}
                                    style={{ ...inputStyle, paddingLeft: 36 }}
                                />
                            </div>
                            <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}
                                style={{ ...inputStyle, width: 'auto', minWidth: 140, cursor: 'pointer' }}>
                                <option value="">{t('library.all_levels')}</option>
                                {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <select value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)}
                                style={{ ...inputStyle, width: 'auto', minWidth: 160, cursor: 'pointer' }}>
                                <option value="">{t('library.all_fields')}</option>
                                {filiereOptions.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 12 }}></i>
                                <p>{t('common.loading')}</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
                                <i className="fas fa-file-alt" style={{ fontSize: 48, marginBottom: 16, color: '#e5e7eb' }}></i>
                                <p style={{ fontSize: 16, fontWeight: 600, color: '#6b7280' }}>{t('library.no_subject')}</p>
                                <p style={{ fontSize: 13 }}>{t('library.submit_first')}</p>
                                <button onClick={() => setTab('enrich')} style={{
                                    marginTop: 16, padding: '10px 24px', borderRadius: 10,
                                    background: TEAL, color: 'white', border: 'none',
                                    fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                                }}>
                                    <i className="fas fa-plus" style={{ marginRight: 6 }}></i>{t('library.submit_subject')}
                                </button>
                            </div>
                        ) : (
                            <div className="lib-grid3">
                                {filtered.map(exam => (
                                    <ExamCard key={exam.id} exam={exam} onCorrect={handleCorrect} onTake={setTakingExam} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════════════════════════════
                    TAB 2: GENERER DES EPREUVES
                ═══════════════════════════════════════ */}
                {tab === 'generate' && (
                    <GenerateTab
                        categories={categories}
                        generating={generating}
                        setGenerating={setGenerating}
                        generateResult={generateResult}
                        setGenerateResult={setGenerateResult}
                    />
                )}

                {/* ═══════════════════════════════════════
                    TAB 3: ENRICHIR LA BANQUE
                ═══════════════════════════════════════ */}
                {tab === 'enrich' && (
                    <EnrichTab categories={categories} onSuccess={() => { refreshExams(); setTab('sujets'); }} />
                )}

                {/* ═══════════════════════════════════════
                    TAB 4: OBTENIR UNE CORRECTION
                ═══════════════════════════════════════ */}
                {tab === 'correct' && (
                    <CorrectTab categories={categories} />
                )}


            </div>

            {/* ── Exam Taker ── */}
            {takingExam && (
                <LibExamTaker exam={takingExam} onClose={() => setTakingExam(null)} />
            )}

            {/* ── Correction Modal ── */}
            {correctionModal && (
                <Modal title={`Correction: ${correctionModal.exam.title}`} onClose={() => setCorrectionModal(null)} wide>
                    {correctionModal.loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 12, color: TEAL }}></i>
                            <p style={{ fontSize: 14 }}>{t('library.correction_loading')}</p>
                            <p style={{ fontSize: 12, color: '#b0b0b0' }}>{t('library.correction_wait')}</p>
                        </div>
                    ) : (
                        <>
                            <Markdown text={correctionModal.correction} />
                            {/* TTS button */}
                            <div style={{ marginTop: 20, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                                <SpeakButton text={correctionModal.correction} />
                            </div>
                        </>
                    )}
                </Modal>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: GENERER DES EPREUVES
// ══════════════════════════════════════════════════════════════════════════════
function GenerateTab({ categories, generating, setGenerating, generateResult, setGenerateResult }) {
    const { t } = useLang();
    const [form, setForm] = useState({ matiere: '', filiere: '', niveau: '' });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleGenerate = async () => {
        if (!form.matiere.trim()) { toast.error('Veuillez entrer une matiere.'); return; }
        setGenerating(true);
        setGenerateResult(null);
        try {
            const r = await api.post('/api/exams/generate-exercises', form);
            setGenerateResult(r.data.exercise);
        } catch {
            toast.error('Erreur lors de la generation.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #f0f0f0', marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>
                    <i className="fas fa-magic" style={{ color: TEAL, marginRight: 8 }}></i>
                    {t('library.gen_title')}
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                    {t('library.gen_desc')}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                    <div>
                        <label style={labelStyle}>{t('library.subject')} *</label>
                        <input value={form.matiere} onChange={e => set('matiere', e.target.value)}
                            placeholder="Ex: Comptabilite Generale" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('library.field')}</label>
                        <input value={form.filiere} onChange={e => set('filiere', e.target.value)}
                            placeholder="Ex: Comptabilite & Gestion (Specialite)" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('library.level')}</label>
                        <select value={form.niveau} onChange={e => set('niveau', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">{t('library.choose')}</option>
                            {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                <button onClick={handleGenerate} disabled={generating} style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: generating ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                    color: 'white', fontWeight: 700, fontSize: 14, cursor: generating ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', boxShadow: generating ? 'none' : '0 4px 12px rgba(91,188,180,0.35)',
                }}>
                    {generating ? (
                        <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>{t('library.generating')}</>
                    ) : (
                        <><i className="fas fa-magic" style={{ marginRight: 8 }}></i>{t('library.generate_btn')}</>
                    )}
                </button>
            </div>

            {generateResult && (
                <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                            <i className="fas fa-file-alt" style={{ color: TEAL, marginRight: 8 }}></i>
                            {t('library.generated')}
                        </h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <SpeakButton text={generateResult} />
                            <button onClick={() => {
                                navigator.clipboard.writeText(generateResult);
                                toast.success('Copie dans le presse-papiers !');
                            }} style={{
                                padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${NAVY}`,
                                background: 'white', color: NAVY, fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                <i className="fas fa-copy" style={{ marginRight: 5 }}></i>{t('library.copy')}
                            </button>
                        </div>
                    </div>
                    <Markdown text={generateResult} />
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: ENRICHIR LA BANQUE
// ══════════════════════════════════════════════════════════════════════════════
function EnrichTab({ categories, onSuccess }) {
    const { t } = useLang();
    const [form, setForm] = useState({
        title: '', matiere: '', filiere: '', niveau: '', annee: '', category_id: '', file: null,
    });
    const [submitting, setSubmitting] = useState(false);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.matiere || !form.filiere || !form.niveau || !form.annee || !form.file) {
            toast.error('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
            await api.post('/api/exams/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Sujet soumis avec succes !');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la soumission.');
        } finally {
            setSubmitting(false);
        }
    };

    const ANNEES = Array.from({ length: 12 }, (_, i) => String(2024 - i));

    return (
        <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #f0f0f0', maxWidth: 640 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                <i className="fas fa-plus-circle" style={{ color: TEAL, marginRight: 8 }}></i>
                {t('library.enrich_title')}
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                {t('library.enrich_desc')}
            </p>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>{t('library.title_label')} *</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                        placeholder="Ex: Examen BTS Comptabilite 2024" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                        <label style={labelStyle}>{t('library.subject')} *</label>
                        <input value={form.matiere} onChange={e => set('matiere', e.target.value)}
                            placeholder="Ex: Comptabilite Generale" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('library.field')} *</label>
                        <input value={form.filiere} onChange={e => set('filiere', e.target.value)}
                            placeholder="Ex: Comptabilite & Gestion (Specialite)" style={inputStyle} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                        <label style={labelStyle}>{t('library.level')} *</label>
                        <select value={form.niveau} onChange={e => set('niveau', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">{t('library.choose')}</option>
                            {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>{t('library.year')} *</label>
                        <select value={form.annee} onChange={e => set('annee', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">{t('library.choose')}</option>
                            {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>
                {categories.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>{t('library.category')}</label>
                        <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">{t('library.none')}</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>{t('library.file_label')} *</label>
                    <label style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 8, padding: '22px', border: `2px dashed ${form.file ? TEAL : '#d1d5db'}`,
                        borderRadius: 12, cursor: 'pointer', background: form.file ? '#f0fdf9' : '#fafafa',
                    }}>
                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: 28, color: form.file ? TEAL : '#9ca3af' }}></i>
                        {form.file
                            ? <span style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{form.file.name}</span>
                            : <span style={{ fontSize: 13, color: '#374151' }}>{t('library.click_choose')}</span>
                        }
                        <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                            onChange={e => set('file', e.target.files?.[0] || null)} />
                    </label>
                </div>
                <button type="submit" disabled={submitting} style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: submitting ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                    color: 'white', fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                }}>
                    {submitting ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>{t('library.sending')}</>
                        : <><i className="fas fa-paper-plane" style={{ marginRight: 8 }}></i>{t('library.submit_btn')}</>}
                </button>
            </form>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: OBTENIR UNE CORRECTION
// ══════════════════════════════════════════════════════════════════════════════
function CorrectTab({ categories }) {
    const { t } = useLang();
    const [inputMode, setInputMode] = useState('paste'); // 'paste' or 'upload'
    const [content, setContent] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [form, setForm] = useState({ title: '', matiere: '', filiere: '', niveau: '', category_id: '' });
    const [correction, setCorrection] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef(null);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        if (inputMode === 'paste' && !content.trim()) { toast.error('Veuillez coller le contenu de l\'epreuve.'); return; }
        if (inputMode === 'upload' && !uploadFile) { toast.error('Veuillez charger un fichier (PDF ou image).'); return; }
        if (!form.matiere.trim()) { toast.error('Veuillez entrer la matiere.'); return; }
        setLoading(true);
        setCorrection(null);
        try {
            let r;
            if (inputMode === 'upload' && uploadFile) {
                const fd = new FormData();
                fd.append('file', uploadFile);
                fd.append('title', form.title || `Epreuve ${form.matiere} ${new Date().getFullYear()}`);
                fd.append('matiere', form.matiere);
                fd.append('filiere', form.filiere || 'General');
                fd.append('niveau', form.niveau || 'BTS');
                if (form.category_id) fd.append('category_id', form.category_id);
                r = await api.post('/api/exams/upload-and-correct', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                r = await api.post('/api/exams/submit-and-correct', {
                    title: form.title || `Epreuve ${form.matiere} ${new Date().getFullYear()}`,
                    matiere: form.matiere,
                    filiere: form.filiere || 'General',
                    niveau: form.niveau || 'BTS',
                    content,
                    category_id: form.category_id || null,
                });
            }
            setCorrection(r.data.correction);
            toast.success('Epreuve enregistree et corrigee !');
            api.post('/api/course-progress', {
                type: form.niveau?.startsWith('BTS') ? 'bts_exam' : 'ue_course',
                subject: form.matiere,
                title: form.title || `Epreuve ${form.matiere}`,
                score: 0,
                course_completed: true,
                quiz_completed: false,
            }).catch(() => {});
        } catch {
            toast.error('Erreur lors de la correction.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #f0f0f0', marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
                    <i className="fas fa-check-double" style={{ color: TEAL, marginRight: 8 }}></i>
                    {t('library.correct_title')}
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                    Collez le contenu d'une epreuve ou chargez un fichier (PDF, image) pour obtenir une correction detaillee par l'IA.
                </p>

                {/* Mode toggle: paste or upload */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {[
                        { key: 'paste', icon: 'fas fa-paste', label: 'Coller le texte' },
                        { key: 'upload', icon: 'fas fa-upload', label: 'Charger un fichier' },
                    ].map(m => (
                        <button key={m.key} onClick={() => setInputMode(m.key)} style={{
                            padding: '10px 20px', borderRadius: 10,
                            border: inputMode === m.key ? `2px solid ${TEAL}` : '1.5px solid #e5e7eb',
                            background: inputMode === m.key ? '#e8f8f5' : 'white',
                            color: inputMode === m.key ? TEAL : '#6b7280',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <i className={m.icon}></i>{m.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                    <div>
                        <label style={labelStyle}>{t('library.title_field')}</label>
                        <input value={form.title} onChange={e => set('title', e.target.value)}
                            placeholder="Ex: Examen Reseaux 2024" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('library.subject')} *</label>
                        <input value={form.matiere} onChange={e => set('matiere', e.target.value)}
                            placeholder="Ex: Reseaux Informatiques" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('library.level')}</label>
                        <select value={form.niveau} onChange={e => set('niveau', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">{t('library.choose')}</option>
                            {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                {inputMode === 'paste' ? (
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>{t('library.content_label')} *</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)}
                            placeholder={t('library.content_placeholder')}
                            rows={10}
                            style={{ ...inputStyle, resize: 'vertical', minHeight: 180, lineHeight: 1.6, fontSize: 13 }}
                        />
                    </div>
                ) : (
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Fichier (PDF, image) *</label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: `2px dashed ${uploadFile ? TEAL : '#d1d5db'}`,
                                borderRadius: 12, padding: '32px 20px', textAlign: 'center',
                                background: uploadFile ? '#f0fdf9' : '#f9fafb',
                                cursor: 'pointer', transition: 'all .2s',
                            }}
                        >
                            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                                style={{ display: 'none' }}
                                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                            />
                            {uploadFile ? (
                                <div>
                                    <i className="fas fa-file-check" style={{ fontSize: 28, color: TEAL, marginBottom: 8, display: 'block' }}></i>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{uploadFile.name}</div>
                                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB - Cliquez pour changer
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: 28, color: '#9ca3af', marginBottom: 8, display: 'block' }}></i>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Cliquez pour charger une epreuve</div>
                                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PDF, JPG, PNG (max 10 MB)</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button onClick={handleSubmit} disabled={loading} style={{
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    background: loading ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                    color: 'white', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 12px rgba(91,188,180,0.35)',
                }}>
                    {loading ? (
                        <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>{t('library.correcting')}</>
                    ) : (
                        <><i className="fas fa-check-double" style={{ marginRight: 8 }}></i>{t('library.correct_btn')}</>
                    )}
                </button>
            </div>

            {correction && (
                <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                            <i className="fas fa-check-circle" style={{ color: '#10b981', marginRight: 8 }}></i>
                            {t('library.correction_detail')}
                        </h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <SpeakButton text={correction} />
                            <button onClick={() => { navigator.clipboard.writeText(correction); toast.success('Copie !'); }}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${NAVY}`,
                                    background: 'white', color: NAVY, fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}>
                                <i className="fas fa-copy" style={{ marginRight: 5 }}></i>{t('library.copy')}
                            </button>
                        </div>
                    </div>
                    <Markdown text={correction} />
                </div>
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// SPEAK BUTTON (Text-to-Speech)
// ══════════════════════════════════════════════════════════════════════════════
function SpeakButton({ text }) {
    const { t } = useLang();
    const [speaking, setSpeaking] = useState(false);
    const utterRef = useRef(null);

    const toggle = () => {
        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }
        // Strip markdown
        const clean = (text || '')
            .replace(/#{1,3}\s/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`[^`]+`/g, '')
            .replace(/[-*]\s/g, '')
            .replace(/\d+\.\s/g, '');

        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = 'fr-FR';
        utter.rate = 0.9;
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        utterRef.current = utter;
        window.speechSynthesis.speak(utter);
        setSpeaking(true);
    };

    return (
        <button onClick={toggle} style={{
            padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${speaking ? '#ef4444' : TEAL}`,
            background: speaking ? '#fef2f2' : '#f0fdf9', color: speaking ? '#ef4444' : TEAL,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 5,
        }}>
            <i className={`fas fa-${speaking ? 'stop' : 'volume-up'}`}></i>
            {speaking ? t('library.stop') : t('library.read')}
        </button>
    );
}
