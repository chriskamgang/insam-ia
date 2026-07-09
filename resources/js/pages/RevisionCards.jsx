import { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import api from '../api';

const TEAL  = '#5BBCB4';
const TEAL2 = '#49BBBD';
const NAVY  = '#1B2A4A';
const W     = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

// ── Simple markdown → HTML converter ─────────────────────────────────────────
function markdownToHtml(md) {
    if (!md) return '';
    let html = md
        // Escape existing HTML to avoid XSS
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Headings (order matters: ## before #)
        .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;color:#1B2A4A;margin:18px 0 8px;">$1</h3>')
        .replace(/^## (.+)$/gm,  '<h2 style="font-size:17px;font-weight:800;color:#1B2A4A;margin:22px 0 10px;padding-bottom:6px;border-bottom:2px solid #e5e7eb;">$1</h2>')
        .replace(/^# (.+)$/gm,   '<h1 style="font-size:20px;font-weight:800;color:#1B2A4A;margin:24px 0 12px;">$1</h1>')
        // Bold & italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g,     '<strong style="color:#1B2A4A;">$1</strong>')
        .replace(/\*(.+?)\*/g,         '<em style="color:#374151;">$1</em>')
        // Unordered lists – lines starting with "- " or "* "
        .replace(/^[\-\*] (.+)$/gm, '<li style="margin:5px 0;padding-left:4px;">$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li style="margin:5px 0;padding-left:4px;list-style-type:decimal;">$1</li>')
        // Wrap consecutive <li> groups in <ul>/<ol> — simple approach: wrap all li runs
        .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (match) => {
            const isOrdered = match.includes('list-style-type:decimal');
            const tag = isOrdered ? 'ol' : 'ul';
            return `<${tag} style="margin:10px 0 10px 20px;padding:0;">${match}</${tag}>`;
        })
        // Horizontal rule
        .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">')
        // Newlines → <br> (skip inside block elements)
        .replace(/\n{2,}/g, '</p><p style="margin:0 0 10px;line-height:1.7;color:#374151;">')
        .replace(/\n/g, '<br>');

    // Wrap in paragraph
    html = `<p style="margin:0 0 10px;line-height:1.7;color:#374151;">${html}</p>`;
    return html;
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        completed: { label: 'Complet\u00e9e', bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
        pending:   { label: 'En cours',      bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
        failed:    { label: '\u00c9chou\u00e9e',  bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            whiteSpace: 'nowrap',
        }}>
            {s.label}
        </span>
    );
}

// ── Format date ───────────────────────────────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return iso;
    }
}

// ── Card item in grid ─────────────────────────────────────────────────────────
function RevisionCardItem({ card, onView, onDelete, deleting }) {
    return (
        <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #f0f0f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', transition: 'all .2s',
        }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(91,188,180,0.13)';
                e.currentTarget.style.borderColor = `${TEAL}60`;
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Top accent */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${TEAL}, ${TEAL2})` }} />

            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Top row: category tag + status badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    {card.category_name && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                            background: '#e8f8f5', color: TEAL, border: `1px solid ${TEAL}30`,
                        }}>
                            <i className="fas fa-tag" style={{ marginRight: 4 }}></i>
                            {card.category_name}
                        </span>
                    )}
                    <StatusBadge status={card.status} />
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, lineHeight: 1.4, margin: 0 }}>
                    {card.title || 'Fiche de r\u00e9vision'}
                </h3>

                {/* Summary (truncated) */}
                {card.summary && (
                    <p style={{
                        fontSize: 13, color: '#6b7280', lineHeight: 1.55, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {card.summary}
                    </p>
                )}

                {/* Source */}
                {card.source && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af' }}>
                        <i className="fas fa-book-open"></i>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {card.source}
                        </span>
                    </div>
                )}

                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af' }}>
                    <i className="fas fa-calendar-alt"></i>
                    <span>{fmtDate(card.created_at)}</span>
                </div>
            </div>

            {/* Footer actions */}
            <div style={{
                padding: '11px 18px', borderTop: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
                <button
                    onClick={() => onView(card)}
                    style={{
                        flex: 1, padding: '8px 14px', borderRadius: 8,
                        border: `1.5px solid ${TEAL}`, background: 'white',
                        color: TEAL, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = TEAL; }}
                >
                    <i className="fas fa-eye"></i>
                    Voir
                </button>
                <button
                    onClick={() => onDelete(card.id)}
                    disabled={deleting}
                    style={{
                        padding: '8px 14px', borderRadius: 8,
                        border: '1.5px solid #fee2e2', background: 'white',
                        color: '#ef4444', fontSize: 13, fontWeight: 600,
                        cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 6,
                        opacity: deleting ? 0.6 : 1, transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (!deleting) { e.currentTarget.style.background = '#fee2e2'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                >
                    <i className={deleting ? 'fas fa-circle-notch fa-spin' : 'fas fa-trash-alt'}></i>
                </button>
            </div>
        </div>
    );
}

// ── Detail view ───────────────────────────────────────────────────────────────
function DetailView({ card, onBack, onDelete, deleting }) {
    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>
            <div style={{ ...W, paddingTop: 28 }}>

                {/* Back button */}
                <button
                    onClick={onBack}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10,
                        color: '#374151', fontSize: 13, fontWeight: 600,
                        padding: '9px 18px', cursor: 'pointer', fontFamily: 'inherit',
                        marginBottom: 24, transition: 'all .15s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = TEAL; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
                >
                    <i className="fas fa-arrow-left"></i>
                    Retour aux fiches
                </button>

                {/* Card header */}
                <div style={{
                    background: `linear-gradient(135deg, ${NAVY} 0%, #243758 60%, #2d4470 100%)`,
                    borderRadius: 20, padding: '32px 36px', marginBottom: 24,
                    boxShadow: '0 4px 20px rgba(27,42,74,0.18)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Category tag */}
                            {card.category_name && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                                    background: `${TEAL}25`, color: TEAL,
                                    border: `1px solid ${TEAL}50`, marginBottom: 14,
                                }}>
                                    <i className="fas fa-tag"></i>
                                    {card.category_name}
                                </span>
                            )}

                            {/* Title */}
                            <h1 style={{
                                fontSize: 26, fontWeight: 800, color: 'white',
                                margin: '0 0 16px', lineHeight: 1.3,
                            }}>
                                {card.title || 'Fiche de r\u00e9vision'}
                            </h1>

                            {/* Meta */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>{fmtDate(card.created_at)}</span>
                                </div>
                                {card.source && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                                        <i className="fas fa-book-open"></i>
                                        <span>{card.source}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                                    <StatusBadge status={card.status} />
                                </div>
                            </div>
                        </div>

                        {/* Brain icon */}
                        <div style={{
                            width: 64, height: 64, borderRadius: 18,
                            background: `${TEAL}20`, border: `1.5px solid ${TEAL}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, color: TEAL, flexShrink: 0,
                        }}>
                            <i className="fas fa-brain"></i>
                        </div>
                    </div>
                </div>

                {/* Summary highlighted box */}
                {card.summary && (
                    <div style={{
                        background: `linear-gradient(135deg, #e8f8f5, #f0fdf9)`,
                        border: `1.5px solid ${TEAL}40`,
                        borderRadius: 14, padding: '18px 22px', marginBottom: 20,
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: TEAL, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', fontSize: 16,
                        }}>
                            <i className="fas fa-lightbulb"></i>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                                R\u00e9sum\u00e9
                            </div>
                            <p style={{ fontSize: 14, color: '#1e4040', lineHeight: 1.65, margin: 0 }}>
                                {card.summary}
                            </p>
                        </div>
                    </div>
                )}

                {/* Key points */}
                {Array.isArray(card.key_points) && card.key_points.length > 0 && (
                    <div style={{
                        background: 'white', borderRadius: 14,
                        border: '1px solid #f0f0f0', padding: '20px 24px',
                        marginBottom: 20,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: NAVY, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-list-check" style={{ color: TEAL }}></i>
                            Points cl\u00e9s
                        </h2>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {card.key_points.map((point, i) => (
                                <li key={i} style={{
                                    display: 'flex', gap: 12, alignItems: 'flex-start',
                                    padding: '10px 14px', borderRadius: 10,
                                    background: i % 2 === 0 ? '#f8fafb' : 'white',
                                    border: '1px solid #f3f4f6',
                                }}>
                                    <span style={{
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: `${TEAL}18`, color: TEAL,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
                                    }}>
                                        {i + 1}
                                    </span>
                                    <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.55 }}>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Main content */}
                {card.content && (
                    <div style={{
                        background: 'white', borderRadius: 16,
                        border: '1px solid #f0f0f0', padding: '28px 32px',
                        marginBottom: 24,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: NAVY, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-file-lines" style={{ color: TEAL }}></i>
                            Contenu de la fiche
                        </h2>
                        <div
                            style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap' }}
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(card.content) }}
                        />
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '12px 24px', borderRadius: 10,
                            border: '1.5px solid #e5e7eb', background: 'white',
                            color: '#374151', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'all .15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = TEAL; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
                    >
                        <i className="fas fa-arrow-left"></i>
                        Retour
                    </button>
                    <button
                        onClick={() => onDelete(card.id)}
                        disabled={deleting}
                        style={{
                            padding: '12px 24px', borderRadius: 10,
                            border: '1.5px solid #fca5a5',
                            background: deleting ? '#fef2f2' : 'white',
                            color: '#ef4444', fontSize: 14, fontWeight: 600,
                            cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 8,
                            opacity: deleting ? 0.7 : 1, transition: 'all .15s',
                        }}
                        onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#fee2e2'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = deleting ? '#fef2f2' : 'white'; }}
                    >
                        <i className={deleting ? 'fas fa-circle-notch fa-spin' : 'fas fa-trash-alt'}></i>
                        {deleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RevisionCards() {
    const { t } = useLang();

    // Views
    const [selectedCard, setSelectedCard] = useState(null);

    // Data
    const [cards, setCards]           = useState([]);
    const [categories, setCategories] = useState([]);

    // UI states
    const [loading, setLoading]         = useState(true);
    const [generating, setGenerating]   = useState(false);
    const [deletingId, setDeletingId]   = useState(null);
    const [error, setError]             = useState('');
    const [genError, setGenError]       = useState('');
    const [genSuccess, setGenSuccess]   = useState('');

    // Generate form
    const [selectedCategory, setSelectedCategory] = useState('');

    // ── Fetch cards ──────────────────────────────────────────────────────────
    const fetchCards = () => {
        setLoading(true);
        setError('');
        api.get('/api/revision-cards')
            .then(r => setCards(r.data?.data || r.data || []))
            .catch(() => setError('Impossible de charger les fiches. Veuillez r\u00e9essayer.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCards();
        api.get('/api/public/categories')
            .then(r => setCategories(r.data?.data || []))
            .catch(() => {});
    }, []);

    // ── Generate ─────────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!selectedCategory) {
            setGenError('Veuillez s\u00e9lectionner une cat\u00e9gorie.');
            return;
        }
        setGenError('');
        setGenSuccess('');
        setGenerating(true);
        try {
            const res = await api.post('/api/revision-cards/generate', { category_id: selectedCategory });
            const newCard = res.data?.data || res.data;
            setCards(prev => [newCard, ...prev]);
            setGenSuccess('Fiche g\u00e9n\u00e9r\u00e9e avec succ\u00e8s !');
            setSelectedCategory('');
            setTimeout(() => setGenSuccess(''), 4000);
        } catch (err) {
            const msg = err.response?.data?.message || "Une erreur s'est produite lors de la g\u00e9n\u00e9ration.";
            setGenError(msg);
        } finally {
            setGenerating(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette fiche de r\u00e9vision ?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/api/revision-cards/${id}`);
            setCards(prev => prev.filter(c => c.id !== id));
            if (selectedCard?.id === id) setSelectedCard(null);
        } catch {
            alert('Impossible de supprimer cette fiche. Veuillez r\u00e9essayer.');
        } finally {
            setDeletingId(null);
        }
    };

    // ── Detail view ───────────────────────────────────────────────────────────
    if (selectedCard) {
        return (
            <DetailView
                card={selectedCard}
                onBack={() => setSelectedCard(null)}
                onDelete={async (id) => { await handleDelete(id); }}
                deleting={deletingId === selectedCard.id}
            />
        );
    }

    // ── List view ─────────────────────────────────────────────────────────────
    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60 }}>

            {/* ── Hero Header ── */}
            <section style={{
                background: `linear-gradient(135deg, ${NAVY} 0%, #243758 55%, ${TEAL2}55 100%)`,
                padding: '44px 0 48px',
            }}>
                <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: `${TEAL}25`, border: `1.5px solid ${TEAL}50`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, color: TEAL,
                            }}>
                                <i className="fas fa-brain"></i>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: 1, textTransform: 'uppercase' }}>
                                INSAM-IA
                            </span>
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>
                            Fiches de R\u00e9vision{' '}
                            <span style={{ color: TEAL }}>IA</span>
                            {' '}<i className="fas fa-sparkles" style={{ fontSize: 22, color: TEAL, verticalAlign: 'middle' }}></i>
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, maxWidth: 520, margin: 0, lineHeight: 1.6 }}>
                            G\u00e9n\u00e9rez des fiches de r\u00e9vision intelligentes \u00e0 partir de vos formations
                        </p>
                    </div>

                    {/* Count badge */}
                    {!loading && cards.length > 0 && (
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                            border: '1.5px solid rgba(255,255,255,0.15)',
                            borderRadius: 16, padding: '16px 28px', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1 }}>{cards.length}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)', marginTop: 4 }}>fiche{cards.length !== 1 ? 's' : ''} cr\u00e9\u00e9e{cards.length !== 1 ? 's' : ''}</div>
                        </div>
                    )}
                </div>
            </section>

            <div style={{ ...W, paddingTop: 28 }}>

                {/* ── Generate card ── */}
                <div style={{
                    background: 'white', borderRadius: 18,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 12px rgba(91,188,180,0.08)',
                    padding: '26px 28px', marginBottom: 32,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: '#e8f8f5', color: TEAL,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        }}>
                            <i className="fas fa-wand-magic-sparkles"></i>
                        </div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: 0 }}>
                            G\u00e9n\u00e9rer une nouvelle fiche
                        </h2>
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        {/* Category select */}
                        <div style={{ flex: '1 1 240px' }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                                S\u00e9lectionner une formation
                            </label>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-graduation-cap" style={{
                                    position: 'absolute', left: 12, top: '50%',
                                    transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13, pointerEvents: 'none',
                                }}></i>
                                <select
                                    value={selectedCategory}
                                    onChange={e => { setSelectedCategory(e.target.value); setGenError(''); }}
                                    disabled={generating}
                                    style={{
                                        width: '100%', paddingLeft: 36, paddingRight: 32, paddingTop: 10, paddingBottom: 10,
                                        border: `1.5px solid ${genError && !selectedCategory ? '#ef4444' : selectedCategory ? TEAL : '#e5e7eb'}`,
                                        borderRadius: 10, fontSize: 14, color: selectedCategory ? NAVY : '#9ca3af',
                                        background: selectedCategory ? '#f0fdf9' : 'white',
                                        outline: 'none', appearance: 'none', fontFamily: 'inherit',
                                        fontWeight: selectedCategory ? 600 : 400, cursor: generating ? 'not-allowed' : 'pointer',
                                        transition: 'border-color .15s', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = `0 0 0 3px ${TEAL}20`; }}
                                    onBlur={e => { e.target.style.borderColor = selectedCategory ? TEAL : '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                >
                                    <option value="">-- Choisir une cat\u00e9gorie --</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <i className="fas fa-chevron-down" style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    fontSize: 10, color: '#9ca3af', pointerEvents: 'none',
                                }}></i>
                            </div>
                        </div>

                        {/* Generate button */}
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            style={{
                                padding: '10px 24px', borderRadius: 10, border: 'none',
                                background: generating
                                    ? '#d1d5db'
                                    : `linear-gradient(135deg, ${TEAL}, ${TEAL2})`,
                                color: 'white', fontSize: 14, fontWeight: 700,
                                cursor: generating ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: generating ? 'none' : '0 4px 14px rgba(91,188,180,0.35)',
                                transition: 'all .2s', whiteSpace: 'nowrap',
                                height: 42,
                            }}
                            onMouseEnter={e => { if (!generating) e.currentTarget.style.boxShadow = '0 6px 20px rgba(91,188,180,0.50)'; }}
                            onMouseLeave={e => { if (!generating) e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,188,180,0.35)'; }}
                        >
                            {generating
                                ? <><i className="fas fa-circle-notch fa-spin"></i>G\u00e9n\u00e9ration en cours...</>
                                : <><i className="fas fa-sparkles"></i>G\u00e9n\u00e9rer une fiche</>
                            }
                        </button>
                    </div>

                    {/* Generating progress hint */}
                    {generating && (
                        <div style={{
                            marginTop: 16, padding: '12px 16px', borderRadius: 10,
                            background: '#fffbeb', border: '1px solid #fcd34d',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13, color: '#92400e',
                        }}>
                            <i className="fas fa-hourglass-half fa-spin"></i>
                            L'IA analyse le contenu de votre formation et g\u00e9n\u00e8re votre fiche... Cela peut prendre 10 \u00e0 20 secondes.
                        </div>
                    )}

                    {/* Success message */}
                    {genSuccess && (
                        <div style={{
                            marginTop: 14, padding: '11px 16px', borderRadius: 10,
                            background: '#d1fae5', border: '1px solid #6ee7b7',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13, color: '#065f46',
                        }}>
                            <i className="fas fa-check-circle"></i>
                            {genSuccess}
                        </div>
                    )}

                    {/* Error message */}
                    {genError && (
                        <div style={{
                            marginTop: 14, padding: '11px 16px', borderRadius: 10,
                            background: '#fee2e2', border: '1px solid #fca5a5',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13, color: '#991b1b',
                        }}>
                            <i className="fas fa-exclamation-circle"></i>
                            {genError}
                        </div>
                    )}
                </div>

                {/* ── Error loading cards ── */}
                {error && (
                    <div style={{
                        padding: '14px 18px', borderRadius: 12, marginBottom: 24,
                        background: '#fee2e2', border: '1px solid #fca5a5',
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontSize: 14, color: '#991b1b',
                    }}>
                        <i className="fas fa-exclamation-triangle"></i>
                        {error}
                        <button
                            onClick={fetchCards}
                            style={{
                                marginLeft: 'auto', padding: '6px 14px', borderRadius: 8,
                                border: '1.5px solid #fca5a5', background: 'white',
                                color: '#ef4444', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            R\u00e9essayer
                        </button>
                    </div>
                )}

                {/* ── Section title ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>
                        <i className="fas fa-layer-group" style={{ color: TEAL, marginRight: 10, fontSize: 16 }}></i>
                        Mes fiches de r\u00e9vision
                        {!loading && cards.length > 0 && (
                            <span style={{
                                marginLeft: 10, fontSize: 13, fontWeight: 700,
                                background: '#e8f8f5', color: TEAL,
                                padding: '2px 10px', borderRadius: 20,
                            }}>
                                {cards.length}
                            </span>
                        )}
                    </h2>
                    {!loading && cards.length > 0 && (
                        <button
                            onClick={fetchCards}
                            style={{
                                background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 8,
                                color: '#6b7280', fontSize: 12, fontWeight: 600,
                                padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all .15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = TEAL; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
                        >
                            <i className="fas fa-refresh"></i>
                            Actualiser
                        </button>
                    )}
                </div>

                {/* ── Loading skeleton ── */}
                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} style={{ background: 'white', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden', height: 220 }}>
                                <div style={{ height: 4, background: '#f3f4f6' }} />
                                <div style={{ padding: '16px 18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div style={{ width: 80, height: 20, borderRadius: 10, background: '#f3f4f6' }} />
                                        <div style={{ width: 60, height: 20, borderRadius: 10, background: '#f3f4f6' }} />
                                    </div>
                                    <div style={{ width: '75%', height: 16, borderRadius: 4, background: '#f3f4f6', marginBottom: 10 }} />
                                    <div style={{ width: '100%', height: 12, borderRadius: 4, background: '#f3f4f6', marginBottom: 6 }} />
                                    <div style={{ width: '85%', height: 12, borderRadius: 4, background: '#f3f4f6', marginBottom: 6 }} />
                                    <div style={{ width: '60%', height: 12, borderRadius: 4, background: '#f3f4f6' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && !error && cards.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '72px 20px' }}>
                        <div style={{
                            width: 88, height: 88, borderRadius: 22,
                            background: '#f3f4f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 22px', fontSize: 36, color: '#d1d5db',
                        }}>
                            <i className="fas fa-brain"></i>
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                            Aucune fiche de r\u00e9vision
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                            Vous n'avez pas encore g\u00e9n\u00e9r\u00e9 de fiche de r\u00e9vision.<br />
                            S\u00e9lectionnez une formation et laissez l'IA cr\u00e9er votre premi\u00e8re fiche !
                        </p>
                        <button
                            onClick={() => document.querySelector('select')?.focus()}
                            style={{
                                background: `linear-gradient(135deg, ${TEAL}, ${TEAL2})`,
                                color: 'white', border: 'none', borderRadius: 12,
                                padding: '13px 28px', fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            <i className="fas fa-wand-magic-sparkles"></i>
                            G\u00e9n\u00e9rez votre premi\u00e8re fiche
                        </button>
                    </div>
                )}

                {/* ── Cards grid ── */}
                {!loading && cards.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {cards.map(card => (
                            <RevisionCardItem
                                key={card.id}
                                card={card}
                                onView={setSelectedCard}
                                onDelete={handleDelete}
                                deleting={deletingId === card.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
