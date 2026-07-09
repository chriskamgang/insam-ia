import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../api';
import toast from 'react-hot-toast';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };

// ── Constants ─────────────────────────────────────────────────────────────────

const ITEM_TYPES = [
    { value: 'course',     label: 'Cours',        color: TEAL,      bg: '#e8f8f7',  icon: 'fas fa-book-open'   },
    { value: 'notes',      label: 'Notes',         color: '#3B82F6', bg: '#eff6ff',  icon: 'fas fa-sticky-note' },
    { value: 'exercises',  label: 'Exercices',     color: '#F59E0B', bg: '#fff8ec',  icon: 'fas fa-pencil-alt'  },
    { value: 'exam_prep',  label: 'Prep Examen',   color: '#EF4444', bg: '#fef2f2',  icon: 'fas fa-graduation-cap' },
    { value: 'tutorial',   label: 'Tutoriel',      color: '#8B5CF6', bg: '#f3eeff',  icon: 'fas fa-play-circle' },
];

const SORT_OPTIONS = [
    { value: 'newest',  label: 'Plus recent'   },
    { value: 'popular', label: 'Plus populaire' },
    { value: 'rating',  label: 'Meilleur note'  },
];

const PRICE_OPTIONS = [
    { value: '',     label: 'Tous'    },
    { value: 'free', label: 'Gratuit' },
    { value: 'paid', label: 'Payant'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeInfo(type) {
    return ITEM_TYPES.find(t => t.value === type) || { label: type, color: '#6B7280', bg: '#f3f4f6', icon: 'fas fa-file' };
}

function fmtPrice(price) {
    const n = parseFloat(price);
    if (!n || n === 0) return 'Gratuit';
    return `${n.toLocaleString('fr-FR')} FCFA`;
}

function fmtDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Stars({ rating, size = 13 }) {
    const r = Math.round(parseFloat(rating) || 0);
    return (
        <span style={{ display: 'inline-flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <i key={i} className={i <= r ? 'fas fa-star' : 'far fa-star'}
                    style={{ fontSize: size, color: i <= r ? '#F59E0B' : '#d1d5db' }} />
            ))}
        </span>
    );
}

function StarSelector({ value, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <span style={{ display: 'inline-flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <i key={i}
                    className={(hover || value) >= i ? 'fas fa-star' : 'far fa-star'}
                    style={{ fontSize: 22, color: (hover || value) >= i ? '#F59E0B' : '#d1d5db', cursor: 'pointer', transition: 'color .1s' }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(i)}
                />
            ))}
        </span>
    );
}

// ── Reusable input styles ─────────────────────────────────────────────────────

const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };

function inputStyle(error) {
    return {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: `1.5px solid ${error ? '#ef4444' : '#e5e7eb'}`,
        fontSize: 14, color: '#1e293b', outline: 'none',
        fontFamily: 'inherit', background: 'white', boxSizing: 'border-box',
        transition: 'border-color .15s',
    };
}

// ── FilterSelect ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options, icon }) {
    return (
        <div style={{ position: 'relative', minWidth: 140 }}>
            {icon && (
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 12, pointerEvents: 'none', zIndex: 1 }}>
                    <i className={icon}></i>
                </div>
            )}
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    paddingLeft: icon ? 32 : 12, paddingRight: 28, paddingTop: 9, paddingBottom: 9,
                    border: `1.5px solid ${value ? TEAL : '#e5e7eb'}`,
                    borderRadius: 10, fontSize: 13, color: value ? NAVY : '#6b7280',
                    background: value ? '#f0fdf9' : 'white', cursor: 'pointer',
                    outline: 'none', appearance: 'none', fontFamily: 'inherit',
                    fontWeight: value ? 600 : 400, transition: 'all .15s', width: '100%',
                }}
            >
                <option value="">{label}</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            <i className="fas fa-chevron-down" style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, color: '#9ca3af', pointerEvents: 'none',
            }}></i>
        </div>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #f0f0f0', height: 260 }}>
                    <div style={{ height: 5, background: '#f3f4f6' }} />
                    <div style={{ padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ width: 70, height: 20, borderRadius: 10, background: '#f3f4f6' }} />
                            <div style={{ width: 55, height: 20, borderRadius: 10, background: '#f3f4f6' }} />
                        </div>
                        <div style={{ width: '85%', height: 15, borderRadius: 4, background: '#f3f4f6', marginBottom: 8 }} />
                        <div style={{ width: '60%', height: 15, borderRadius: 4, background: '#f3f4f6', marginBottom: 14 }} />
                        <div style={{ width: '100%', height: 11, borderRadius: 4, background: '#f3f4f6', marginBottom: 6 }} />
                        <div style={{ width: '75%', height: 11, borderRadius: 4, background: '#f3f4f6', marginBottom: 14 }} />
                        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                            <div style={{ width: 60, height: 18, borderRadius: 10, background: '#f3f4f6' }} />
                            <div style={{ width: 45, height: 18, borderRadius: 10, background: '#f3f4f6' }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Item Card ─────────────────────────────────────────────────────────────────

function ItemCard({ item, onClick }) {
    const [hovered, setHovered] = useState(false);
    const ti = typeInfo(item.type);
    const isFree = !item.price || parseFloat(item.price) === 0;

    return (
        <div
            onClick={() => onClick(item)}
            style={{
                background: 'white', borderRadius: 16, border: `1px solid ${hovered ? TEAL + '40' : '#f0f0f0'}`,
                overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer',
                transition: 'all .2s',
                boxShadow: hovered ? '0 8px 28px rgba(91,188,180,0.14)' : '0 1px 4px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-3px)' : 'none',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* top accent */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${ti.color}, ${NAVY})` }} />

            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Badges row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: ti.bg, color: ti.color,
                        border: `1px solid ${ti.color}25`,
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <i className={ti.icon} style={{ fontSize: 9 }}></i>
                        {ti.label}
                    </span>
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: isFree ? '#d1fae5' : '#e8eaf6',
                        color: isFree ? '#059669' : NAVY,
                        border: `1px solid ${isFree ? '#6ee7b7' : NAVY + '30'}`,
                    }}>
                        {fmtPrice(item.price)}
                    </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 7px', lineHeight: 1.4 }}>
                    {item.title}
                </h3>

                {/* Description */}
                <p style={{
                    fontSize: 12, color: '#6b7280', lineHeight: 1.55, margin: '0 0 12px',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', flex: 1,
                }}>
                    {item.description || 'Aucune description disponible.'}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {item.matiere && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#f3f4f6', color: '#6b7280' }}>
                            <i className="fas fa-book" style={{ marginRight: 3, fontSize: 9 }}></i>{item.matiere}
                        </span>
                    )}
                    {item.niveau && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#eff6ff', color: '#3B82F6' }}>
                            {item.niveau}
                        </span>
                    )}
                </div>

                {/* Bottom row: rating + downloads */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Stars rating={item.average_rating || 0} />
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            ({item.reviews_count || 0})
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
                        <i className="fas fa-download"></i>
                        <span>{item.downloads_count || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Payment Mini-Form ─────────────────────────────────────────────────────────

function PaymentForm({ item, onSuccess, onCancel }) {
    const [form, setForm] = useState({ payment_method: '', payment_reference: '' });
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.payment_method.trim() || !form.payment_reference.trim()) {
            toast.error('Veuillez remplir tous les champs de paiement.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/api/marketplace/${item.id}/purchase`, form);
            toast.success('Achat effectue avec succes !');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors du paiement.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ background: '#f8fafb', borderRadius: 14, padding: 20, marginTop: 16, border: `1.5px solid ${TEAL}30` }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: NAVY }}>
                <i className="fas fa-credit-card" style={{ marginRight: 8, color: TEAL }}></i>
                Informations de paiement
            </h4>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Methode de paiement *</label>
                    <select
                        value={form.payment_method}
                        onChange={e => set('payment_method', e.target.value)}
                        style={{ ...inputStyle(!form.payment_method && false), appearance: 'none' }}
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    >
                        <option value="">Choisir une methode...</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="mtn_momo">MTN Mobile Money</option>
                        <option value="wave">Wave</option>
                        <option value="moov_money">Moov Money</option>
                    </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Reference de transaction *</label>
                    <input
                        value={form.payment_reference}
                        onChange={e => set('payment_reference', e.target.value)}
                        placeholder="Ex: TXN-123456789"
                        style={inputStyle(false)}
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={onCancel} style={{
                        flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                        background: 'white', color: '#6b7280', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        Annuler
                    </button>
                    <button type="submit" disabled={submitting} style={{
                        flex: 2, padding: '10px', borderRadius: 10, border: 'none',
                        background: submitting ? '#d1d5db' : `linear-gradient(135deg, ${NAVY}, #2d4270)`,
                        color: 'white', fontWeight: 700, fontSize: 13,
                        cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        boxShadow: submitting ? 'none' : `0 4px 12px ${NAVY}35`,
                    }}>
                        {submitting
                            ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 6 }}></i>Traitement...</>
                            : <><i className="fas fa-lock" style={{ marginRight: 6 }}></i>Acheter - {fmtPrice(item.price)}</>
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Review Form ───────────────────────────────────────────────────────────────

function ReviewForm({ itemId, onSuccess }) {
    const [form, setForm] = useState({ rating: 0, comment: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.rating) { toast.error('Veuillez attribuer une note.'); return; }
        setSubmitting(true);
        try {
            await api.post(`/api/marketplace/${itemId}/review`, form);
            toast.success('Avis soumis avec succes !');
            setForm({ rating: 0, comment: '' });
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la soumission.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ background: '#f8fafb', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: NAVY }}>
                <i className="fas fa-comment-alt" style={{ marginRight: 8, color: TEAL }}></i>
                Laisser un avis
            </h4>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Votre note *</label>
                    <StarSelector value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Commentaire</label>
                    <textarea
                        value={form.comment}
                        onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                        rows={3}
                        placeholder="Partagez votre experience avec ce contenu..."
                        style={{ ...inputStyle(false), resize: 'vertical', minHeight: 80 }}
                        onFocus={e => e.target.style.borderColor = TEAL}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>
                <button type="submit" disabled={submitting} style={{
                    width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                    background: submitting ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                    color: 'white', fontWeight: 700, fontSize: 14,
                    cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    boxShadow: submitting ? 'none' : '0 4px 12px rgba(91,188,180,0.35)',
                }}>
                    {submitting
                        ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }}></i>Envoi...</>
                        : <><i className="fas fa-paper-plane" style={{ marginRight: 8 }}></i>Publier l'avis</>
                    }
                </button>
            </form>
        </div>
    );
}

// ── Item Detail Modal ─────────────────────────────────────────────────────────

function ItemDetailModal({ itemId, user, onClose, onPurchased }) {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPayment, setShowPayment] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [reviews, setReviews] = useState([]);

    const fetchItem = useCallback(async () => {
        try {
            const r = await api.get(`/api/marketplace/${itemId}`);
            const data = r.data?.data || r.data;
            setItem(data);
            setReviews(data.reviews || []);
        } catch {
            toast.error('Impossible de charger les details.');
            onClose();
        } finally {
            setLoading(false);
        }
    }, [itemId, onClose]);

    useEffect(() => { fetchItem(); }, [fetchItem]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const response = await api.get(`/api/marketplace/${item.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = item.file_name || `${item.title}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Telechargement demarre !');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors du telechargement.');
        } finally {
            setDownloading(false);
        }
    };

    const handlePurchaseSuccess = () => {
        setShowPayment(false);
        onPurchased?.();
        fetchItem();
    };

    const isFree = item && (!item.price || parseFloat(item.price) === 0);
    const isPurchased = item?.is_purchased;
    const canDownload = isFree || isPurchased;
    const ti = item ? typeInfo(item.type) : {};

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '20px 20px', overflowY: 'auto',
        }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: 'white', borderRadius: 22, width: '100%', maxWidth: 680,
                boxShadow: '0 30px 80px rgba(0,0,0,0.18)', overflow: 'hidden',
                marginTop: 20, marginBottom: 20,
            }}>
                {/* Modal header */}
                <div style={{
                    background: `linear-gradient(135deg, ${NAVY}, #2d4270)`,
                    padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Detail du contenu</h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
                        color: 'white', width: 34, height: 34, cursor: 'pointer', fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 32, color: TEAL }}></i>
                        <p style={{ color: '#9ca3af', marginTop: 14, fontSize: 14 }}>Chargement...</p>
                    </div>
                ) : item ? (
                    <div style={{ padding: '28px 28px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
                        {/* Title + type badge */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                                    background: ti.bg, color: ti.color, border: `1px solid ${ti.color}25`,
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <i className={ti.icon} style={{ fontSize: 10 }}></i>
                                    {ti.label}
                                </span>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                                    background: isFree ? '#d1fae5' : '#e8eaf6',
                                    color: isFree ? '#059669' : NAVY,
                                }}>
                                    {fmtPrice(item.price)}
                                </span>
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: '0 0 10px', lineHeight: 1.35 }}>
                                {item.title}
                            </h2>
                            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65, margin: 0 }}>
                                {item.description || 'Aucune description disponible.'}
                            </p>
                        </div>

                        {/* Seller info */}
                        {item.seller && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                                background: '#f8fafb', borderRadius: 12, marginBottom: 18, border: '1px solid #f0f0f0',
                            }}>
                                {item.seller.avatar ? (
                                    <img src={item.seller.avatar} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{
                                        width: 42, height: 42, borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: 18, fontWeight: 700,
                                    }}>
                                        {(item.seller.name || 'U')[0].toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{item.seller.name}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                        <i className="fas fa-user-circle" style={{ marginRight: 4 }}></i>Vendeur
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Meta grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                            {[
                                item.category_name && { icon: 'fas fa-tag', label: 'Categorie', val: item.category_name },
                                item.matiere && { icon: 'fas fa-book', label: 'Matiere', val: item.matiere },
                                item.niveau && { icon: 'fas fa-layer-group', label: 'Niveau', val: item.niveau },
                                item.created_at && { icon: 'fas fa-calendar', label: 'Publie le', val: fmtDate(item.created_at) },
                            ].filter(Boolean).map((m, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', background: '#f8fafb', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                                    <i className={m.icon} style={{ color: TEAL, fontSize: 14, width: 16, textAlign: 'center' }}></i>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
                                        <div style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>{m.val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Rating summary */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <Stars rating={item.average_rating || 0} size={16} />
                            <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{parseFloat(item.average_rating || 0).toFixed(1)}</span>
                            <span style={{ fontSize: 13, color: '#9ca3af' }}>· {item.reviews_count || 0} avis</span>
                            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
                                <i className="fas fa-download" style={{ marginRight: 4 }}></i>
                                {item.downloads_count || 0} telechargements
                            </span>
                        </div>

                        {/* CTA */}
                        {!user ? (
                            <div style={{ background: '#f8fafb', border: '1px dashed #d1d5db', borderRadius: 12, padding: 18, textAlign: 'center', marginBottom: 20 }}>
                                <i className="fas fa-lock" style={{ fontSize: 22, color: '#9ca3af', marginBottom: 8, display: 'block' }}></i>
                                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>Connectez-vous pour telecharger ou acheter ce contenu.</p>
                                <a href="/login" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                    color: 'white', textDecoration: 'none', borderRadius: 10,
                                    padding: '10px 22px', fontSize: 13, fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(91,188,180,0.35)',
                                }}>
                                    <i className="fas fa-sign-in-alt"></i>Se connecter
                                </a>
                            </div>
                        ) : canDownload ? (
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                                    background: downloading ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                    color: 'white', fontWeight: 700, fontSize: 15,
                                    cursor: downloading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit', marginBottom: 20,
                                    boxShadow: downloading ? 'none' : '0 4px 16px rgba(91,188,180,0.40)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    transition: 'all .2s',
                                }}
                            >
                                {downloading
                                    ? <><i className="fas fa-circle-notch fa-spin"></i>Telechargement...</>
                                    : <><i className="fas fa-download"></i>Telecharger</>
                                }
                            </button>
                        ) : (
                            <div style={{ marginBottom: 20 }}>
                                {!showPayment ? (
                                    <button
                                        onClick={() => setShowPayment(true)}
                                        style={{
                                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                                            background: `linear-gradient(135deg, ${NAVY}, #2d4270)`,
                                            color: 'white', fontWeight: 700, fontSize: 15,
                                            cursor: 'pointer', fontFamily: 'inherit',
                                            boxShadow: `0 4px 16px ${NAVY}35`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                            transition: 'all .2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 22px ${NAVY}50`}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 4px 16px ${NAVY}35`}
                                    >
                                        <i className="fas fa-shopping-cart"></i>
                                        Acheter - {fmtPrice(item.price)}
                                    </button>
                                ) : (
                                    <PaymentForm
                                        item={item}
                                        onSuccess={handlePurchaseSuccess}
                                        onCancel={() => setShowPayment(false)}
                                    />
                                )}
                            </div>
                        )}

                        {/* Reviews list */}
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 22, marginBottom: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>
                                <i className="fas fa-comments" style={{ marginRight: 8, color: TEAL }}></i>
                                Avis ({reviews.length})
                            </h3>
                            {reviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>
                                    <i className="far fa-comment-alt" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}></i>
                                    Aucun avis pour le moment.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {reviews.map((rv, i) => (
                                        <div key={rv.id || i} style={{ padding: '14px 16px', background: '#f8fafb', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        background: `linear-gradient(135deg, ${TEAL}80, ${NAVY}80)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'white', fontSize: 13, fontWeight: 700,
                                                    }}>
                                                        {(rv.user_name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{rv.user_name || 'Utilisateur'}</div>
                                                        <Stars rating={rv.rating} size={11} />
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(rv.created_at)}</span>
                                            </div>
                                            {rv.comment && (
                                                <p style={{ margin: 0, fontSize: 13, color: '#4b5563', lineHeight: 1.55 }}>{rv.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Review form (purchased users only) */}
                        {user && isPurchased && (
                            <ReviewForm itemId={item.id} onSuccess={fetchItem} />
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ── Sell Modal ────────────────────────────────────────────────────────────────

function SellModal({ categories, onClose }) {
    const [form, setForm] = useState({
        title: '', description: '', category_id: '', matiere: '',
        niveau: '', type: '', price: '', file: null, preview: null,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Titre requis';
        if (!form.description.trim()) e.description = 'Description requise';
        if (!form.type) e.type = 'Type requis';
        if (!form.file) e.file = 'Fichier requis';
        return e;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') fd.append(k, v); });
            await api.post('/api/marketplace', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la publication.');
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSubmitting(false);
        }
    };

    const inp = (field) => ({
        ...inputStyle(errors[field]),
        onFocus: e => e.target.style.borderColor = TEAL,
        onBlur: e => e.target.style.borderColor = errors[field] ? '#ef4444' : '#e5e7eb',
    });

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '20px', overflowY: 'auto',
        }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: 'white', borderRadius: 22, width: '100%', maxWidth: 560,
                boxShadow: '0 30px 80px rgba(0,0,0,0.18)', overflow: 'hidden',
                marginTop: 20, marginBottom: 20,
            }}>
                {/* header */}
                <div style={{
                    background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                    padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
                        <i className="fas fa-store" style={{ fontSize: 18 }}></i>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Vendre un contenu</h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
                        color: 'white', width: 32, height: 32, cursor: 'pointer', fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {success ? (
                    <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: '#d1fae5', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 20px', fontSize: 32, color: '#059669',
                        }}>
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 10 }}>Publication soumise !</h3>
                        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                            Votre contenu est en attente d'approbation. Il sera visible apres validation par notre equipe.
                        </p>
                        <button onClick={onClose} style={{
                            background: `linear-gradient(135deg, ${TEAL}, #3da89e)`, color: 'white',
                            border: 'none', borderRadius: 12, padding: '12px 32px', fontSize: 14,
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                        }}>
                            <i className="fas fa-check" style={{ marginRight: 8 }}></i>Fermer
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: '28px', maxHeight: '78vh', overflowY: 'auto' }}>
                        {/* Title */}
                        <div style={{ marginBottom: 15 }}>
                            <label style={labelStyle}>Titre *</label>
                            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Cours complet de Comptabilite L2" {...inp('title')} />
                            {errors.title && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.title}</span>}
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: 15 }}>
                            <label style={labelStyle}>Description *</label>
                            <textarea
                                value={form.description} onChange={e => set('description', e.target.value)}
                                rows={3} placeholder="Decrivez votre contenu..."
                                style={{ ...inputStyle(errors.description), resize: 'vertical', minHeight: 80 }}
                                onFocus={e => e.target.style.borderColor = TEAL}
                                onBlur={e => e.target.style.borderColor = errors.description ? '#ef4444' : '#e5e7eb'}
                            />
                            {errors.description && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.description}</span>}
                        </div>

                        {/* Type + Category */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 15 }}>
                            <div>
                                <label style={labelStyle}>Type *</label>
                                <select value={form.type} onChange={e => set('type', e.target.value)}
                                    style={{ ...inputStyle(errors.type), appearance: 'none' }}
                                    onFocus={e => e.target.style.borderColor = TEAL}
                                    onBlur={e => e.target.style.borderColor = errors.type ? '#ef4444' : '#e5e7eb'}
                                >
                                    <option value="">Choisir...</option>
                                    {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                {errors.type && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.type}</span>}
                            </div>
                            <div>
                                <label style={labelStyle}>Categorie</label>
                                <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
                                    style={{ ...inputStyle(false), appearance: 'none' }}
                                    onFocus={e => e.target.style.borderColor = TEAL}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                >
                                    <option value="">Aucune</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Matiere + Niveau */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 15 }}>
                            <div>
                                <label style={labelStyle}>Matiere</label>
                                <input value={form.matiere} onChange={e => set('matiere', e.target.value)} placeholder="Ex: Marketing" style={inputStyle(false)} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Niveau</label>
                                <input value={form.niveau} onChange={e => set('niveau', e.target.value)} placeholder="Ex: Licence 2" style={inputStyle(false)} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>
                        </div>

                        {/* Price */}
                        <div style={{ marginBottom: 15 }}>
                            <label style={labelStyle}>Prix (FCFA) — 0 pour gratuit</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number" min="0" step="100"
                                    value={form.price} onChange={e => set('price', e.target.value)}
                                    placeholder="0"
                                    style={{ ...inputStyle(false), paddingRight: 60 }}
                                    onFocus={e => e.target.style.borderColor = TEAL}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>FCFA</span>
                            </div>
                        </div>

                        {/* File upload */}
                        <div style={{ marginBottom: 15 }}>
                            <label style={labelStyle}>Fichier principal *</label>
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                gap: 8, padding: '20px',
                                border: `2px dashed ${errors.file ? '#ef4444' : form.file ? TEAL : '#d1d5db'}`,
                                borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
                                background: form.file ? '#f0fdf9' : '#fafafa',
                            }}
                                onMouseEnter={e => { if (!form.file) e.currentTarget.style.borderColor = TEAL; }}
                                onMouseLeave={e => { if (!form.file) e.currentTarget.style.borderColor = errors.file ? '#ef4444' : '#d1d5db'; }}
                            >
                                <i className="fas fa-cloud-upload-alt" style={{ fontSize: 26, color: form.file ? TEAL : '#9ca3af' }}></i>
                                {form.file
                                    ? <span style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{form.file.name}</span>
                                    : <>
                                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Glissez ou cliquez pour choisir</span>
                                        <span style={{ fontSize: 11, color: '#9ca3af' }}>PDF, DOC, DOCX, ZIP · max 50 Mo</span>
                                    </>
                                }
                                <input type="file" accept=".pdf,.doc,.docx,.zip,.pptx,.xlsx"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        if (f.size > 50 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 50 Mo)'); return; }
                                        set('file', f);
                                        setErrors(p => ({ ...p, file: undefined }));
                                    }}
                                />
                            </label>
                            {errors.file && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.file}</span>}
                        </div>

                        {/* Preview upload (optional) */}
                        <div style={{ marginBottom: 22 }}>
                            <label style={labelStyle}>Apercu / Image de couverture (optionnel)</label>
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                border: `1.5px dashed ${form.preview ? TEAL : '#d1d5db'}`,
                                borderRadius: 12, cursor: 'pointer', background: form.preview ? '#f0fdf9' : '#fafafa',
                                transition: 'all .2s',
                            }}
                                onMouseEnter={e => { if (!form.preview) e.currentTarget.style.borderColor = TEAL; }}
                                onMouseLeave={e => { if (!form.preview) e.currentTarget.style.borderColor = '#d1d5db'; }}
                            >
                                <i className="fas fa-image" style={{ fontSize: 18, color: form.preview ? TEAL : '#9ca3af' }}></i>
                                <span style={{ fontSize: 13, color: form.preview ? TEAL : '#6b7280', fontWeight: form.preview ? 600 : 400 }}>
                                    {form.preview ? form.preview.name : 'Choisir une image (PNG, JPG · max 5 Mo)'}
                                </span>
                                <input type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        if (f.size > 5 * 1024 * 1024) { toast.error('Image trop volumineuse (max 5 Mo)'); return; }
                                        set('preview', f);
                                    }}
                                />
                            </label>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" onClick={onClose} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                                background: 'white', color: '#6b7280', fontWeight: 600, fontSize: 14,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                Annuler
                            </button>
                            <button type="submit" disabled={submitting} style={{
                                flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                                background: submitting ? '#d1d5db' : `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                color: 'white', fontWeight: 700, fontSize: 14,
                                cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                boxShadow: submitting ? 'none' : '0 4px 12px rgba(91,188,180,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                                {submitting
                                    ? <><i className="fas fa-circle-notch fa-spin"></i>Publication...</>
                                    : <><i className="fas fa-store"></i>Publier</>
                                }
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

// ── My Purchases View ─────────────────────────────────────────────────────────

function MyPurchases({ onClose, onOpenItem }) {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/marketplace-purchases')
            .then(r => setPurchases(r.data?.data || r.data || []))
            .catch(() => setPurchases([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: 20, overflowY: 'auto',
        }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: 'white', borderRadius: 22, width: '100%', maxWidth: 600,
                boxShadow: '0 30px 80px rgba(0,0,0,0.18)', overflow: 'hidden',
                marginTop: 20, marginBottom: 20,
            }}>
                {/* header */}
                <div style={{
                    background: `linear-gradient(135deg, ${NAVY}, #2d4270)`,
                    padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
                        <i className="fas fa-shopping-bag" style={{ fontSize: 18 }}></i>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Mes achats</h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                        color: 'white', width: 32, height: 32, cursor: 'pointer', fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div style={{ padding: 28, maxHeight: '75vh', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 48 }}>
                            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 30, color: TEAL }}></i>
                        </div>
                    ) : purchases.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                            <div style={{
                                width: 68, height: 68, borderRadius: 18, background: '#f3f4f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', fontSize: 30, color: '#d1d5db',
                            }}>
                                <i className="fas fa-shopping-bag"></i>
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Aucun achat</h3>
                            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                                Vous n'avez pas encore achete de contenu.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {purchases.map((p, i) => {
                                const ti = typeInfo(p.type);
                                return (
                                    <div key={p.id || i} style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 16px', background: '#f8fafb',
                                        borderRadius: 14, border: '1px solid #f0f0f0',
                                        transition: 'all .15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${TEAL}40`; e.currentTarget.style.background = '#f0fdf9'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.background = '#f8fafb'; }}
                                    >
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                            background: ti.bg, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: ti.color, fontSize: 18,
                                        }}>
                                            <i className={ti.icon}></i>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                                {fmtDate(p.purchased_at)} · {fmtPrice(p.price)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                            <button
                                                onClick={() => { onClose(); onOpenItem(p.id); }}
                                                style={{
                                                    background: 'white', border: `1.5px solid ${TEAL}50`,
                                                    color: TEAL, borderRadius: 8, padding: '7px 12px',
                                                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
                                                }}
                                            >
                                                <i className="fas fa-eye"></i>Voir
                                            </button>
                                            <a
                                                href={`/api/marketplace/${p.id}/download`}
                                                download
                                                style={{
                                                    background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                                    color: 'white', borderRadius: 8, padding: '7px 12px',
                                                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
                                                    boxShadow: '0 2px 6px rgba(91,188,180,0.30)',
                                                }}
                                            >
                                                <i className="fas fa-download"></i>Telecharger
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Marketplace() {
    const { user } = useAuth();

    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ category_id: '', type: '', price: '', sort: 'newest' });
    const setFilter = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

    // Modals / views
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [showSell, setShowSell] = useState(false);
    const [showPurchases, setShowPurchases] = useState(false);

    // Fetch items
    const fetchItems = useCallback(async (pageNum = 1, append = false) => {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        try {
            const params = new URLSearchParams({ page: pageNum });
            if (filters.category_id) params.append('category_id', filters.category_id);
            if (filters.type) params.append('type', filters.type);
            if (filters.price) params.append('price', filters.price);
            if (filters.sort) params.append('sort', filters.sort);
            if (search.trim()) params.append('search', search.trim());

            const r = await api.get(`/api/marketplace?${params.toString()}`);
            const data = r.data?.data || r.data || [];
            const meta = r.data?.meta || r.data?.pagination || {};

            if (append) {
                setItems(p => [...p, ...data]);
            } else {
                setItems(data);
            }
            const currentPage = meta.current_page || pageNum;
            const lastPage = meta.last_page || 1;
            setHasMore(currentPage < lastPage);
            setPage(currentPage);
        } catch {
            if (!append) setItems([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [filters, search]);

    useEffect(() => { fetchItems(1, false); }, [fetchItems]);

    useEffect(() => {
        api.get('/api/public/categories')
            .then(r => setCategories(r.data?.data || r.data || []))
            .catch(() => {});
    }, []);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) fetchItems(page + 1, true);
    };

    const handlePurchased = () => { fetchItems(1, false); };

    const hasActiveFilters = search.trim() || filters.category_id || filters.type || filters.price;

    const clearFilters = () => {
        setSearch('');
        setFilters({ category_id: '', type: '', price: '', sort: 'newest' });
        setPage(1);
    };

    return (
        <div style={{ background: '#F8FAFB', minHeight: 'calc(100vh - 64px)' }}>

            {/* ── Page Header ── */}
            <div style={{
                background: `linear-gradient(155deg, ${NAVY} 0%, #2d4270 60%, #1e3560 100%)`,
                padding: '44px 0 38px', position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: `${TEAL}15`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -30, left: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                <div style={{ ...W, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18 }}>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                                <i className="fas fa-store" style={{ marginRight: 6 }}></i>INSAM-IA
                            </span>
                            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: '10px 0 10px', lineHeight: 1.2 }}>
                                Marketplace
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14, lineHeight: 1.65, maxWidth: 520, margin: 0 }}>
                                Achetez et vendez des contenus educatifs
                            </p>
                        </div>

                        {/* Action buttons */}
                        {user && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setShowPurchases(true)}
                                    style={{
                                        background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)',
                                        color: 'white', borderRadius: 12, padding: '11px 20px',
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                        display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s',
                                        backdropFilter: 'blur(8px)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.20)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                                >
                                    <i className="fas fa-shopping-bag"></i>Mes achats
                                </button>
                                <button
                                    onClick={() => setShowSell(true)}
                                    style={{
                                        background: `linear-gradient(135deg, ${TEAL}, #3da89e)`,
                                        border: 'none', color: 'white', borderRadius: 12,
                                        padding: '11px 20px', fontSize: 13, fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s',
                                        boxShadow: '0 4px 16px rgba(91,188,180,0.45)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 22px rgba(91,188,180,0.60)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,188,180,0.45)'}
                                >
                                    <i className="fas fa-plus"></i>Vendre un contenu
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div style={{
                background: 'white', borderBottom: '1px solid #f0f0f0',
                padding: '14px 0', position: 'sticky', top: 64, zIndex: 40,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
                <div style={{ ...W, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 220px' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}></i>
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Rechercher un contenu..."
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
                        label="Type" value={filters.type} icon="fas fa-layer-group"
                        onChange={v => setFilter('type', v)}
                        options={ITEM_TYPES.map(t => ({ value: t.value, label: t.label }))}
                    />

                    {/* Price toggle */}
                    <div style={{ display: 'flex', borderRadius: 10, border: '1.5px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                        {PRICE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setFilter('price', opt.value)}
                                style={{
                                    padding: '8px 13px', border: 'none', fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                                    background: filters.price === opt.value ? TEAL : 'white',
                                    color: filters.price === opt.value ? 'white' : '#6b7280',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <FilterSelect
                        label="Trier par" value={filters.sort} icon="fas fa-sort"
                        onChange={v => setFilter('sort', v)}
                        options={SORT_OPTIONS}
                    />

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            style={{
                                background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10,
                                color: '#ef4444', padding: '8px 13px', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <i className="fas fa-times"></i>Effacer
                        </button>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ ...W, padding: '32px 24px' }}>

                {/* Guest CTA banner */}
                {!user && (
                    <div style={{
                        background: `linear-gradient(135deg, ${NAVY}08, ${TEAL}10)`,
                        border: `1px solid ${TEAL}30`, borderRadius: 14,
                        padding: '16px 22px', marginBottom: 26,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 12,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${TEAL}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 18 }}>
                                <i className="fas fa-lock-open"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Connectez-vous pour acceder a toutes les fonctionnalites</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Achetez, vendez et telechargez des contenus educatifs.</div>
                            </div>
                        </div>
                        <a href="/login" style={{
                            background: `linear-gradient(135deg, ${TEAL}, #3da89e)`, color: 'white',
                            textDecoration: 'none', borderRadius: 10, padding: '9px 20px',
                            fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 3px 10px rgba(91,188,180,0.35)',
                        }}>
                            <i className="fas fa-sign-in-alt"></i>Se connecter
                        </a>
                    </div>
                )}

                {/* Results count */}
                {!loading && (
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                            {items.length === 0
                                ? 'Aucun contenu trouve'
                                : `${items.length} contenu${items.length > 1 ? 's' : ''} trouve${items.length > 1 ? 's' : ''}`
                            }
                            {hasActiveFilters && <span style={{ color: TEAL, fontWeight: 600 }}> · filtres actifs</span>}
                        </p>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && <Skeleton />}

                {/* Empty state */}
                {!loading && items.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 22,
                            background: '#f3f4f6', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 20px', fontSize: 34, color: '#d1d5db',
                        }}>
                            <i className="fas fa-store"></i>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
                            {hasActiveFilters ? 'Aucun contenu pour ces filtres' : 'Aucun contenu disponible'}
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
                            {hasActiveFilters
                                ? 'Essayez de modifier vos criteres de recherche.'
                                : 'Soyez le premier a mettre en vente un contenu educatif !'}
                        </p>
                        {hasActiveFilters ? (
                            <button onClick={clearFilters} style={{
                                background: TEAL, color: 'white', border: 'none', borderRadius: 10,
                                padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                Effacer les filtres
                            </button>
                        ) : user ? (
                            <button onClick={() => setShowSell(true)} style={{
                                background: `linear-gradient(135deg, ${TEAL}, #3da89e)`, color: 'white',
                                border: 'none', borderRadius: 10, padding: '12px 28px',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 12px rgba(91,188,180,0.35)',
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                            }}>
                                <i className="fas fa-plus"></i>Vendre un contenu
                            </button>
                        ) : (
                            <a href="/login" style={{
                                background: `linear-gradient(135deg, ${TEAL}, #3da89e)`, color: 'white',
                                textDecoration: 'none', borderRadius: 10, padding: '12px 28px',
                                fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 4px 12px rgba(91,188,180,0.35)',
                            }}>
                                <i className="fas fa-sign-in-alt"></i>Se connecter pour commencer
                            </a>
                        )}
                    </div>
                )}

                {/* Items Grid */}
                {!loading && items.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                        {items.map(item => (
                            <ItemCard key={item.id} item={item} onClick={i => setSelectedItemId(i.id)} />
                        ))}
                    </div>
                )}

                {/* Load More */}
                {!loading && hasMore && (
                    <div style={{ textAlign: 'center', marginTop: 36 }}>
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            style={{
                                background: loadingMore ? '#d1d5db' : 'white',
                                border: `2px solid ${loadingMore ? '#d1d5db' : TEAL}`,
                                color: loadingMore ? '#9ca3af' : TEAL,
                                borderRadius: 12, padding: '12px 36px', fontSize: 14, fontWeight: 700,
                                cursor: loadingMore ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all .2s',
                            }}
                            onMouseEnter={e => { if (!loadingMore) { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = 'white'; } }}
                            onMouseLeave={e => { if (!loadingMore) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = TEAL; } }}
                        >
                            {loadingMore
                                ? <><i className="fas fa-circle-notch fa-spin"></i>Chargement...</>
                                : <><i className="fas fa-chevron-down"></i>Charger plus</>
                            }
                        </button>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {selectedItemId && (
                <ItemDetailModal
                    itemId={selectedItemId}
                    user={user}
                    onClose={() => setSelectedItemId(null)}
                    onPurchased={handlePurchased}
                />
            )}
            {showSell && (
                <SellModal
                    categories={categories}
                    onClose={() => setShowSell(false)}
                />
            )}
            {showPurchases && (
                <MyPurchases
                    onClose={() => setShowPurchases(false)}
                    onOpenItem={id => { setShowPurchases(false); setSelectedItemId(id); }}
                />
            )}
        </div>
    );
}
