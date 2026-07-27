import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';

function renderMd(md) {
    if (!md) return '';
    // Process blocks first
    let html = md;

    // Code blocks ```...```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre class="course-code"><code>${escaped.trim()}</code></pre>`;
    });

    // Tables: detect lines with |
    html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (block) => {
        const rows = block.trim().split('\n').filter(r => r.trim());
        if (rows.length < 2) return block;
        // Check if second row is separator
        const isSep = /^\|[\s\-:]+\|$/.test(rows[1]);
        let tableHtml = '<table class="course-table"><thead><tr>';
        const headerCells = rows[0].split('|').filter(c => c.trim() !== '');
        headerCells.forEach(c => { tableHtml += `<th>${c.trim()}</th>`; });
        tableHtml += '</tr></thead><tbody>';
        const startRow = isSep ? 2 : 1;
        for (let i = startRow; i < rows.length; i++) {
            const cells = rows[i].split('|').filter(c => c.trim() !== '');
            if (cells.length === 0) continue;
            tableHtml += '<tr>';
            cells.forEach(c => { tableHtml += `<td>${c.trim()}</td>`; });
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        return tableHtml;
    });

    // Escape remaining HTML (but not our generated tags)
    // We need to be careful - only escape outside of our generated HTML
    // Instead, let's process line by line for non-block elements

    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4 class="course-h4">$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="course-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="course-h2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="course-h1">$1</h1>');

    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr class="course-hr">');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="course-inline-code">$1</code>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#5BBCB4;text-decoration:none;font-weight:600;">$1</a>');

    // List items
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ol-item">$1</li>');

    // Group consecutive li into ul/ol
    html = html.replace(/((?:<li class="ol-item">[\s\S]*?<\/li>\s*)+)/g, m => `<ol class="course-ol">${m.replace(/ class="ol-item"/g, '')}</ol>`);
    html = html.replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, (m) => {
        if (m.includes('<ol')) return m;
        return `<ul class="course-ul">${m}</ul>`;
    });

    // Paragraphs
    html = html.replace(/\n{2,}/g, '</p><p class="course-p">');
    html = html.replace(/\n/g, '<br>');

    return `<p class="course-p">${html}</p>`;
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

/* Document-style course rendering */
.course-content { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a2e; }
.course-content .course-p { margin: 0 0 12px; line-height: 1.85; font-size: 14.5px; color: #2d3748; }
.course-content .course-h1 {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 22px; font-weight: 800; color: ${NAVY}; margin: 36px 0 16px;
  padding-bottom: 10px; border-bottom: 3px solid ${TEAL};
  text-transform: uppercase; letter-spacing: 0.5px;
}
.course-content .course-h2 {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 18px; font-weight: 700; color: ${NAVY}; margin: 28px 0 12px;
  padding-bottom: 6px; border-bottom: 1.5px solid #e2e8f0;
  padding-left: 12px; border-left: 4px solid ${TEAL};
}
.course-content .course-h3 {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 15.5px; font-weight: 700; color: #2d4270; margin: 22px 0 8px;
}
.course-content .course-h4 {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px; font-weight: 700; color: ${TEAL}; margin: 18px 0 6px;
  font-style: italic;
}
.course-content strong { color: ${NAVY}; font-weight: 700; }
.course-content em { color: #4a5568; }
.course-content .course-hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
.course-content .course-ul, .course-content .course-ol {
  margin: 10px 0 10px 24px; padding: 0;
}
.course-content .course-ul { list-style-type: disc; }
.course-content .course-ol { list-style-type: decimal; }
.course-content li {
  margin: 6px 0; line-height: 1.75; font-size: 14px; color: #2d3748;
  padding-left: 4px;
}
.course-content .course-inline-code {
  background: #edf2f7; padding: 2px 7px; border-radius: 4px;
  font-family: 'Courier New', monospace; font-size: 13px; color: #c53030;
  border: 1px solid #e2e8f0;
}
.course-content .course-code {
  background: #1a202c; color: #e2e8f0; padding: 16px 20px; border-radius: 10px;
  overflow-x: auto; font-size: 13px; line-height: 1.6; margin: 14px 0;
  font-family: 'Courier New', monospace; border: 1px solid #2d3748;
}
.course-content .course-table {
  width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
}
.course-content .course-table th {
  background: ${NAVY}; color: white; padding: 10px 14px; text-align: left;
  font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px;
  border: 1px solid #2d4270;
}
.course-content .course-table td {
  padding: 9px 14px; border: 1px solid #e2e8f0; color: #2d3748; line-height: 1.5;
}
.course-content .course-table tr:nth-child(even) td { background: #f7fafc; }
.course-content .course-table tr:hover td { background: #ebf8ff; }
.course-content a { color: ${TEAL}; text-decoration: none; font-weight: 600; border-bottom: 1px dashed ${TEAL}; }
.course-content a:hover { border-bottom-style: solid; }
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

    const [document, setDocument] = useState(null);
    const [docLoading, setDocLoading] = useState(true);
    const [generatedCourse, setGeneratedCourse] = useState(null);
    const [courseGenerating, setCourseGenerating] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Quiz state
    const [quizQuestions, setQuizQuestions] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);

    // Exercises state
    const [exerciseLoading, setExerciseLoading] = useState(false);

    // Right panel mode: 'course' | 'quiz' | 'audio' | 'video'
    const [rightPanel, setRightPanel] = useState('course');

    // "Lu et compris" state — persisted per doc in localStorage
    const luKey = `lu_${docId}`;
    const [luEtCompris, setLuEtCompris] = useState(() => {
        try { return localStorage.getItem(luKey) === 'true'; } catch { return false; }
    });

    // Category videos for Video tab
    const [categoryVideos, setCategoryVideos] = useState([]);
    const [videosLoading, setVideosLoading] = useState(false);

    // TTS state for Audio tab
    const [ttsPlaying, setTtsPlaying] = useState(false);
    const [ttsSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
    const utteranceRef = useRef(null);

    // Fetch document content on mount
    useEffect(() => {
        setDocLoading(true);
        api.get(`/api/public/documents/${docId}`)
            .then(res => {
                const doc = res.data.document || res.data.data || res.data;
                setDocument(doc);
                // Auto-generate full course from syllabus if no PDF
                if (doc && !doc.file_path && doc.content) {
                    generateFullCourse(doc);
                }
            })
            .catch(() => {})
            .finally(() => setDocLoading(false));
    }, [docId]);

    const markLuEtCompris = () => {
        setLuEtCompris(true);
        try { localStorage.setItem(luKey, 'true'); } catch {}
    };

    const fetchCategoryVideos = useCallback(() => {
        if (!categoryId || categoryVideos.length > 0) return;
        setVideosLoading(true);
        api.get(`/api/public/categories/${categoryId}`)
            .then(res => {
                const videos = res.data.videos || res.data.data?.videos || [];
                setCategoryVideos(videos);
            })
            .catch(() => {})
            .finally(() => setVideosLoading(false));
    }, [categoryId, categoryVideos.length]);

    const startTTS = () => {
        if (!ttsSupported) return;
        const text = document?.content || generatedCourse || '';
        if (!text) return;
        window.speechSynthesis.cancel();
        const utter = new window.SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
        utter.lang = 'fr-FR';
        utter.rate = 0.95;
        utter.onend = () => setTtsPlaying(false);
        utter.onerror = () => setTtsPlaying(false);
        utteranceRef.current = utter;
        window.speechSynthesis.speak(utter);
        setTtsPlaying(true);
    };

    const stopTTS = () => {
        window.speechSynthesis.cancel();
        setTtsPlaying(false);
    };

    // Stop TTS when leaving audio tab
    useEffect(() => {
        if (rightPanel !== 'audio') stopTTS();
        if (rightPanel === 'video') fetchCategoryVideos();
    }, [rightPanel]);

    const generateFullCourse = async (doc) => {
        setCourseGenerating(true);
        try {
            const res = await api.post('/api/exams/summarize-course', {
                course_title: doc.title || title,
                course_content: doc.content || '',
                filiere: ueName,
            });
            setGeneratedCourse(res.data.summary || '');
        } catch {
            setGeneratedCourse(null);
        } finally {
            setCourseGenerating(false);
        }
    };

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const generateSummary = async () => {
        if (summaryLoading) return;
        setSummaryLoading(true);
        const docContent = document?.content || '';
        setMessages(prev => [...prev, { role: 'system', content: 'Generation du resume detaille en cours...' }]);
        try {
            const res = await api.post('/api/exams/summarize-course', {
                course_title: document?.title || title,
                course_content: docContent,
                filiere: ueName,
            });
            const summary = res.data.summary || 'Resume non disponible.';
            setMessages(prev => [...prev.filter(m => m.role !== 'system'), { role: 'assistant', content: '**Resume du cours:**\n\n' + summary }]);
        } catch {
            setMessages(prev => [...prev.filter(m => m.role !== 'system'), { role: 'assistant', content: 'Erreur lors de la generation du resume.' }]);
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
            const docContent = document?.content || '';
            const context = messages
                .filter(m => m.role !== 'system')
                .slice(-6)
                .map(m => `${m.role === 'user' ? 'Etudiant' : 'IA'}: ${m.content}`)
                .join('\n\n');

            const res = await api.post('/api/chat', {
                message: `Contexte: L'etudiant revise le cours "${document?.title || title}" (UE: ${ueName}).\n\nContenu du cours:\n${docContent}\n\nConversation precedente:\n${context}\n\nQuestion: ${q}\n\nReponds de maniere pedagogique. Utilise le format Markdown.`,
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
        setRightPanel('quiz');
        try {
            const res = await api.post('/api/exams/generate-quiz', {
                course_title: document?.title || title,
                course_content: document?.content || '',
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
                matiere: document?.title || title,
                filiere: ueName,
            });
            const exercise = res.data.exercise || 'Aucun exercice genere.';
            setMessages(prev => [...prev, { role: 'assistant', content: '**Exercices generes par l\'IA:**\n\n' + exercise }]);
            setRightPanel('course');
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
        : (document?.file_path ? `/api/exams/view-pdf?path=${encodeURIComponent(document.file_path)}#toolbar=0&navpanes=0` : null);

    const courseContent = document?.content || '';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', background: '#f8fafb' }}>
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
                        {document?.title || title}
                    </h3>
                    {ueName && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{ueName}</span>}
                </div>
                <div className="rev-header-btns" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {luEtCompris && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="fas fa-check-circle"></i> Lu
                        </span>
                    )}
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
                    <button onClick={() => { if (document) generateFullCourse(document); }} disabled={courseGenerating}
                        style={{
                            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                            background: courseGenerating ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                            color: 'white', border: 'none',
                            cursor: courseGenerating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        }}
                    >
                        <i className={courseGenerating ? 'fas fa-circle-notch fa-spin' : 'fas fa-redo'} style={{ fontSize: 10 }}></i> Regenerer
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
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af' }}>
                                <div style={{ width: 50, height: 50, borderRadius: 14, background: `${TEAL}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <i className="fas fa-comments" style={{ fontSize: 22, color: `${TEAL}60` }}></i>
                                </div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 6px' }}>Posez une question</p>
                                <p style={{ fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                                    L'IA vous aidera a comprendre ce cours. Vous pouvez aussi utiliser les boutons Resume, Exercices et Quiz en haut.
                                </p>
                            </div>
                        )}
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

                {/* RIGHT: Course content / Quiz / Audio / Video */}
                <div className="rev-right">
                    {/* Tab bar */}
                    <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0', background: 'white', flexShrink: 0 }}>
                        {[
                            { key: 'course', icon: 'fas fa-book-open', label: 'Cours' },
                            { key: 'quiz',   icon: 'fas fa-question-circle', label: 'Quiz' },
                            { key: 'audio',  icon: 'fas fa-headphones', label: 'Audio' },
                            { key: 'video',  icon: 'fas fa-play-circle', label: 'Video' },
                        ].map(tab => (
                            <button key={tab.key}
                                onClick={() => { if (tab.key === 'quiz' && rightPanel !== 'quiz') { generateQuiz(); } else { setRightPanel(tab.key); } }}
                                style={{
                                    flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
                                    borderBottom: rightPanel === tab.key ? `2.5px solid ${TEAL}` : '2.5px solid transparent',
                                    color: rightPanel === tab.key ? TEAL : '#9ca3af',
                                    fontWeight: rightPanel === tab.key ? 700 : 500,
                                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 5, marginBottom: -2, fontFamily: 'inherit',
                                    transition: 'all .15s',
                                }}
                            >
                                <i className={tab.key === 'quiz' && quizLoading ? 'fas fa-circle-notch fa-spin' : tab.icon} style={{ fontSize: 13 }}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {rightPanel === 'quiz' && quizQuestions ? (
                        /* Quiz panel */
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'white' }}>
                            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <i className="fas fa-question-circle" style={{ color: '#F5A623', fontSize: 20 }}></i>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 }}>Quiz — {document?.title || title}</h3>
                                    <button onClick={() => setRightPanel('course')}
                                        style={{ marginLeft: 'auto', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                    >
                                        <i className="fas fa-book" style={{ fontSize: 10 }}></i> Retour au cours
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
                        /* PDF viewer */
                        <iframe
                            src={pdfUrl}
                            style={{ flex: 1, border: 'none', background: 'white' }}
                            title={document?.title || title}
                        />
                    ) : docLoading || courseGenerating ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                            <div style={{ textAlign: 'center', maxWidth: 400 }}>
                                <div style={{ width: 50, height: 50, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }}></div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>{courseGenerating ? 'Generation du cours...' : 'Chargement...'}</h3>
                                {courseGenerating && (
                                    <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                                        L'IA genere le cours complet a partir du syllabus. Cela peut prendre quelques secondes...
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : rightPanel === 'audio' ? (
                        /* Audio panel */
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                            <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 0 0 ${ttsPlaying ? '12px' : '0'} ${TEAL}20`, transition: 'box-shadow .4s' }}>
                                    <i className="fas fa-headphones" style={{ fontSize: 34, color: TEAL }}></i>
                                </div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: NAVY, margin: '0 0 6px' }}>Version Audio</h3>
                                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: '0 0 28px' }}>
                                    {ttsSupported
                                        ? 'Ecoutez la lecture du cours en francais via la synthese vocale de votre navigateur.'
                                        : 'La synthese vocale n\'est pas disponible sur votre navigateur.'}
                                </p>
                                {ttsSupported && (
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                        {!ttsPlaying ? (
                                            <button onClick={startTTS}
                                                style={{ padding: '12px 28px', borderRadius: 12, background: TEAL, color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 14px ${TEAL}40` }}
                                            >
                                                <i className="fas fa-play"></i> Ecouter le cours
                                            </button>
                                        ) : (
                                            <button onClick={stopTTS}
                                                style={{ padding: '12px 28px', borderRadius: 12, background: '#E74C3C', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
                                            >
                                                <i className="fas fa-stop"></i> Arreter
                                            </button>
                                        )}
                                    </div>
                                )}
                                {ttsPlaying && (
                                    <div style={{ marginTop: 18, display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end', height: 28 }}>
                                        {[1,2,3,4,5].map(n => (
                                            <div key={n} style={{ width: 4, borderRadius: 4, background: TEAL, animation: `eq${n} .7s ${n*0.12}s infinite alternate`, height: `${10 + n*4}px`, opacity: 0.8 }}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <style>{`
                                @keyframes eq1{from{transform:scaleY(.4)}to{transform:scaleY(1)}}
                                @keyframes eq2{from{transform:scaleY(.6)}to{transform:scaleY(1)}}
                                @keyframes eq3{from{transform:scaleY(.3)}to{transform:scaleY(1)}}
                                @keyframes eq4{from{transform:scaleY(.7)}to{transform:scaleY(1)}}
                                @keyframes eq5{from{transform:scaleY(.5)}to{transform:scaleY(1)}}
                            `}</style>
                        </div>
                    ) : rightPanel === 'video' ? (
                        /* Video panel */
                        <div style={{ flex: 1, overflowY: 'auto', background: 'white', padding: '24px' }}>
                            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <i className="fas fa-play-circle" style={{ color: '#E74C3C', fontSize: 20 }}></i>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 }}>Videos de la specialite</h3>
                                </div>
                                {videosLoading ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }}></div>
                                    </div>
                                ) : categoryVideos.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                        <i className="fas fa-film" style={{ fontSize: 40, color: '#e5e7eb', marginBottom: 12, display: 'block' }}></i>
                                        <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 16px' }}>Aucune video disponible pour cette specialite.</p>
                                        {categoryId && (
                                            <Link to={`/formations/${categoryId}`}
                                                style={{ padding: '10px 24px', borderRadius: 10, background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <i className="fas fa-arrow-left"></i> Retour a la specialite
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {categoryVideos.map(v => (
                                            <Link key={v.id} to={`/video/${v.id}`}
                                                style={{ display: 'flex', gap: 14, padding: '14px', borderRadius: 12, border: '1px solid #f0f0f0', background: 'white', textDecoration: 'none', alignItems: 'center', transition: 'all .15s' }}
                                                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${TEAL}20`}
                                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                                            >
                                                <div style={{ width: 52, height: 52, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E74C3C', fontSize: 20, flexShrink: 0 }}>
                                                    <i className="fas fa-play"></i>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>
                                                    {v.description && <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.description}</p>}
                                                </div>
                                                <i className="fas fa-chevron-right" style={{ fontSize: 11, color: '#d1d5db', flexShrink: 0 }}></i>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : generatedCourse ? (
                        /* AI-generated full course */
                        <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
                            <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${TEAL}30` }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 20, flexShrink: 0 }}>
                                        <i className="fas fa-book-open"></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>{document?.title || title}</h2>
                                        {ueName && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{ueName}</p>}
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#e8f8f5', color: TEAL }}>
                                        <i className="fas fa-robot" style={{ marginRight: 4 }}></i>Genere par IA
                                    </span>
                                </div>
                                <div className="course-content"
                                    dangerouslySetInnerHTML={{ __html: renderMd(generatedCourse) }}
                                />
                                <LuEtComprisButton done={luEtCompris} onMark={markLuEtCompris} onQuiz={generateQuiz} />
                            </div>
                        </div>
                    ) : courseContent ? (
                        /* Raw syllabus fallback */
                        <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
                            <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${TEAL}30` }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 20, flexShrink: 0 }}>
                                        <i className="fas fa-book-open"></i>
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>{document?.title || title}</h2>
                                        {ueName && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{ueName}</p>}
                                    </div>
                                </div>
                                <div className="course-content"
                                    dangerouslySetInnerHTML={{ __html: renderMd(courseContent) }}
                                />
                                <LuEtComprisButton done={luEtCompris} onMark={markLuEtCompris} onQuiz={generateQuiz} />
                            </div>
                        </div>
                    ) : (
                        /* No content at all */
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                            <div style={{ textAlign: 'center', maxWidth: 400 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 20, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <i className="fas fa-book-open" style={{ fontSize: 32, color: TEAL }}></i>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>{document?.title || title}</h3>
                                <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: '0 0 20px' }}>
                                    Aucun contenu disponible. Utilisez l'assistant IA a gauche pour poser des questions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LuEtComprisButton({ done, onMark, onQuiz }) {
    return (
        <div style={{
            marginTop: 48, padding: '28px 32px', borderRadius: 16,
            background: done ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : 'linear-gradient(135deg,#e8f8f5,#f0fffe)',
            border: `2px solid ${done ? '#6ee7b7' : '#5BBCB4'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            textAlign: 'center',
        }}>
            {done ? (
                <>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                        <i className="fas fa-check"></i>
                    </div>
                    <div>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#065f46', margin: '0 0 4px' }}>Chapitre marque comme lu !</p>
                        <p style={{ fontSize: 12, color: '#047857', margin: 0 }}>Testez vos connaissances avec le quiz</p>
                    </div>
                    <button onClick={onQuiz}
                        style={{ padding: '10px 28px', borderRadius: 10, background: '#1B2A4A', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(27,42,74,0.2)' }}
                    >
                        <i className="fas fa-question-circle"></i> Faire le Quiz du chapitre
                    </button>
                </>
            ) : (
                <>
                    <i className="fas fa-book-reader" style={{ fontSize: 28, color: '#5BBCB4' }}></i>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#1B2A4A', margin: '0 0 4px' }}>Vous avez termine la lecture ?</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Marquez ce chapitre comme lu pour suivre votre progression</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={onMark}
                            style={{ padding: '11px 28px', borderRadius: 10, background: '#5BBCB4', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(91,188,180,0.35)' }}
                        >
                            <i className="fas fa-check-circle"></i> Lu et compris
                        </button>
                        <button onClick={onQuiz}
                            style={{ padding: '11px 24px', borderRadius: 10, background: 'white', color: '#1B2A4A', fontWeight: 600, fontSize: 13, border: '1.5px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <i className="fas fa-question-circle" style={{ color: '#5BBCB4' }}></i> Quiz
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
