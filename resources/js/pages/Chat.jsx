import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

const chatCSS = `
.chat-title-bar { display:flex; align-items:center; justify-content:space-between; height:60px; }
.chat-title-text { font-size:17px; }
.chat-bubble-max { max-width:68%; }
.chat-suggestions { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
@media(max-width:768px){
  .chat-title-text { font-size:14px; }
  .chat-bubble-max { max-width:85%; }
  .chat-suggestions button { font-size:11px!important; padding:6px 12px!important; }
}
@media(max-width:480px){
  .chat-bubble-max { max-width:90%; }
  .chat-title-bar { height:auto; padding:10px 0; flex-wrap:wrap; gap:8px; }
  .chat-tool-label { display:none; }
}
`;

function TypingIndicator() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 18 }}>
            <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 15, flexShrink: 0,
            }}>
                <i className="fas fa-robot"></i>
            </div>
            <div style={{
                background: '#f1f5f9', borderRadius: '18px 18px 18px 4px',
                padding: '12px 18px', display: 'flex', gap: 5, alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
                {[0, 1, 2].map(i => (
                    <span key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: TEAL,
                        display: 'inline-block',
                        animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                ))}
            </div>
        </div>
    );
}

function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div style={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: 10,
            marginBottom: 18,
        }}>
            {/* Avatar */}
            <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: isUser
                    ? `linear-gradient(135deg, ${TEAL}, #3da89e)`
                    : `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: isUser ? 14 : 15, fontWeight: 700,
            }}>
                <i className={isUser ? 'fas fa-user' : 'fas fa-robot'}></i>
            </div>

            {/* Bubble */}
            <div className="chat-bubble-max">
                <div style={{
                    background: isUser ? TEAL : '#f1f5f9',
                    color: isUser ? 'white' : '#1e293b',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '12px 16px',
                    fontSize: 14, lineHeight: 1.65,
                    boxShadow: isUser
                        ? '0 2px 8px rgba(91,188,180,0.30)'
                        : '0 1px 3px rgba(0,0,0,0.06)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                    {msg.content}
                    {msg.file_name && (
                        <div style={{
                            marginTop: 8, padding: '6px 10px',
                            background: isUser ? 'rgba(255,255,255,0.2)' : 'rgba(91,188,180,0.12)',
                            borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <i className="fas fa-paperclip"></i>
                            <span>{msg.file_name}</span>
                        </div>
                    )}
                </div>
                <div style={{
                    fontSize: 11, color: '#9ca3af', marginTop: 4,
                    textAlign: isUser ? 'right' : 'left', paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0,
                }}>
                    {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : 'maintenant'}
                </div>
            </div>
        </div>
    );
}

export default function Chat() {
    const { t } = useLang();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    // UE selector
    const [ues, setUes] = useState([]);
    const [selectedUe, setSelectedUe] = useState('');

    // AI Tools state
    const [toolPanel, setToolPanel] = useState(null); // 'summary', 'ue', null
    const [formations, setFormations] = useState([]);
    const [selectedFormation, setSelectedFormation] = useState(null);
    const [summaryResult, setSummaryResult] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizCourseTitle, setQuizCourseTitle] = useState('');
    const [completedCourses, setCompletedCourses] = useState(new Set());
    const [speaking, setSpeaking] = useState(false);

    // Inject keyframe animation once
    useEffect(() => {
        const id = 'chat-keyframes';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = `
                @keyframes typing-bounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-5px); opacity: 1; }
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    // Load formations and UEs for the tools
    useEffect(() => {
        api.get('/api/my-formations').then(r => {
            setFormations(r.data.formations || []);
        }).catch(() => {});
        api.get('/api/public/unites-enseignement').then(r => {
            setUes(r.data?.data || r.data || []);
        }).catch(() => {});
    }, []);

    // TTS functions
    const speakText = (text) => {
        if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
        const clean = (text || '').replace(/#{1,3}\s/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`[^`]+`/g, '').replace(/[-*]\s/g, '');
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = 'fr-FR'; utter.rate = 0.9;
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
        setSpeaking(true);
    };

    // Summarize a course
    const handleSummarize = async (courseTitle, partial) => {
        setSummaryLoading(true); setSummaryResult(null);
        try {
            const r = await api.post('/api/exams/summarize-course', {
                course_title: courseTitle,
                course_content: '',
                partial: partial || null,
                filiere: user?.filiere || '',
            });
            setSummaryResult(r.data.summary);
        } catch { toast.error('Erreur lors du resume.'); }
        finally { setSummaryLoading(false); }
    };

    // Generate quiz for a course/UE
    const handleGenerateQuiz = async (courseTitle) => {
        setQuizLoading(true); setQuizQuestions(null); setQuizAnswers({}); setQuizSubmitted(false); setQuizCourseTitle(courseTitle);
        try {
            const r = await api.post('/api/exams/generate-quiz', {
                course_title: courseTitle,
                num_questions: 10,
            });
            setQuizQuestions(r.data.questions);
        } catch { toast.error('Erreur lors de la generation du quiz.'); }
        finally { setQuizLoading(false); }
    };

    const quizScore = () => {
        if (!quizQuestions) return 0;
        return quizQuestions.filter((q, i) => quizAnswers[i] === q.correct).length;
    };

    const markCourseCompleted = async (courseTitle) => {
        try {
            await api.post('/api/course-progress/mark-completed', {
                subject: user?.filiere || 'General',
                title: courseTitle,
            });
            setCompletedCourses(prev => new Set([...prev, courseTitle]));
            toast.success('Cours marqué comme terminé !');
        } catch { toast.error('Erreur'); }
    };

    // Load history on mount
    useEffect(() => {
        setHistoryLoading(true);
        api.get('/api/chat/history')
            .then(r => {
                const data = r.data?.data || r.data || [];
                // API returns paginated newest-first; reverse to show oldest at top
                const ordered = [...data].reverse();
                setMessages(ordered);
            })
            .catch(() => {
                // No history or unauthenticated — start fresh
                setMessages([]);
            })
            .finally(() => setHistoryLoading(false));
    }, []);

    // Auto-scroll to bottom whenever messages change or typing appears
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const maxMB = 10;
        if (f.size > maxMB * 1024 * 1024) {
            toast.error(`Fichier trop volumineux (max ${maxMB} Mo)`);
            return;
        }
        setFile(f);
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text && !file) return;
        if (loading) return;

        // Optimistic user message
        const userMsg = {
            role: 'user',
            content: text,
            file_name: file?.name || null,
            created_at: new Date().toISOString(),
            _id: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setLoading(true);

        try {
            let response;
            if (file) {
                const fd = new FormData();
                fd.append('message', text);
                fd.append('file', file);
                if (selectedUe) fd.append('ue_id', selectedUe);
                response = await api.post('/api/chat', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                const payload = { message: text };
                if (selectedUe) payload.ue_id = selectedUe;
                response = await api.post('/api/chat', payload);
            }

            const aiContent = response.data?.reply
                || response.data?.message
                || response.data?.content
                || response.data?.data?.content
                || 'Reponse recue.';

            const aiMsg = {
                role: 'assistant',
                content: aiContent,
                created_at: response.data?.created_at || new Date().toISOString(),
                _id: Date.now() + 1,
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errText = err.response?.data?.message || 'Une erreur est survenue. Veuillez reessayer.';
            toast.error(errText);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m._id !== userMsg._id));
        } finally {
            setLoading(false);
        }
    }, [input, file, loading]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const autoResize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    };

    const isEmpty = messages.length === 0 && !historyLoading;

    return (
        <div style={{ background: '#F8FAFB', minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <style>{chatCSS}</style>

            {/* ── Title Bar ── */}
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="chat-title-bar" style={{ ...W }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 18,
                        }}>
                            <i className="fas fa-robot"></i>
                        </div>
                        <div>
                            <h1 className="chat-title-text" style={{ fontWeight: 800, color: NAVY, margin: 0 }}>
                                Assistant IA INSAM
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>En ligne · disponible 24h/7</span>
                            </div>
                        </div>
                    </div>
                    {/* UE selector + Tool buttons */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* UE Selector */}
                        <div style={{ position: 'relative' }}>
                            <i className="fas fa-book" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: selectedUe ? TEAL : '#9ca3af', fontSize: 12, pointerEvents: 'none' }}></i>
                            <select
                                value={selectedUe}
                                onChange={e => setSelectedUe(e.target.value)}
                                style={{
                                    paddingLeft: 30, paddingRight: 28, paddingTop: 8, paddingBottom: 8,
                                    borderRadius: 10, fontSize: 12, fontWeight: 600,
                                    border: selectedUe ? `2px solid ${TEAL}` : '1.5px solid #e5e7eb',
                                    background: selectedUe ? '#e8f8f5' : 'white',
                                    color: selectedUe ? TEAL : '#6b7280',
                                    cursor: 'pointer', outline: 'none', appearance: 'none',
                                    fontFamily: 'inherit', maxWidth: 220,
                                }}
                            >
                                <option value="">Toutes les UE</option>
                                {ues.map(ue => (
                                    <option key={ue.id} value={ue.id}>{ue.code ? `${ue.code} - ` : ''}{ue.nom || ue.name}</option>
                                ))}
                            </select>
                            <i className="fas fa-chevron-down" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: '#9ca3af', pointerEvents: 'none' }}></i>
                        </div>

                        {[
                            { key: 'summary', icon: 'fas fa-book-reader', label: 'Resume de cours' },
                            { key: 'ue', icon: 'fas fa-graduation-cap', label: 'UE + Quiz' },
                        ].map(tool => (
                            <button key={tool.key} onClick={() => setToolPanel(toolPanel === tool.key ? null : tool.key)}
                                title={tool.label}
                                style={{
                                    padding: '8px 14px', borderRadius: 10,
                                    border: toolPanel === tool.key ? `2px solid ${TEAL}` : '1.5px solid #e5e7eb',
                                    background: toolPanel === tool.key ? '#e8f8f5' : 'white',
                                    color: toolPanel === tool.key ? TEAL : '#6b7280',
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                                }}>
                                <i className={tool.icon}></i>
                                <span className="chat-tool-label">{tool.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── AI Tool Panel ── */}
            {toolPanel && (
                <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '20px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ ...W, maxWidth: 900, width: '100%' }}>

                        {/* === SUMMARY TOOL === */}
                        {toolPanel === 'summary' && (
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 12 }}>
                                    <i className="fas fa-book-reader" style={{ color: TEAL, marginRight: 8 }}></i>
                                    Resume de cours
                                </h3>
                                {formations.length > 0 ? (
                                    <div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                                            {formations.slice(0, 8).map((f, i) => (
                                                <button key={i} onClick={() => { setSelectedFormation(f); handleSummarize(f.intitule || f.title); }}
                                                    style={{
                                                        padding: '8px 14px', borderRadius: 20,
                                                        border: selectedFormation === f ? `2px solid ${TEAL}` : '1.5px solid #e5e7eb',
                                                        background: selectedFormation === f ? '#e8f8f5' : 'white',
                                                        color: selectedFormation === f ? TEAL : NAVY,
                                                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                                        textTransform: 'capitalize',
                                                    }}>
                                                    {(f.intitule || f.title || 'Cours').substring(0, 40)}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedFormation && selectedFormation.chapitres?.length > 0 && (
                                            <div style={{ marginBottom: 14 }}>
                                                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                                                    Ou resumer une partie specifique :
                                                </span>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {selectedFormation.chapitres.map((ch, ci) => (
                                                        <button key={ci} onClick={() => handleSummarize(selectedFormation.intitule, ch.intitule)}
                                                            style={{
                                                                padding: '6px 12px', borderRadius: 16,
                                                                border: '1px solid #e5e7eb', background: '#fafafa',
                                                                color: '#374151', fontSize: 11, fontWeight: 500,
                                                                cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                                                            }}>
                                                            {(ch.intitule || `Chapitre ${ci + 1}`).substring(0, 35)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: 13, color: '#9ca3af' }}>Aucune formation trouvee pour votre filiere.</p>
                                )}

                                {summaryLoading && (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: 20, color: TEAL }}></i>
                                        <p style={{ fontSize: 13, marginTop: 8 }}>Generation du resume...</p>
                                    </div>
                                )}
                                {summaryResult && (
                                    <div style={{ background: '#f8fafb', borderRadius: 14, padding: 20, border: '1px solid #f0f0f0', marginTop: 12, maxHeight: 400, overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Resume genere</span>
                                            <button onClick={() => speakText(summaryResult)} style={{
                                                padding: '6px 14px', borderRadius: 8,
                                                border: `1.5px solid ${speaking ? '#ef4444' : TEAL}`,
                                                background: speaking ? '#fef2f2' : '#f0fdf9',
                                                color: speaking ? '#ef4444' : TEAL,
                                                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            }}>
                                                <i className={`fas fa-${speaking ? 'stop' : 'volume-up'}`} style={{ marginRight: 5 }}></i>
                                                {speaking ? 'Arreter' : 'Lire le cours'}
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap' }}>
                                            {summaryResult}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === UE + QUIZ TOOL === */}
                        {toolPanel === 'ue' && (
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 12 }}>
                                    <i className="fas fa-graduation-cap" style={{ color: TEAL, marginRight: 8 }}></i>
                                    Unites d'Enseignement
                                </h3>
                                {formations.length > 0 ? (
                                    <div>
                                        {/* Formation list with quiz buttons */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
                                            {formations.map((f, fi) => (
                                                <div key={fi} style={{
                                                    background: selectedFormation === f ? '#e8f8f5' : '#fafafa',
                                                    borderRadius: 12, padding: 16, border: selectedFormation === f ? `2px solid ${TEAL}` : '1px solid #f0f0f0',
                                                    cursor: 'pointer',
                                                }} onClick={() => setSelectedFormation(f)}>
                                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: '0 0 6px', textTransform: 'capitalize' }}>
                                                        {(f.intitule || f.title || 'UE').substring(0, 50)}
                                                    </h4>
                                                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
                                                        {f.chapitres?.length || 0} chapitre{(f.chapitres?.length || 0) > 1 ? 's' : ''}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); speakText(`Cours: ${f.intitule}. ${f.chapitres?.map(c => c.intitule).join('. ') || ''}`); }}
                                                            style={{
                                                                padding: '5px 12px', borderRadius: 6, border: `1px solid ${TEAL}`,
                                                                background: 'white', color: TEAL, fontSize: 11, fontWeight: 600,
                                                                cursor: 'pointer', fontFamily: 'inherit',
                                                            }}>
                                                            <i className="fas fa-volume-up" style={{ marginRight: 4 }}></i>Lire
                                                        </button>
                                                        {completedCourses.has(f.intitule || f.title) ? (
                                                            <button disabled style={{
                                                                padding: '5px 12px', borderRadius: 6, border: '1px solid #22c55e',
                                                                background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 600,
                                                                cursor: 'default', fontFamily: 'inherit',
                                                            }}>
                                                                <i className="fas fa-check" style={{ marginRight: 4 }}></i>Terminé
                                                            </button>
                                                        ) : (
                                                            <button onClick={(e) => { e.stopPropagation(); markCourseCompleted(f.intitule || f.title); }}
                                                                style={{
                                                                    padding: '5px 12px', borderRadius: 6, border: '1px solid #f59e0b',
                                                                    background: '#fffbeb', color: '#d97706', fontSize: 11, fontWeight: 600,
                                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                                }}>
                                                                <i className="fas fa-check-circle" style={{ marginRight: 4 }}></i>Terminé
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); handleGenerateQuiz(f.intitule || f.title); }}
                                                            style={{
                                                                padding: '5px 12px', borderRadius: 6, border: 'none',
                                                                background: TEAL, color: 'white', fontSize: 11, fontWeight: 600,
                                                                cursor: 'pointer', fontFamily: 'inherit',
                                                            }}>
                                                            <i className="fas fa-question-circle" style={{ marginRight: 4 }}></i>Passer au Quiz
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Selected formation chapters */}
                                        {selectedFormation && selectedFormation.chapitres?.length > 0 && !quizQuestions && (
                                            <div style={{ background: '#fafafa', borderRadius: 12, padding: 16, border: '1px solid #f0f0f0', marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
                                                <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 10, textTransform: 'capitalize' }}>
                                                    {selectedFormation.intitule || 'Cours'}
                                                </h4>
                                                {selectedFormation.chapitres.map((ch, ci) => (
                                                    <div key={ci} style={{ marginBottom: 10 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4, textTransform: 'capitalize' }}>
                                                            <i className="fas fa-bookmark" style={{ color: TEAL, marginRight: 6, fontSize: 11 }}></i>
                                                            {ch.intitule || `Chapitre ${ci + 1}`}
                                                        </div>
                                                        {ch.videos?.map((v, vi) => (
                                                            <a key={vi} href={v.lien || '#'} target="_blank" rel="noopener noreferrer"
                                                                style={{ display: 'block', fontSize: 12, color: TEAL, marginLeft: 20, padding: '2px 0', textDecoration: 'none', textTransform: 'capitalize' }}>
                                                                <i className="fas fa-play-circle" style={{ marginRight: 5, fontSize: 10 }}></i>
                                                                {v.intitule || 'Video'}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: 13, color: '#9ca3af' }}>Aucune formation trouvee pour votre filiere.</p>
                                )}

                                {quizLoading && (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: 20, color: TEAL }}></i>
                                        <p style={{ fontSize: 13, marginTop: 8 }}>Generation du quiz...</p>
                                    </div>
                                )}

                                {/* Quiz display */}
                                {quizQuestions && (
                                    <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #f0f0f0' }}>
                                        <h4 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>
                                            <i className="fas fa-question-circle" style={{ color: TEAL, marginRight: 8 }}></i>
                                            Quiz - {quizQuestions.length} questions
                                        </h4>
                                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                            {quizQuestions.map((q, qi) => (
                                                <div key={qi} style={{ marginBottom: 20, padding: 16, background: '#f8fafb', borderRadius: 10 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
                                                        {qi + 1}. {q.question}
                                                    </p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {q.options?.map((opt, oi) => {
                                                            const selected = quizAnswers[qi] === oi;
                                                            const isCorrect = q.correct === oi;
                                                            let bg = 'white', border = '#e5e7eb', color = NAVY;
                                                            if (quizSubmitted) {
                                                                if (isCorrect) { bg = '#dcfce7'; border = '#22c55e'; color = '#166534'; }
                                                                else if (selected && !isCorrect) { bg = '#fef2f2'; border = '#ef4444'; color = '#991b1b'; }
                                                            } else if (selected) {
                                                                bg = '#e8f8f5'; border = TEAL; color = TEAL;
                                                            }
                                                            return (
                                                                <button key={oi} onClick={() => { if (!quizSubmitted) setQuizAnswers(p => ({ ...p, [qi]: oi })); }}
                                                                    style={{
                                                                        padding: '10px 14px', borderRadius: 8,
                                                                        border: `1.5px solid ${border}`, background: bg,
                                                                        color, fontSize: 13, fontWeight: selected ? 600 : 400,
                                                                        cursor: quizSubmitted ? 'default' : 'pointer',
                                                                        fontFamily: 'inherit', textAlign: 'left',
                                                                    }}>
                                                                    <span style={{ fontWeight: 700, marginRight: 8 }}>{['A', 'B', 'C', 'D'][oi]}.</span>
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {quizSubmitted && q.explanation && (
                                                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' }}>
                                                            <i className="fas fa-info-circle" style={{ marginRight: 5 }}></i>{q.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {!quizSubmitted ? (
                                            <button onClick={() => {
                                                setQuizSubmitted(true);
                                                const score = quizQuestions.filter((q, i) => quizAnswers[i] === q.correct).length;
                                                const pct = Math.round(score / quizQuestions.length * 100);
                                                api.post('/api/course-progress', {
                                                    type: 'ue_quiz',
                                                    subject: user?.filiere || 'General',
                                                    title: quizCourseTitle || 'Quiz UE',
                                                    score: pct,
                                                    total_questions: quizQuestions.length,
                                                    correct_answers: score,
                                                    quiz_completed: true,
                                                }).catch(() => {});
                                            }} disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                                                style={{
                                                    padding: '12px 28px', borderRadius: 10, border: 'none',
                                                    background: Object.keys(quizAnswers).length < quizQuestions.length ? '#d1d5db' : TEAL,
                                                    color: 'white', fontWeight: 700, fontSize: 14,
                                                    cursor: Object.keys(quizAnswers).length < quizQuestions.length ? 'not-allowed' : 'pointer',
                                                    fontFamily: 'inherit', marginTop: 8,
                                                }}>
                                                <i className="fas fa-check" style={{ marginRight: 8 }}></i>
                                                Soumettre ({Object.keys(quizAnswers).length}/{quizQuestions.length})
                                            </button>
                                        ) : (
                                            <div style={{
                                                marginTop: 12, padding: 16, borderRadius: 12,
                                                background: quizScore() >= quizQuestions.length * 0.7 ? '#dcfce7' : '#fef3c7',
                                                border: `1px solid ${quizScore() >= quizQuestions.length * 0.7 ? '#22c55e' : '#f59e0b'}`,
                                            }}>
                                                <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>
                                                    Score: {quizScore()}/{quizQuestions.length} ({Math.round(quizScore() / quizQuestions.length * 100)}%)
                                                </div>
                                                <p style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>
                                                    {quizScore() >= quizQuestions.length * 0.7 ? 'Excellent travail !' : 'Continuez a reviser, vous pouvez vous ameliorer !'}
                                                </p>
                                                <button onClick={() => { setQuizQuestions(null); setQuizAnswers({}); setQuizSubmitted(false); }}
                                                    style={{
                                                        marginTop: 10, padding: '8px 20px', borderRadius: 8,
                                                        border: 'none', background: NAVY, color: 'white',
                                                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                                    }}>
                                                    <i className="fas fa-redo" style={{ marginRight: 6 }}></i>Nouveau quiz
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Main Chat Area ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...W, padding: '0 24px', maxWidth: 900, width: '100%' }}>

                {/* Messages scroll container */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '28px 0 8px',
                    minHeight: 0,
                }}>

                    {/* Loading history */}
                    {historyLoading && (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 24, color: TEAL }}></i>
                            <p style={{ marginTop: 12, fontSize: 14 }}>Chargement de l'historique...</p>
                        </div>
                    )}

                    {/* Empty state */}
                    {isEmpty && (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: 20,
                                background: `linear-gradient(135deg, ${TEAL}20, ${NAVY}10)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px', fontSize: 32, color: TEAL,
                            }}>
                                <i className="fas fa-robot"></i>
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
                                Bonjour ! Je suis votre assistant INSAM-IA
                            </h2>
                            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 28px' }}>
                                Posez-moi vos questions sur vos cours, vos examens ou vos formations. Je suis disponible 24h/7 pour vous aider.
                            </p>
                            <div className="chat-suggestions">
                                {[
                                    'Explique-moi les reseaux TCP/IP',
                                    'Comment reussir mon examen de Linux ?',
                                    'Resume ce cours sur la securite informatique',
                                    'Quels sont les debouches en cybersecurite ?',
                                ].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                                        style={{
                                            background: 'white', border: `1px solid ${TEAL}40`,
                                            borderRadius: 20, padding: '8px 16px',
                                            fontSize: 12, color: '#374151', cursor: 'pointer',
                                            transition: 'all .2s', fontFamily: 'inherit',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = TEAL; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = `${TEAL}40`; e.currentTarget.style.color = '#374151'; }}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {!historyLoading && messages.map((msg, i) => (
                        <div key={msg.id || msg._id || i} style={{ animation: 'fadeSlideIn .25s ease' }}>
                            <MessageBubble msg={msg} />
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && <TypingIndicator />}

                    {/* Scroll anchor */}
                    <div ref={bottomRef} />
                </div>

                {/* ── Input Area ── */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: '12px 14px',
                    marginBottom: 20,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}>
                    {/* File preview bar */}
                    {file && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: '#f0fdf9', borderRadius: 8,
                            padding: '7px 12px', marginBottom: 10,
                            border: `1px solid ${TEAL}30`,
                        }}>
                            <i className="fas fa-paperclip" style={{ color: TEAL, fontSize: 13 }}></i>
                            <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{file.name}</span>
                            <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 6 }}>
                                {(file.size / 1024).toFixed(0)} Ko
                            </span>
                            <button
                                onClick={removeFile}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 0, lineHeight: 1 }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                        {/* File upload button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title={t('chat.upload')}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: file ? TEAL : '#9ca3af', fontSize: 17, padding: '4px 6px',
                                borderRadius: 8, transition: 'color .2s', lineHeight: 1,
                                flexShrink: 0, marginBottom: 2,
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = TEAL}
                            onMouseLeave={e => e.currentTarget.style.color = file ? TEAL : '#9ca3af'}
                        >
                            <i className="fas fa-paperclip"></i>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />

                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => { setInput(e.target.value); autoResize(); }}
                            onKeyDown={handleKeyDown}
                            placeholder={t('chat.placeholder')}
                            rows={1}
                            style={{
                                flex: 1, border: 'none', outline: 'none', resize: 'none',
                                fontSize: 14, lineHeight: 1.6, color: '#1e293b',
                                background: 'transparent', fontFamily: 'inherit',
                                maxHeight: 140, overflowY: 'auto',
                                padding: '4px 0',
                            }}
                        />

                        {/* Send button */}
                        <button
                            onClick={sendMessage}
                            disabled={loading || (!input.trim() && !file)}
                            title={t('chat.send')}
                            style={{
                                width: 38, height: 38, borderRadius: 10, border: 'none',
                                background: (loading || (!input.trim() && !file))
                                    ? '#e5e7eb'
                                    : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                color: (loading || (!input.trim() && !file)) ? '#9ca3af' : 'white',
                                cursor: (loading || (!input.trim() && !file)) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 15, transition: 'all .2s', flexShrink: 0,
                                boxShadow: (loading || (!input.trim() && !file))
                                    ? 'none'
                                    : '0 2px 8px rgba(91,188,180,0.35)',
                            }}
                        >
                            {loading
                                ? <i className="fas fa-circle-notch fa-spin"></i>
                                : <i className="fas fa-paper-plane"></i>
                            }
                        </button>
                    </div>

                    {/* Hint */}
                    <div style={{ marginTop: 8, fontSize: 11, color: '#c9d0d8', textAlign: 'center' }}>
                        Appuyez sur <strong>Entree</strong> pour envoyer · <strong>Maj+Entree</strong> pour un saut de ligne
                    </div>
                </div>
            </div>
        </div>
    );
}
