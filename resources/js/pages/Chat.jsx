import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';
import toast from 'react-hot-toast';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

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
            <div style={{ maxWidth: '68%' }}>
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
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

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
                response = await api.post('/api/chat', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                response = await api.post('/api/chat', { message: text });
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

            {/* ── Title Bar ── */}
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
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
                            <h1 style={{ fontSize: 17, fontWeight: 800, color: NAVY, margin: 0 }}>
                                Assistant IA INSAM
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                                <span style={{ fontSize: 11, color: '#6b7280' }}>En ligne · disponible 24h/7</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            fontSize: 11, background: '#e8f8f5', color: TEAL,
                            padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                        }}>
                            <i className="fas fa-bolt" style={{ marginRight: 4 }}></i>
                            Gemini 2.5 Flash
                        </span>
                    </div>
                </div>
            </div>

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
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
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
