import { useState, useEffect, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';
import toast from 'react-hot-toast';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const NIVEAUX = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'BTS', 'DUT'];
const ANNEES = Array.from({ length: 12 }, (_, i) => String(2024 - i));

// ── Upload Modal ────────────────────────────────────────────────────────────
function UploadModal({ categories, onClose, onSuccess }) {
    const { t } = useLang();
    const [form, setForm] = useState({
        title: '', matiere: '', filiere: '', niveau: '', annee: '',
        category_id: '', file: null,
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Titre requis';
        if (!form.matiere.trim()) e.matiere = 'Matiere requise';
        if (!form.filiere.trim()) e.filiere = 'Specialite requise';
        if (!form.niveau) e.niveau = 'Niveau requis';
        if (!form.annee) e.annee = 'Annee requise';
        if (!form.file) e.file = 'Fichier requis';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
            await api.post('/api/exams/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Sujet soumis avec succes ! Il sera visible apres validation.');
            onSuccess();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || 'Une erreur est survenue.';
            toast.error(msg);
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = (field) => ({
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: `1.5px solid ${errors[field] ? '#ef4444' : '#e5e7eb'}`,
        fontSize: 14, color: '#1e293b', outline: 'none',
        fontFamily: 'inherit', background: 'white', boxSizing: 'border-box',
        transition: 'border-color .15s',
    });

    const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: 'white', borderRadius: 20, width: '100%', maxWidth: 540,
                boxShadow: '0 24px 60px rgba(0,0,0,0.15)', overflow: 'hidden',
            }}>
                {/* Modal header */}
                <div style={{
                    background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                    padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
                        <i className="fas fa-upload" style={{ fontSize: 18 }}></i>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Soumettre un sujet</h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
                        color: 'white', width: 30, height: 30, cursor: 'pointer', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: 28, maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Titre du sujet *</label>
                        <input
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            placeholder="Ex: Examen final Reseaux 2024"
                            style={inputStyle('title')}
                            onFocus={e => e.target.style.borderColor = TEAL}
                            onBlur={e => e.target.style.borderColor = errors.title ? '#ef4444' : '#e5e7eb'}
                        />
                        {errors.title && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.title}</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>Matiere *</label>
                            <input
                                value={form.matiere}
                                onChange={e => set('matiere', e.target.value)}
                                placeholder="Ex: Reseaux Informatiques"
                                style={inputStyle('matiere')}
                                onFocus={e => e.target.style.borderColor = TEAL}
                                onBlur={e => e.target.style.borderColor = errors.matiere ? '#ef4444' : '#e5e7eb'}
                            />
                            {errors.matiere && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.matiere}</span>}
                        </div>
                        <div>
                            <label style={labelStyle}>Specialite *</label>
                            <select
                                value={form.filiere}
                                onChange={e => set('filiere', e.target.value)}
                                style={{ ...inputStyle('filiere'), appearance: 'none', cursor: 'pointer' }}
                                onFocus={e => e.target.style.borderColor = TEAL}
                                onBlur={e => e.target.style.borderColor = errors.filiere ? '#ef4444' : '#e5e7eb'}
                            >
                                <option value="">Selectionnez une specialite</option>
                                <option value="Informatique & Reseaux">Informatique & Reseaux</option>
                                <option value="Genie Civil">Genie Civil</option>
                                <option value="Comptabilite & Gestion">Comptabilite & Gestion</option>
                                <option value="Marketing & Commerce">Marketing & Commerce</option>
                                <option value="Logistique & Transport">Logistique & Transport</option>
                                <option value="Secretariat de Direction">Secretariat de Direction</option>
                                <option value="Genie Logiciel">Genie Logiciel</option>
                                <option value="Sante">Sante</option>
                                <option value="Informatique Industrielle & Automatisme">Informatique Industrielle & Automatisme</option>
                                <option value="Production Vegetale">Production Vegetale</option>
                                <option value="Sciences Infirmieres">Sciences Infirmieres</option>
                                <option value="Techniques de Laboratoire">Techniques de Laboratoire</option>
                                <option value="Assistant Manager">Assistant Manager</option>
                            </select>
                            {errors.filiere && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.filiere}</span>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>Niveau *</label>
                            <select
                                value={form.niveau}
                                onChange={e => set('niveau', e.target.value)}
                                style={{ ...inputStyle('niveau'), appearance: 'none', cursor: 'pointer' }}
                                onFocus={e => e.target.style.borderColor = TEAL}
                                onBlur={e => e.target.style.borderColor = errors.niveau ? '#ef4444' : '#e5e7eb'}
                            >
                                <option value="">Choisir...</option>
                                {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            {errors.niveau && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.niveau}</span>}
                        </div>
                        <div>
                            <label style={labelStyle}>Annee *</label>
                            <select
                                value={form.annee}
                                onChange={e => set('annee', e.target.value)}
                                style={{ ...inputStyle('annee'), appearance: 'none', cursor: 'pointer' }}
                                onFocus={e => e.target.style.borderColor = TEAL}
                                onBlur={e => e.target.style.borderColor = errors.annee ? '#ef4444' : '#e5e7eb'}
                            >
                                <option value="">Choisir...</option>
                                {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            {errors.annee && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.annee}</span>}
                        </div>
                    </div>

                    {categories.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Formation / Categorie</label>
                            <select
                                value={form.category_id}
                                onChange={e => set('category_id', e.target.value)}
                                style={{ ...inputStyle('category_id'), appearance: 'none', cursor: 'pointer' }}
                                onFocus={e => e.target.style.borderColor = TEAL}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            >
                                <option value="">Aucune categorie</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{ marginBottom: 22 }}>
                        <label style={labelStyle}>Fichier (PDF, DOC, DOCX) *</label>
                        <label style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 8, padding: '22px 20px',
                            border: `2px dashed ${errors.file ? '#ef4444' : form.file ? TEAL : '#d1d5db'}`,
                            borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
                            background: form.file ? '#f0fdf9' : '#fafafa',
                        }}
                            onMouseEnter={e => { if (!form.file) e.currentTarget.style.borderColor = TEAL; }}
                            onMouseLeave={e => { if (!form.file) e.currentTarget.style.borderColor = errors.file ? '#ef4444' : '#d1d5db'; }}
                        >
                            <i className="fas fa-cloud-upload-alt" style={{ fontSize: 28, color: form.file ? TEAL : '#9ca3af' }}></i>
                            {form.file
                                ? <span style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{form.file.name}</span>
                                : <>
                                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Glissez ou cliquez pour choisir</span>
                                    <span style={{ fontSize: 11, color: '#9ca3af' }}>PDF, DOC, DOCX · max 20 Mo</span>
                                </>
                            }
                            <input
                                type="file" accept=".pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    if (f.size > 20 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 20 Mo)'); return; }
                                    set('file', f);
                                    setErrors(prev => ({ ...prev, file: undefined }));
                                }}
                            />
                        </label>
                        {errors.file && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.file}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            type="button" onClick={onClose}
                            style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                                background: 'white', color: '#6b7280', fontWeight: 600, fontSize: 14,
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            style={{
                                flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                                background: submitting ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                color: 'white', fontWeight: 700, fontSize: 14,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', transition: 'all .2s',
                                boxShadow: submitting ? 'none' : '0 4px 12px rgba(91,188,180,0.35)',
                            }}
                        >
                            {submitting
                                ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }}></i>Envoi en cours...</>
                                : <><i className="fas fa-paper-plane" style={{ marginRight: 8 }}></i>Soumettre le sujet</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Exam Taking Modal ────────────────────────────────────────────────────────
function ExamTaker({ exam, onClose }) {
    const [answers, setAnswers] = useState('');
    const [correction, setCorrection] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showCorrection, setShowCorrection] = useState(false);
    const [timer, setTimer] = useState(0);
    const [started, setStarted] = useState(false);

    const getViewUrl = (path) => {
        if (!path) return null;
        const isPdf = path.toLowerCase().endsWith('.pdf');
        if (isPdf) {
            return (path.startsWith('http') ? path : `/storage/${path}`) + '#toolbar=0&navpanes=0';
        }
        return `/api/exams/view-pdf?path=${encodeURIComponent(path)}#toolbar=0&navpanes=0`;
    };

    const fileUrl = getViewUrl(exam.file_path);
    const isFileCorrectionPath = exam.correction_path && !exam.correction_path.endsWith('.md');
    const correctionUrl = isFileCorrectionPath ? getViewUrl(exam.correction_path) : null;
    const [aiCorrectionText, setAiCorrectionText] = useState(null);
    const [loadingAiCorrection, setLoadingAiCorrection] = useState(false);

    const loadAiCorrection = async () => {
        if (aiCorrectionText) { setShowCorrection(!showCorrection); return; }
        setLoadingAiCorrection(true);
        setShowCorrection(true);
        try {
            const res = await api.get(`/api/exams/${exam.id}/ai-correction`);
            setAiCorrectionText(res.data?.correction || 'Correction non disponible.');
        } catch {
            setAiCorrectionText('Erreur lors du chargement de la correction.');
        } finally {
            setLoadingAiCorrection(false);
        }
    };

    const hasCorrection = exam.correction_path || exam.is_corrected;

    // Timer
    useEffect(() => {
        if (!started) return;
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [started]);

    const formatTime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (!answers.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post('/api/exams/correct', {
                exam_id: exam.id,
                answers: answers,
                time_spent: timer,
            });
            setCorrection(res.data?.correction || res.data);
            setStarted(false);
        } catch (err) {
            toast.error('Erreur lors de la correction. Reessayez.');
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
                    {/* Timer */}
                    {started && (
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', borderRadius: 8,
                            padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
                            color: '#F5A623', fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                        }}>
                            <i className="fas fa-clock"></i>
                            {formatTime(timer)}
                        </div>
                    )}
                    {hasCorrection && !correction && (
                        <button
                            onClick={() => {
                                if (correctionUrl) { setShowCorrection(!showCorrection); }
                                else { loadAiCorrection(); }
                            }}
                            disabled={loadingAiCorrection}
                            style={{
                                background: showCorrection ? '#F5A623' : 'rgba(255,255,255,0.1)',
                                color: 'white', border: 'none', borderRadius: 8,
                                padding: '6px 12px', fontSize: 11, fontWeight: 600,
                                cursor: loadingAiCorrection ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            }}
                        >
                            {loadingAiCorrection
                                ? <><i className="fas fa-circle-notch fa-spin"></i> Chargement...</>
                                : <><i className="fas fa-check-circle"></i> Correction</>
                            }
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                            color: 'white', width: 32, height: 32, cursor: 'pointer', fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left: PDF */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {showCorrection && correctionUrl ? (
                        <iframe src={correctionUrl} style={{ flex: 1, border: 'none', background: 'white' }} title="Correction" />
                    ) : showCorrection && aiCorrectionText ? (
                        <div style={{ flex: 1, overflow: 'auto', background: 'white', padding: '24px 32px' }}>
                            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                                <h3 style={{ color: TEAL, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <i className="fas fa-check-circle"></i> Correction IA
                                </h3>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14, color: '#1f2937' }}>
                                    {aiCorrectionText}
                                </div>
                            </div>
                        </div>
                    ) : showCorrection && loadingAiCorrection ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                            <div style={{ textAlign: 'center', color: '#6b7280' }}>
                                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 32, color: TEAL, marginBottom: 12 }}></i>
                                <p>Generation de la correction en cours...</p>
                            </div>
                        </div>
                    ) : (
                        <iframe src={fileUrl} style={{ flex: 1, border: 'none', background: 'white' }} title="Epreuve" />
                    )}
                </div>

                {/* Right: Answer panel */}
                <div style={{
                    width: 420, flexShrink: 0, background: '#f8fafb',
                    display: 'flex', flexDirection: 'column', borderLeft: `2px solid ${TEAL}30`,
                }}>
                    {!correction ? (
                        <>
                            {/* Answer header */}
                            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #e5e7eb' }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <i className="fas fa-edit" style={{ color: TEAL }}></i>
                                    Vos reponses
                                </h4>
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                                    Lisez l'epreuve a gauche et redigez vos reponses ci-dessous
                                </p>
                            </div>

                            {/* Start button or textarea */}
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
                                            Le chronometre demarrera quand vous commencerez.<br />
                                            Redigez vos reponses puis soumettez pour correction IA.
                                        </p>
                                        <button
                                            onClick={() => setStarted(true)}
                                            style={{
                                                background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                                color: 'white', border: 'none', borderRadius: 12,
                                                padding: '12px 28px', fontSize: 14, fontWeight: 700,
                                                cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                                            }}
                                        >
                                            <i className="fas fa-play" style={{ marginRight: 8 }}></i>
                                            Commencer l'examen
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        value={answers}
                                        onChange={e => setAnswers(e.target.value)}
                                        placeholder={"Exercice 1:\nQuestion a) ...\nReponse: ...\n\nQuestion b) ...\nReponse: ...\n\nExercice 2:\n..."}
                                        style={{
                                            flex: 1, border: 'none', outline: 'none', resize: 'none',
                                            padding: '16px 18px', fontSize: 13, lineHeight: 1.7,
                                            fontFamily: 'inherit', color: '#1e293b', background: 'white',
                                        }}
                                    />
                                    {/* Submit */}
                                    <div style={{
                                        padding: '12px 18px', borderTop: '1px solid #e5e7eb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'white',
                                    }}>
                                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                                            {answers.length} caracteres
                                        </span>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || !answers.trim()}
                                            style={{
                                                background: submitting || !answers.trim() ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                                color: 'white', border: 'none', borderRadius: 10,
                                                padding: '9px 20px', fontSize: 13, fontWeight: 700,
                                                cursor: submitting || !answers.trim() ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 7,
                                                boxShadow: submitting ? 'none' : '0 3px 10px rgba(91,188,180,0.3)',
                                            }}
                                        >
                                            {submitting ? (
                                                <><i className="fas fa-circle-notch fa-spin"></i> Correction en cours...</>
                                            ) : (
                                                <><i className="fas fa-paper-plane"></i> Soumettre pour correction</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        /* Correction result */
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: '50%', margin: '0 auto 12px',
                                    background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <i className="fas fa-check-double" style={{ fontSize: 26, color: TEAL }}></i>
                                </div>
                                <h4 style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Correction terminee</h4>
                                <p style={{ fontSize: 12, color: '#9ca3af' }}>
                                    Temps: {formatTime(timer)}
                                </p>
                                {correction.note && (
                                    <div style={{
                                        fontSize: 28, fontWeight: 900, color: TEAL,
                                        margin: '10px 0',
                                    }}>
                                        {correction.note}/20
                                    </div>
                                )}
                            </div>
                            <div style={{
                                background: 'white', borderRadius: 14, padding: '18px 16px',
                                border: '1px solid #e5e7eb', fontSize: 13, lineHeight: 1.8,
                                color: '#374151', whiteSpace: 'pre-wrap',
                            }}>
                                {correction.details || correction.correction || (typeof correction === 'string' ? correction : JSON.stringify(correction, null, 2))}
                            </div>
                            <button
                                onClick={() => { setCorrection(null); setAnswers(''); setTimer(0); setStarted(false); }}
                                style={{
                                    width: '100%', marginTop: 16, background: NAVY,
                                    color: 'white', border: 'none', borderRadius: 10,
                                    padding: '11px', fontSize: 13, fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                <i className="fas fa-redo" style={{ marginRight: 8 }}></i>
                                Recommencer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Exam Card ────────────────────────────────────────────────────────────────
function ExamCard({ exam, onView }) {
    const isAdmin = exam.source === 'admin' || !exam.student_id;
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
            {/* Color top strip */}
            <div style={{ height: 5, background: `linear-gradient(90deg, ${TEAL}, ${NAVY})` }} />

            <div style={{ padding: '18px 20px', flex: 1 }}>
                {/* Badges row */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: isAdmin ? '#e8f8f5' : '#fef3c7',
                        color: isAdmin ? TEAL : '#b45309',
                        border: `1px solid ${isAdmin ? TEAL + '30' : '#fcd34d'}`,
                    }}>
                        <i className={`fas fa-${isAdmin ? 'shield-alt' : 'user-graduate'}`} style={{ marginRight: 4 }}></i>
                        {isAdmin ? 'Officiel' : 'Etudiant'}
                    </span>
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
                </div>

                {/* Icon + Title */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: '#f0fdf9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: TEAL,
                    }}>
                        <i className="fas fa-file-pdf"></i>
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
                    {exam.filiere && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6b7280' }}>
                            <i className="fas fa-graduation-cap" style={{ color: '#9ca3af', width: 12 }}></i>
                            <span>{exam.filiere}</span>
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
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9ca3af' }}>
                    <i className="fas fa-eye"></i>
                    <span>Consulter</span>
                </div>
                <button
                    onClick={() => onView(exam)}
                    style={{
                        background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                        color: 'white', border: 'none', borderRadius: 20,
                        padding: '7px 16px', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'inherit', transition: 'all .2s',
                        boxShadow: '0 2px 6px rgba(91,188,180,0.30)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(91,188,180,0.45)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 6px rgba(91,188,180,0.30)'}
                >
                    <i className="fas fa-pen-fancy"></i>
                    Passer l'examen
                </button>
            </div>
        </div>
    );
}

// ── FilterSelect ─────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, icon }) {
    return (
        <div style={{ position: 'relative', minWidth: 150 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13, pointerEvents: 'none', zIndex: 1 }}>
                <i className={icon}></i>
            </div>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                    border: `1.5px solid ${value ? TEAL : '#e5e7eb'}`,
                    borderRadius: 10, fontSize: 13, color: value ? NAVY : '#6b7280',
                    background: value ? '#f0fdf9' : 'white', cursor: 'pointer',
                    outline: 'none', appearance: 'none', fontFamily: 'inherit',
                    fontWeight: value ? 600 : 400, transition: 'all .15s', width: '100%',
                }}
            >
                <option value="">{label}</option>
                {options.map(o => (
                    <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
                ))}
            </select>
            <i className="fas fa-chevron-down" style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, color: '#9ca3af', pointerEvents: 'none',
            }}></i>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Exams() {
    const { t } = useLang();
    const [exams, setExams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [viewingExam, setViewingExam] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        category_id: '', filiere: '', matiere: '', niveau: '', annee: '',
    });
    const [search, setSearch] = useState('');

    const setFilter = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

    const fetchExams = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
        if (search.trim()) params.append('search', search.trim());

        api.get(`/api/exams?${params.toString()}`)
            .then(r => setExams(r.data?.exams || r.data?.data || []))
            .catch(() => setExams([]))
            .finally(() => setLoading(false));
    }, [filters, search]);

    useEffect(() => {
        api.get('/api/public/categories')
            .then(r => setCategories(r.data?.data || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    const clearFilters = () => {
        setFilters({ category_id: '', filiere: '', matiere: '', niveau: '', annee: '' });
        setSearch('');
    };

    const hasActiveFilters = search.trim() || Object.values(filters).some(v => v);

    // Derive unique filiere/matiere values from loaded exams for filter options
    const filiereOptions = [...new Set(exams.map(e => e.filiere).filter(Boolean))];
    const matiereOptions = [...new Set(exams.map(e => e.matiere).filter(Boolean))];

    return (
        <div style={{ background: '#F8FAFB', minHeight: 'calc(100vh - 64px)' }}>

            {/* ── Page Header ── */}
            <div style={{ background: `linear-gradient(165deg, #e6faf8 0%, #f0fdfa 40%, white 100%)`, padding: '42px 0 36px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={W}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: 1, textTransform: 'uppercase' }}>
                                <i className="fas fa-file-alt" style={{ marginRight: 6 }}></i>
                                INSAM-IA
                            </span>
                            <h1 style={{ fontSize: 30, fontWeight: 800, color: NAVY, margin: '8px 0 10px', lineHeight: 1.2 }}>
                                Bibliotheque de sujets d'examens
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
                                Acces aux sujets d'examens classes par specialite, matiere et niveau. Consultez ou partagez vos propres sujets.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUpload(true)}
                            style={{
                                background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                color: 'white', border: 'none', borderRadius: 12,
                                padding: '13px 24px', fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                                fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                                transition: 'all .2s', whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(91,188,180,0.50)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,188,180,0.35)'}
                        >
                            <i className="fas fa-plus"></i>
                            Soumettre un sujet
                        </button>
                    </div>

                    {/* Stats bar */}
                    <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
                        {[
                            { icon: 'fas fa-file-alt', val: exams.length, label: 'sujets disponibles', color: TEAL },
                            { icon: 'fas fa-shield-alt', val: exams.filter(e => !e.student_id).length, label: 'officiels', color: NAVY },
                            { icon: 'fas fa-user-graduate', val: exams.filter(e => !!e.student_id).length, label: 'etudiant(s)', color: '#F5A623' },
                            { icon: 'fas fa-eye', val: exams.reduce((s, e) => s + (e.views_count || 0), 0), label: 'consultations', color: '#6366f1' },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 15 }}>
                                    <i className={s.icon}></i>
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{s.val}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '16px 0', position: 'sticky', top: 64, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ ...W, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 220px' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher un sujet..."
                            style={{
                                width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                                border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13,
                                outline: 'none', fontFamily: 'inherit', color: '#1e293b',
                                boxSizing: 'border-box', transition: 'border-color .15s',
                            }}
                            onFocus={e => e.target.style.borderColor = TEAL}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>

                    <FilterSelect
                        label="Categorie" value={filters.category_id} icon="fas fa-tag"
                        onChange={v => setFilter('category_id', v)}
                        options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                    />
                    <FilterSelect
                        label="Specialite" value={filters.filiere} icon="fas fa-graduation-cap"
                        onChange={v => setFilter('filiere', v)}
                        options={filiereOptions}
                    />
                    <FilterSelect
                        label="Matiere" value={filters.matiere} icon="fas fa-book"
                        onChange={v => setFilter('matiere', v)}
                        options={matiereOptions}
                    />
                    <FilterSelect
                        label="Niveau" value={filters.niveau} icon="fas fa-layer-group"
                        onChange={v => setFilter('niveau', v)}
                        options={NIVEAUX}
                    />
                    <FilterSelect
                        label="Annee" value={filters.annee} icon="fas fa-calendar"
                        onChange={v => setFilter('annee', v)}
                        options={ANNEES}
                    />

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            style={{
                                background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10,
                                color: '#ef4444', padding: '9px 14px', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <i className="fas fa-times"></i>
                            Effacer
                        </button>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ ...W, padding: '32px 24px' }}>

                {/* Results count */}
                {!loading && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                            {exams.length === 0
                                ? 'Aucun sujet trouve'
                                : `${exams.length} sujet${exams.length > 1 ? 's' : ''} trouve${exams.length > 1 ? 's' : ''}`
                            }
                            {hasActiveFilters && <span style={{ color: TEAL, fontWeight: 600 }}> · filtres actifs</span>}
                        </p>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} style={{ background: 'white', borderRadius: 16, height: 220, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                                <div style={{ height: 5, background: '#f3f4f6' }} />
                                <div style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                                        <div style={{ width: 60, height: 20, borderRadius: 10, background: '#f3f4f6' }} />
                                        <div style={{ width: 40, height: 20, borderRadius: 10, background: '#f3f4f6' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ width: '80%', height: 14, borderRadius: 4, background: '#f3f4f6', marginBottom: 8 }} />
                                            <div style={{ width: '55%', height: 12, borderRadius: 4, background: '#f3f4f6' }} />
                                        </div>
                                    </div>
                                    <div style={{ width: '60%', height: 12, borderRadius: 4, background: '#f3f4f6', marginBottom: 7 }} />
                                    <div style={{ width: '45%', height: 12, borderRadius: 4, background: '#f3f4f6' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && exams.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 20,
                            background: '#f3f4f6', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 20px', fontSize: 34, color: '#d1d5db',
                        }}>
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                            {hasActiveFilters ? 'Aucun sujet pour ces filtres' : 'Aucun sujet disponible'}
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
                            {hasActiveFilters
                                ? 'Essayez de modifier vos criteres de recherche.'
                                : 'Soyez le premier a soumettre un sujet d\'examen !'}
                        </p>
                        {hasActiveFilters
                            ? <button onClick={clearFilters} style={{ background: TEAL, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Effacer les filtres
                            </button>
                            : <button onClick={() => setShowUpload(true)} style={{ background: `linear-gradient(135deg, ${TEAL}, #3da89e)`, color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(91,188,180,0.35)' }}>
                                <i className="fas fa-plus" style={{ marginRight: 8 }}></i>Soumettre un sujet
                            </button>
                        }
                    </div>
                )}

                {/* Grid */}
                {!loading && exams.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {exams.map(exam => (
                            <ExamCard
                                key={exam.id}
                                exam={exam}
                                onView={setViewingExam}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Upload Modal ── */}
            {showUpload && (
                <UploadModal
                    categories={categories}
                    onClose={() => setShowUpload(false)}
                    onSuccess={fetchExams}
                />
            )}

            {/* ── Exam Taker Modal ── */}
            {viewingExam && (
                <ExamTaker
                    exam={viewingExam}
                    onClose={() => setViewingExam(null)}
                />
            )}
        </div>
    );
}
