import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';

function renderMd(md) {
    if (!md) return '';
    return md
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^#### (.+)$/gm, '<h4 style="font-size:14px;font-weight:700;color:#1B2A4A;margin:14px 0 6px;">$1</h4>')
        .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;color:#1B2A4A;margin:16px 0 6px;">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:800;color:#1B2A4A;margin:20px 0 8px;border-bottom:2px solid #e5e7eb;padding-bottom:6px;">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 style="font-size:19px;font-weight:800;color:#1B2A4A;margin:22px 0 10px;">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1B2A4A;">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;color:#e74c3c;">$1</code>')
        .replace(/^[\-\*] (.+)$/gm, '<li style="margin:4px 0;">$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;list-style-type:decimal;">$1</li>')
        .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, m => {
            const isOl = m.includes('list-style-type:decimal');
            return `<${isOl ? 'ol' : 'ul'} style="margin:8px 0 8px 20px;">${m}</${isOl ? 'ol' : 'ul'}>`;
        })
        .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">')
        .replace(/\n{2,}/g, '</p><p style="margin:0 0 8px;line-height:1.75;color:#374151;">')
        .replace(/\n/g, '<br>');
}

const revCSS = `
.rev-main { flex:1; display:flex; overflow:hidden; }
.rev-left { width:420px; flex-shrink:0; display:flex; flex-direction:column; background:white; border-right:2px solid ${TEAL}30; }
.rev-right { flex:1; display:flex; flex-direction:column; min-width:0; }
@media(max-width:900px){
  .rev-main { flex-direction:column; }
  .rev-left { width:100%; height:50%; border-right:none; border-bottom:2px solid ${TEAL}30; }
  .rev-right { flex:1; }
  .rev-header-btns { gap:4px!important; }
  .rev-header-btns button { font-size:10px!important; padding:4px 8px!important; }
}
@media(max-width:600px){
  .rev-left { height:45%; }
}
`;

export default function CourseRevision() {
    const { docId } = useParams();
    const [params] = useSearchParams();
    const { user } = useAuth();
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const title = params.get('title') || 'Cours';
    const ueName = params.get('ue') || '';
    const filePath = params.get('file') || '';
    const categoryId = params.get('cat') || '';

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(true);

    // Quiz state
    const [quizQuestions, setQuizQuestions] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);

    // Exercises state
    const [exerciseLoading, setExerciseLoading] = useState(false);

    // Auto-generate summary on mount
    useEffect(() => {
        generateSummary();
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const generateSummary = async () => {
        setSummaryLoading(true);
        setMessages([{ role: 'system', content: 'Generation du resume detaille en cours...' }]);
        try {
            const res = await api.post('/api/exams/summarize-course', {
                course_title: title,
                course_content: '',
                filiere: ueName,
            });
            const summary = res.data.summary || 'Resume non disponible.';
            setMessages([{ role: 'assistant', content: summary }]);
        } catch {
            setMessages([{ role: 'assistant', content: 'Erreur lors de la generation du resume. Vous pouvez poser vos questions directement.' }]);
        } finally {
            setSummaryLoading(false);
        }
    };

    const sendMessage = async () => {
        const q = input.trim();
        if (!q || loading) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: q }]);
        setLoading(true);
        try {
            const context = messages
                .filter(m => m.role !== 'system')
                .map(m => `${m.role === 'user' ? 'Etudiant' : 'IA'}: ${m.content}`)
                .join('\n\n');

            const res = await api.post('/api/chat', {
                message: `Contexte: L'etudiant revise le cours "${title}" (UE: ${ueName}). Voici la conversation precedente:\n\n${context}\n\nNouvelle question de l'etudiant: ${q}\n\nReponds de maniere pedagogique avec des exemples concrets et des exercices pratiques quand c'est pertinent. Utilise le format Markdown.`,
            });
            const answer = res.data?.response || res.data?.message || res.data?.answer || 'Pas de reponse.';
            setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion. Reessayez.' }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const generateQuiz = async () => {
        if (quizLoading) return;
        setQuizLoading(true);
        setQuizQuestions(null);
        setQuizAnswers({});
        setQuizSubmitted(false);
        try {
            const res = await api.post('/api/exams/generate-quiz', {
                course_title: title,
                course_content: '',
                num_questions: 5,
            });
            setQuizQuestions(res.data.questions || []);
        } catch {
            setQuizQuestions([]);
        } finally {
            setQuizLoading(false);
        }
    };

    const generateExercises = async () => {
        if (exerciseLoading) return;
        setExerciseLoading(true);
        try {
            const res = await api.post('/api/exams/generate-exercises', {
                matiere: title,
                filiere: ueName,
            });
            const exercise = res.data.exercise || 'Aucun exercice genere.';
            setMessages(prev => [...prev, { role: 'assistant', content: '**Exercices generes par l\'IA:**\n\n' + exercise }]);
            // Close quiz panel if open
            setQuizQuestions(null);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur lors de la generation des exercices.' }]);
        } finally {
            setExerciseLoading(false);
        }
    };

    const quizScore = () => {
        if (!quizQuestions?.length) return 0;
        let correct = 0;
        quizQuestions.forEach((q, i) => { if (quizAnswers[i] === q.correct) correct++; });
        return correct;
    };

    const pdfUrl = filePath
        ? `/api/exams/view-pdf?path=${encodeURIComponent(filePath)}#toolbar=0&navpanes=0`
        : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafb' }}>
            <style>{revCSS}{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div style={{
                background: NAVY, padding: '8px 16px',
                display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                borderBottom: `3px solid ${TEAL}`,
            }}>
                <Link to={categoryId ? `/formations/${categoryId}` : '/formations'}
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                >
                    <i className="fas fa-arrow-left"></i>
                </Link>
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }}></div>
                <i className="fas fa-book-reader" style={{ color: TEAL, fontSize: 14, flexShrink: 0 }}></i>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                    </h3>
                    {ueName && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{ueName}</span>}
                </div>
                <div className="rev-header-btns" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button onClick={generateSummary} disabled={summaryLoading}
                        style={{
                            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
                            cursor: summaryLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        }}
                    >
                        <i className="fas fa-file-alt" style={{ fontSize: 10 }}></i> Resume
                    </button>
                    <button onClick={generateExercises} disabled={exerciseLoading}
                        style={{
                            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                            background: exerciseLoading ? 'rgba(255,255,255,0.05)' : '#F5A623',
                            color: 'white', border: 'none',
                            cursor: exerciseLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        }}
                    >
                        <i className={exerciseLoading ? 'fas fa-circle-notch fa-spin' : 'fas fa-pen-fancy'} style={{ fontSize: 10 }}></i> Exercices
                    </button>
                    <button onClick={generateQuiz} disabled={quizLoading}
                        style={{
                            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                            background: quizLoading ? 'rgba(255,255,255,0.05)' : (quizQuestions ? '#E74C3C' : TEAL),
                            color: 'white', border: 'none',
                            cursor: quizLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        }}
                    >
                        <i className={quizLoading ? 'fas fa-circle-notch fa-spin' : 'fas fa-question-circle'} style={{ fontSize: 10 }}></i> Quiz
                    </button>
                </div>
            </div>

            {/* Main content: AI LEFT | Course RIGHT */}
            <div className="rev-main">

                {/* LEFT: AI chat */}
                <div className="rev-left">
                    {/* Chat header */}
                    <div style={{
                        padding: '10px 16px', borderBottom: '1px solid #e5e7eb',
                        display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa', flexShrink: 0,
                    }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 14 }}>
                            <i className="fas fa-robot"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Assistant IA</div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>Posez vos questions sur ce cours</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                marginBottom: 12,
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}>
                                {msg.role !== 'user' && (
                                    <div style={{
                                        width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2,
                                        background: msg.role === 'system' ? '#f3f4f6' : `${TEAL}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: msg.role === 'system' ? '#9ca3af' : TEAL, fontSize: 11,
                                    }}>
                                        <i className={msg.role === 'system' ? 'fas fa-circle-notch fa-spin' : 'fas fa-robot'}></i>
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: '88%',
                                    padding: msg.role === 'user' ? '8px 12px' : '10px 14px',
                                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                    background: msg.role === 'user' ? TEAL : '#f8fafb',
                                    color: msg.role === 'user' ? 'white' : '#374151',
                                    fontSize: 12, lineHeight: 1.75,
                                    border: msg.role === 'user' ? 'none' : '1px solid #f0f0f0',
                                    boxShadow: msg.role === 'user' ? '0 2px 8px rgba(91,188,180,0.2)' : 'none',
                                }}>
                                    {msg.role === 'user' ? (
                                        <span>{msg.content}</span>
                                    ) : msg.role === 'system' ? (
                                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{msg.content}</span>
                                    ) : (
                                        <div dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 11 }}>
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                </div>
                                <div style={{ padding: '8px 12px', borderRadius: '14px 14px 14px 4px', background: '#f8fafb', border: '1px solid #f0f0f0', fontSize: 12, color: '#9ca3af' }}>
                                    L'IA reflechit...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick actions */}
                    <div style={{ padding: '4px 14px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {[
                            'Explique le chapitre 1',
                            'Donne un exercice',
                            'Points cles ?',
                            'Resume rapide',
                        ].map((q, i) => (
                            <button key={i} onClick={() => { setInput(q); }}
                                style={{
                                    fontSize: 9, padding: '3px 8px', borderRadius: 20,
                                    background: '#f3f4f6', color: '#6b7280', border: 'none',
                                    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '8px 14px 10px', borderTop: '1px solid #e5e7eb',
                        display: 'flex', gap: 8, alignItems: 'flex-end', background: 'white', flexShrink: 0,
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Posez une question..."
                            rows={1}
                            style={{
                                flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 10,
                                padding: '8px 12px', fontSize: 12, fontFamily: 'inherit',
                                outline: 'none', resize: 'none', lineHeight: 1.5,
                                color: '#1e293b', maxHeight: 80, transition: 'border-color .15s',
                            }}
                            onFocus={e => e.target.style.borderColor = TEAL}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'; }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            style={{
                                width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
                                background: loading || !input.trim() ? '#e5e7eb' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                color: 'white', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                                boxShadow: loading || !input.trim() ? 'none' : '0 2px 8px rgba(91,188,180,0.3)',
                            }}
                        >
                            <i className={loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-paper-plane'}></i>
                        </button>
                    </div>
                </div>

                {/* RIGHT: Course content (PDF or Quiz) */}
                <div className="rev-right">
                    {quizQuestions ? (
                        /* Quiz panel */
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'white' }}>
                            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <i className="fas fa-question-circle" style={{ color: '#F5A623', fontSize: 20 }}></i>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 }}>Quiz — {title}</h3>
                                    <button onClick={() => setQuizQuestions(null)}
                                        style={{ marginLeft: 'auto', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                    >
                                        <i className="fas fa-times" style={{ fontSize: 10 }}></i> Fermer le quiz
                                    </button>
                                </div>

                                {quizQuestions.length === 0 ? (
                                    <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>Impossible de generer le quiz. Reessayez.</p>
                                ) : (
                                    <>
                                        {quizQuestions.map((q, qi) => (
                                            <div key={qi} style={{ marginBottom: 18, padding: '16px', borderRadius: 12, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>{qi + 1}. {q.question}</p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {q.options?.map((opt, oi) => {
                                                        const selected = quizAnswers[qi] === oi;
                                                        const isCorrect = oi === q.correct;
                                                        let bg = 'white', border = '#e5e7eb', color = NAVY;
                                                        if (quizSubmitted) {
                                                            if (isCorrect) { bg = '#d1fae5'; border = '#6ee7b7'; color = '#065f46'; }
                                                            else if (selected && !isCorrect) { bg = '#fee2e2'; border = '#fca5a5'; color = '#991b1b'; }
                                                        } else if (selected) {
                                                            bg = '#e8f8f5'; border = TEAL; color = TEAL;
                                                        }
                                                        return (
                                                            <button key={oi} onClick={() => { if (!quizSubmitted) setQuizAnswers(p => ({ ...p, [qi]: oi })); }}
                                                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${border}`, background: bg, color, cursor: quizSubmitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 13, fontWeight: selected ? 700 : 500, fontFamily: 'inherit', transition: 'all .15s' }}
                                                            >
                                                                <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: selected ? (quizSubmitted ? bg : TEAL) : 'white', color: selected ? 'white' : '#9ca3af' }}>
                                                                    {String.fromCharCode(65 + oi)}
                                                                </span>
                                                                {opt}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {quizSubmitted && q.explanation && (
                                                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#f0f9ff', fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
                                                        <i className="fas fa-lightbulb" style={{ marginRight: 6, color: '#F5A623' }}></i>{q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {!quizSubmitted ? (
                                            <button onClick={() => setQuizSubmitted(true)}
                                                disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                                                style={{ width: '100%', padding: '14px', borderRadius: 12, background: Object.keys(quizAnswers).length < quizQuestions.length ? '#e5e7eb' : '#F5A623', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: Object.keys(quizAnswers).length < quizQuestions.length ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                                            >
                                                Valider mes reponses
                                            </button>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', borderRadius: 14, background: quizScore() >= quizQuestions.length * 0.6 ? '#d1fae5' : '#fef3c7', border: `1px solid ${quizScore() >= quizQuestions.length * 0.6 ? '#6ee7b7' : '#fcd34d'}` }}>
                                                <div style={{ fontSize: 36, fontWeight: 800, color: NAVY }}>{quizScore()}/{quizQuestions.length}</div>
                                                <p style={{ fontSize: 14, color: '#6b7280', margin: '8px 0 14px' }}>
                                                    {quizScore() >= quizQuestions.length * 0.8 ? 'Excellent ! Vous maitrisez ce cours.' :
                                                     quizScore() >= quizQuestions.length * 0.6 ? 'Bien ! Quelques points a revoir.' :
                                                     'Continuez a reviser pour ameliorer vos resultats.'}
                                                </p>
                                                <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); generateQuiz(); }}
                                                    style={{ padding: '10px 24px', borderRadius: 10, background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                                >
                                                    <i className="fas fa-redo" style={{ marginRight: 6 }}></i>Nouveau quiz
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            style={{ flex: 1, border: 'none', background: 'white' }}
                            title={title}
                        />
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                            <div style={{ textAlign: 'center', maxWidth: 400 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 20, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <i className="fas fa-book-open" style={{ fontSize: 32, color: TEAL }}></i>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>{title}</h3>
                                <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: '0 0 20px' }}>
                                    Ce cours n'a pas de support PDF. Utilisez l'assistant IA a gauche pour obtenir le resume, poser des questions, ou generer des exercices.
                                </p>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={generateExercises} disabled={exerciseLoading}
                                        style={{ padding: '10px 20px', borderRadius: 10, background: '#F5A623', color: 'white', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        <i className={exerciseLoading ? 'fas fa-circle-notch fa-spin' : 'fas fa-pen-fancy'}></i> Exercices
                                    </button>
                                    <button onClick={generateQuiz} disabled={quizLoading}
                                        style={{ padding: '10px 20px', borderRadius: 10, background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        <i className={quizLoading ? 'fas fa-circle-notch fa-spin' : 'fas fa-question-circle'}></i> Quiz
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
