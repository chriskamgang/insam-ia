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
    const [showPdf, setShowPdf] = useState(true);

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
            // Build conversation context
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

    const pdfUrl = filePath ? `/storage/${filePath}#toolbar=0&navpanes=0` : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafb' }}>

            {/* Header */}
            <div style={{
                background: NAVY, padding: '8px 20px',
                display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
                borderBottom: `3px solid ${TEAL}`,
            }}>
                <Link to={categoryId ? `/formations/${categoryId}` : '/formations'}
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <i className="fas fa-arrow-left"></i> Retour
                </Link>
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }}></div>
                <i className="fas fa-book-reader" style={{ color: TEAL, fontSize: 16 }}></i>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                    </h3>
                    {ueName && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ueName}</span>}
                </div>
                {pdfUrl && (
                    <button onClick={() => setShowPdf(!showPdf)}
                        style={{
                            background: showPdf ? TEAL : 'rgba(255,255,255,0.1)',
                            color: 'white', border: 'none', borderRadius: 8,
                            padding: '6px 12px', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        }}
                    >
                        <i className={`fas fa-${showPdf ? 'eye-slash' : 'file-pdf'}`}></i>
                        {showPdf ? 'Masquer PDF' : 'Voir PDF'}
                    </button>
                )}
            </div>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* Left: PDF viewer */}
                {showPdf && pdfUrl && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `2px solid ${TEAL}30` }}>
                        <iframe
                            src={pdfUrl}
                            style={{ flex: 1, border: 'none', background: 'white' }}
                            title={title}
                        />
                    </div>
                )}

                {/* Right: AI chat */}
                <div style={{
                    width: showPdf && pdfUrl ? 480 : '100%',
                    maxWidth: showPdf && pdfUrl ? 480 : 900,
                    margin: showPdf && pdfUrl ? undefined : '0 auto',
                    flexShrink: 0, display: 'flex', flexDirection: 'column',
                    background: 'white',
                }}>
                    {/* Chat header */}
                    <div style={{
                        padding: '12px 18px', borderBottom: '1px solid #e5e7eb',
                        display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa',
                    }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 16 }}>
                            <i className="fas fa-robot"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Assistant IA</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>Posez vos questions sur ce cours</div>
                        </div>
                        <button onClick={generateSummary} disabled={summaryLoading}
                            style={{
                                fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                                background: '#e8f8f5', color: TEAL, border: 'none', cursor: summaryLoading ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            <i className="fas fa-redo" style={{ fontSize: 9 }}></i> Regenerer
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                marginBottom: 14,
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}>
                                {msg.role !== 'user' && (
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2,
                                        background: msg.role === 'system' ? '#f3f4f6' : `${TEAL}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: msg.role === 'system' ? '#9ca3af' : TEAL, fontSize: 12,
                                    }}>
                                        <i className={msg.role === 'system' ? 'fas fa-circle-notch fa-spin' : 'fas fa-robot'}></i>
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: '85%',
                                    padding: msg.role === 'user' ? '10px 14px' : '12px 16px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.role === 'user' ? TEAL : '#f8fafb',
                                    color: msg.role === 'user' ? 'white' : '#374151',
                                    fontSize: 13, lineHeight: 1.75,
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 12 }}>
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                </div>
                                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#f8fafb', border: '1px solid #f0f0f0', fontSize: 13, color: '#9ca3af' }}>
                                    L'IA reflechit...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick actions */}
                    <div style={{ padding: '6px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                            'Explique-moi le chapitre 1',
                            'Donne un exercice pratique',
                            'Quels sont les points cles ?',
                            'Genere un QCM',
                        ].map((q, i) => (
                            <button key={i} onClick={() => { setInput(q); }}
                                style={{
                                    fontSize: 10, padding: '4px 10px', borderRadius: 20,
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
                        padding: '10px 16px 14px', borderTop: '1px solid #e5e7eb',
                        display: 'flex', gap: 8, alignItems: 'flex-end', background: 'white',
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Posez une question sur ce cours..."
                            rows={1}
                            style={{
                                flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 12,
                                padding: '10px 14px', fontSize: 13, fontFamily: 'inherit',
                                outline: 'none', resize: 'none', lineHeight: 1.5,
                                color: '#1e293b', maxHeight: 100, transition: 'border-color .15s',
                            }}
                            onFocus={e => e.target.style.borderColor = TEAL}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            style={{
                                width: 40, height: 40, borderRadius: 12, border: 'none', flexShrink: 0,
                                background: loading || !input.trim() ? '#e5e7eb' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                color: 'white', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                                boxShadow: loading || !input.trim() ? 'none' : '0 2px 8px rgba(91,188,180,0.3)',
                            }}
                        >
                            <i className={loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-paper-plane'}></i>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
