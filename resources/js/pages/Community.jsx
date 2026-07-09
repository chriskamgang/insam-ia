import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';

export default function Community() {
    const { user } = useAuth();
    const [channels, setChannels] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const bottomRef = useRef(null);
    const pollRef = useRef(null);

    // Load channels
    useEffect(() => {
        api.get('/api/community/channels')
            .then(r => {
                const chs = r.data.channels || [];
                setChannels(chs);
                if (chs.length > 0) {
                    setActiveChannel(r.data.my_channel || chs[0].slug);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Load messages for active channel
    const loadMessages = useCallback(() => {
        if (!activeChannel) return;
        api.get(`/api/community/${activeChannel}/messages`)
            .then(r => {
                const data = r.data.data || r.data.messages || [];
                setMessages(data.reverse ? data.reverse() : data);
            })
            .catch(() => {});
    }, [activeChannel]);

    useEffect(() => {
        loadMessages();
        // Poll every 5 seconds
        pollRef.current = setInterval(loadMessages, 5000);
        return () => clearInterval(pollRef.current);
    }, [loadMessages]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            await api.post(`/api/community/${activeChannel}/send`, {
                content: text.trim(),
                parent_id: replyTo?.id || null,
            });
            setText('');
            setReplyTo(null);
            loadMessages();
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/community/messages/${id}`);
            loadMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const activeChannelInfo = channels.find(c => c.slug === activeChannel);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#9ca3af' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginRight: 12 }}></i>
                Chargement...
            </div>
        );
    }

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ background: NAVY, padding: '24px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    <span style={{ color: TEAL, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>COMMUNAUTE</span>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: '6px 0 0' }}>
                        <i className="fas fa-comments" style={{ marginRight: 10, color: TEAL }}></i>
                        Chat Communautaire
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                        Discutez avec les etudiants de votre filiere et niveau
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', display: 'flex', gap: 20, height: 'calc(100vh - 200px)' }}>
                {/* Sidebar - Channels */}
                <div style={{
                    width: 260, flexShrink: 0, background: 'white',
                    borderRadius: 16, border: '1px solid #f0f0f0',
                    padding: 16, overflow: 'auto',
                }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 14 }}>
                        <i className="fas fa-hashtag" style={{ color: TEAL, marginRight: 6 }}></i>
                        Canaux
                    </h3>
                    {channels.map(ch => (
                        <button
                            key={ch.slug}
                            onClick={() => setActiveChannel(ch.slug)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', padding: '10px 12px',
                                borderRadius: 10, border: 'none',
                                background: activeChannel === ch.slug ? '#e8f8f5' : 'transparent',
                                color: activeChannel === ch.slug ? TEAL : NAVY,
                                fontWeight: activeChannel === ch.slug ? 700 : 500,
                                fontSize: 13, cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all .15s',
                                marginBottom: 4,
                            }}
                        >
                            <i className={
                                ch.type === 'filiere_niveau' ? 'fas fa-users' :
                                ch.type === 'filiere' ? 'fas fa-graduation-cap' :
                                'fas fa-globe'
                            } style={{ fontSize: 14, width: 18, textAlign: 'center' }}></i>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {ch.name}
                                </div>
                                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>
                                    {ch.count} message{ch.count !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* User info */}
                    <div style={{ marginTop: 20, padding: '14px 12px', background: '#f8fafb', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{user?.prenom || user?.name}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                            {user?.filiere || 'Filiere non definie'} {user?.niveau ? `- ${user.niveau}` : ''}
                        </div>
                    </div>
                </div>

                {/* Main chat area */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    background: 'white', borderRadius: 16, border: '1px solid #f0f0f0',
                    overflow: 'hidden',
                }}>
                    {/* Channel header */}
                    <div style={{
                        padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <i className="fas fa-hashtag" style={{ color: TEAL, fontSize: 16 }}></i>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
                                {activeChannelInfo?.name || activeChannel}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                {activeChannelInfo?.type === 'filiere_niveau' ? 'Canal de votre filiere et niveau' :
                                 activeChannelInfo?.type === 'filiere' ? 'Canal general de la filiere' :
                                 'Canal ouvert a tous'}
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                                <i className="fas fa-comments" style={{ fontSize: 40, marginBottom: 12, color: '#e5e7eb' }}></i>
                                <p style={{ fontSize: 14 }}>Aucun message pour le moment.</p>
                                <p style={{ fontSize: 12 }}>Soyez le premier a ecrire !</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    isOwn={msg.user_id === user?.id}
                                    onReply={() => setReplyTo(msg)}
                                    onDelete={() => handleDelete(msg.id)}
                                />
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Reply indicator */}
                    {replyTo && (
                        <div style={{
                            padding: '8px 20px', background: '#f0f9f8',
                            borderTop: `2px solid ${TEAL}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ fontSize: 12, color: NAVY }}>
                                <i className="fas fa-reply" style={{ color: TEAL, marginRight: 6 }}></i>
                                Reponse a <strong>{replyTo.user?.prenom || replyTo.user?.name}</strong>:
                                <span style={{ color: '#9ca3af', marginLeft: 6 }}>
                                    {replyTo.content?.substring(0, 50)}{replyTo.content?.length > 50 ? '...' : ''}
                                </span>
                            </div>
                            <button onClick={() => setReplyTo(null)} style={{
                                background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14,
                            }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSend} style={{
                        padding: '12px 20px', borderTop: '1px solid #f0f0f0',
                        display: 'flex', gap: 10, alignItems: 'center',
                    }}>
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Ecrivez votre message..."
                            style={{
                                flex: 1, padding: '12px 18px', borderRadius: 50,
                                border: '1.5px solid #e5e7eb', fontSize: 14,
                                outline: 'none', color: NAVY,
                            }}
                            onFocus={e => e.target.style.borderColor = TEAL}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            type="submit"
                            disabled={sending || !text.trim()}
                            style={{
                                width: 44, height: 44, borderRadius: '50%',
                                background: text.trim() ? TEAL : '#e5e7eb',
                                color: 'white', border: 'none',
                                cursor: text.trim() ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, transition: 'all .2s',
                            }}
                        >
                            <i className={sending ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'}></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ msg, isOwn, onReply, onDelete }) {
    const initial = (msg.user?.prenom || msg.user?.name || 'U')[0].toUpperCase();
    const timeAgo = formatTime(msg.created_at);

    return (
        <div style={{
            display: 'flex', gap: 10, marginBottom: 16,
            flexDirection: isOwn ? 'row-reverse' : 'row',
        }}>
            {/* Avatar */}
            <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: isOwn ? `linear-gradient(135deg, ${TEAL}, ${NAVY})` : '#e8f8f5',
                color: isOwn ? 'white' : TEAL,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
            }}>
                {initial}
            </div>

            <div style={{ maxWidth: '70%' }}>
                {/* Name + time */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                    flexDirection: isOwn ? 'row-reverse' : 'row',
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
                        {msg.user?.prenom || msg.user?.name || 'Anonyme'}
                    </span>
                    {msg.user?.niveau && (
                        <span style={{ fontSize: 9, background: '#f0f4ff', color: NAVY, padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                            {msg.user.niveau}
                        </span>
                    )}
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{timeAgo}</span>
                </div>

                {/* Parent message preview */}
                {msg.parent && (
                    <div style={{
                        padding: '6px 10px', marginBottom: 4,
                        borderLeft: `3px solid ${TEAL}`, background: '#f8fafb',
                        borderRadius: '0 6px 6px 0', fontSize: 11, color: '#6b7280',
                    }}>
                        <strong>{msg.parent.user?.prenom || 'Anonyme'}:</strong> {msg.parent.content?.substring(0, 60)}
                    </div>
                )}

                {/* Message content */}
                <div style={{
                    padding: '10px 14px',
                    background: isOwn ? TEAL : '#f3f4f6',
                    color: isOwn ? 'white' : NAVY,
                    borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    fontSize: 13, lineHeight: 1.5,
                    wordBreak: 'break-word',
                }}>
                    {msg.content}
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex', gap: 12, marginTop: 4,
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                }}>
                    <button onClick={onReply} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <i className="fas fa-reply" style={{ fontSize: 10 }}></i> Repondre
                    </button>
                    {isOwn && (
                        <button onClick={onDelete} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <i className="fas fa-trash" style={{ fontSize: 10 }}></i> Supprimer
                        </button>
                    )}
                </div>

                {/* Inline replies */}
                {msg.replies && msg.replies.length > 0 && (
                    <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: `2px solid #e5e7eb` }}>
                        {msg.replies.slice(0, 3).map(reply => (
                            <div key={reply.id} style={{ marginBottom: 6, fontSize: 12 }}>
                                <span style={{ fontWeight: 700, color: NAVY }}>{reply.user?.prenom || 'Anonyme'}</span>
                                <span style={{ color: '#6b7280', marginLeft: 6 }}>{reply.content}</span>
                            </div>
                        ))}
                        {msg.replies.length > 3 && (
                            <div style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>
                                +{msg.replies.length - 3} autres reponses
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "a l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `il y a ${diffD}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
