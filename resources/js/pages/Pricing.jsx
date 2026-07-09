import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../api';
import toast from 'react-hot-toast';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 1100, margin: '0 auto', padding: '0 24px' };

/* ── helpers ── */
function formatPrice(price) {
    if (!price || price === 0) return 'Gratuit';
    return `${Number(price).toLocaleString('fr-FR')} FCFA/mois`;
}

function ProgressBar({ value, max }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
            <div style={{
                width: `${pct}%`, height: '100%',
                background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : TEAL,
                borderRadius: 99, transition: 'width .4s ease',
            }} />
        </div>
    );
}

/* ── Subscribe Modal ── */
function SubscribeModal({ plan, onClose, onSuccess }) {
    const [method, setMethod] = useState('mtn_momo');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);

    const METHODS = [
        { id: 'mtn_momo',     label: 'MTN Mobile Money',  icon: 'fas fa-mobile-alt' },
        { id: 'orange_money', label: 'Orange Money',       icon: 'fas fa-mobile-alt' },
        { id: 'card',         label: 'Carte bancaire',     icon: 'fas fa-credit-card' },
    ];

    const handleConfirm = async () => {
        if (!reference.trim()) {
            toast.error('Veuillez saisir une reference de paiement.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/api/subscription/subscribe', {
                plan_id: plan.id,
                payment_method: method,
                payment_reference: reference.trim(),
            });
            toast.success('Abonnement souscrit avec succes !');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors du paiement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(27,42,74,0.55)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: 'white', borderRadius: 20,
                boxShadow: '0 24px 64px rgba(27,42,74,0.2)',
                width: '100%', maxWidth: 460, overflow: 'hidden',
            }}>
                {/* Modal header */}
                <div style={{
                    background: `linear-gradient(135deg, ${NAVY} 0%, #243758 100%)`,
                    padding: '24px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ color: TEAL, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                            SOUSCRIPTION
                        </div>
                        <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>
                            {plan.name}
                        </h2>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
                            {formatPrice(plan.price)}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white',
                        width: 36, height: 36, borderRadius: '50%',
                        cursor: 'pointer', fontSize: 16, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Modal body */}
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Plan summary */}
                    {plan.description && (
                        <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                            {plan.description}
                        </p>
                    )}

                    {/* Payment method */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 10 }}>
                            Mode de paiement
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {METHODS.map(m => (
                                <button key={m.id} onClick={() => setMethod(m.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 16px', borderRadius: 12,
                                    border: `2px solid ${method === m.id ? TEAL : '#e5e7eb'}`,
                                    background: method === m.id ? '#e8f8f5' : 'white',
                                    cursor: 'pointer', textAlign: 'left',
                                    transition: 'all .15s',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: method === m.id ? TEAL : '#f3f4f6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: method === m.id ? 'white' : '#9ca3af',
                                        fontSize: 15, flexShrink: 0,
                                    }}>
                                        <i className={m.icon}></i>
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: method === m.id ? NAVY : '#374151' }}>
                                        {m.label}
                                    </span>
                                    {method === m.id && (
                                        <i className="fas fa-check-circle" style={{ marginLeft: 'auto', color: TEAL, fontSize: 16 }}></i>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reference */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 8 }}>
                            Reference de paiement
                        </label>
                        <input
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="Ex: TXN123456789"
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: 10,
                                border: '1.5px solid #e5e7eb', fontSize: 14, color: NAVY,
                                outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
                            }}
                            onFocus={e => e.target.style.borderColor = TEAL}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                            Saisissez le code de transaction recu apres votre paiement.
                        </p>
                    </div>

                    {/* Confirm button */}
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                            background: loading ? '#9ca3af' : `linear-gradient(135deg, ${TEAL}, #3da89f)`,
                            color: 'white', fontWeight: 700, fontSize: 15,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: loading ? 'none' : '0 4px 16px rgba(91,188,180,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all .2s',
                        }}
                    >
                        {loading
                            ? <><i className="fas fa-spinner fa-spin"></i> Traitement en cours...</>
                            : <><i className="fas fa-lock"></i> Confirmer le paiement</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function Pricing() {
    const { user } = useAuth();

    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    const [subscription, setSubscription] = useState(null);
    const [usage, setUsage] = useState(null);
    const [loadingSub, setLoadingSub] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const [modalPlan, setModalPlan] = useState(null);

    /* fetch plans (public) */
    useEffect(() => {
        api.get('/api/plans')
            .then(r => setPlans(r.data.data || r.data || []))
            .catch(() => toast.error('Impossible de charger les offres.'))
            .finally(() => setLoadingPlans(false));
    }, []);

    /* fetch subscription + usage (auth only) */
    const fetchSubscription = () => {
        if (!user) return;
        setLoadingSub(true);
        Promise.all([
            api.get('/api/subscription').catch(() => ({ data: null })),
            api.get('/api/subscription/usage').catch(() => ({ data: null })),
        ]).then(([subRes, usageRes]) => {
            setSubscription(subRes.data?.data || subRes.data || null);
            setUsage(usageRes.data?.data || usageRes.data || null);
        }).finally(() => setLoadingSub(false));
    };

    useEffect(() => { fetchSubscription(); }, [user]);

    /* cancel subscription */
    const handleCancel = async () => {
        if (!window.confirm('Etes-vous sur de vouloir annuler votre abonnement ?')) return;
        setCancelling(true);
        try {
            await api.post('/api/subscription/cancel');
            toast.success('Abonnement annule.');
            fetchSubscription();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de l\'annulation.');
        } finally {
            setCancelling(false);
        }
    };

    /* helpers */
    const currentPlanId = subscription?.plan_id || subscription?.plan?.id || null;
    const isFree = !subscription || !subscription.plan_id || subscription.plan?.price === 0;

    /* which plan index to highlight as Popular (index 1 = middle/Premium) */
    const popularIndex = 1;

    /* ── RENDER ── */
    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 80 }}>

            {/* ── HEADER ── */}
            <section style={{
                background: 'linear-gradient(135deg, #5BBCB4 0%, #3da89f 50%, #2c9e96 100%)',
                padding: '64px 0 72px',
                textAlign: 'center',
            }}>
                <div style={W}>
                    <span style={{
                        display: 'inline-block', background: 'rgba(255,255,255,0.2)',
                        color: 'white', fontSize: 12, fontWeight: 700,
                        letterSpacing: 1.5, padding: '5px 16px', borderRadius: 99, marginBottom: 18,
                    }}>
                        ABONNEMENTS
                    </span>
                    <h1 style={{
                        fontSize: 42, fontWeight: 900, color: 'white',
                        margin: '0 0 16px', lineHeight: 1.15,
                        textShadow: '0 2px 12px rgba(27,42,74,0.15)',
                    }}>
                        Nos Offres
                    </h1>
                    <p style={{
                        fontSize: 17, color: 'rgba(255,255,255,0.88)',
                        maxWidth: 480, margin: '0 auto',
                        lineHeight: 1.6,
                    }}>
                        Choisissez le plan adapte a vos besoins
                    </p>
                </div>
            </section>

            {/* ── PRICING CARDS ── */}
            <section style={{ ...W, marginTop: -36, paddingTop: 0 }}>
                {loadingPlans ? (
                    <div style={{
                        background: 'white', borderRadius: 20, padding: 64,
                        textAlign: 'center', color: '#9ca3af',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: TEAL, marginBottom: 16 }}></i>
                        <p style={{ fontSize: 15 }}>Chargement des offres...</p>
                    </div>
                ) : plans.length === 0 ? (
                    <div style={{
                        background: 'white', borderRadius: 20, padding: 64,
                        textAlign: 'center', color: '#9ca3af',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    }}>
                        <i className="fas fa-box-open" style={{ fontSize: 32, color: '#e5e7eb', marginBottom: 16 }}></i>
                        <p style={{ fontSize: 15 }}>Aucune offre disponible pour le moment.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`,
                        gap: 24,
                        alignItems: 'stretch',
                    }}>
                        {plans.map((plan, idx) => {
                            const isCurrent = currentPlanId === plan.id;
                            const isPopular = idx === popularIndex && plans.length > 1;
                            const isFreePrice = !plan.price || plan.price === 0;
                            const isLastPlan = idx === plans.length - 1;

                            /* button state */
                            let btnLabel = 'S\'abonner';
                            let btnDisabled = false;
                            let btnBg = isLastPlan ? NAVY : TEAL;
                            let btnShadow = isLastPlan
                                ? '0 4px 16px rgba(27,42,74,0.3)'
                                : '0 4px 16px rgba(91,188,180,0.35)';

                            if (isCurrent) {
                                btnLabel = 'Plan actuel';
                                btnDisabled = true;
                                btnBg = '#9ca3af';
                                btnShadow = 'none';
                            } else if (isFreePrice) {
                                if (isFree && !user) {
                                    btnLabel = 'Plan actuel';
                                    btnDisabled = true;
                                    btnBg = '#9ca3af';
                                    btnShadow = 'none';
                                } else if (!user) {
                                    /* show nothing for free plan when logged out – handled below */
                                    btnLabel = null;
                                } else {
                                    /* free plan, logged in, not current */
                                    btnLabel = null; /* hide for non-free users */
                                }
                            }

                            if (!user) {
                                if (isFreePrice) {
                                    btnLabel = null; /* hide */
                                } else {
                                    btnLabel = 'Inscrivez-vous';
                                    btnDisabled = false;
                                }
                            }

                            return (
                                <div
                                    key={plan.id}
                                    style={{
                                        background: 'white',
                                        borderRadius: 20,
                                        border: isCurrent
                                            ? `2px solid ${TEAL}`
                                            : isPopular
                                                ? `2px solid ${TEAL}40`
                                                : '1px solid #f0f0f0',
                                        boxShadow: isCurrent
                                            ? `0 8px 32px rgba(91,188,180,0.18)`
                                            : isPopular
                                                ? '0 16px 48px rgba(91,188,180,0.14)'
                                                : '0 4px 16px rgba(0,0,0,0.06)',
                                        padding: '32px 28px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0,
                                        position: 'relative',
                                        transform: isPopular ? 'translateY(-8px)' : 'none',
                                        transition: 'box-shadow .2s, transform .2s',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isCurrent && !isPopular) {
                                            e.currentTarget.style.boxShadow = '0 12px 36px rgba(91,188,180,0.15)';
                                            e.currentTarget.style.borderColor = `${TEAL}60`;
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isCurrent && !isPopular) {
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                                            e.currentTarget.style.borderColor = '#f0f0f0';
                                        }
                                    }}
                                >
                                    {/* Popular badge */}
                                    {isPopular && (
                                        <div style={{
                                            position: 'absolute', top: -14, left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: TEAL, color: 'white',
                                            fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                                            padding: '5px 16px', borderRadius: 99,
                                            boxShadow: '0 4px 12px rgba(91,188,180,0.4)',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            <i className="fas fa-star" style={{ marginRight: 5, fontSize: 10 }}></i>
                                            Populaire
                                        </div>
                                    )}

                                    {/* Current plan indicator */}
                                    {isCurrent && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            background: '#e8f8f5', color: TEAL,
                                            fontSize: 11, fontWeight: 700,
                                            padding: '4px 12px', borderRadius: 99,
                                            marginBottom: 14, alignSelf: 'flex-start',
                                        }}>
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL, display: 'inline-block' }}></span>
                                            Votre plan actuel
                                        </div>
                                    )}

                                    {/* Plan name */}
                                    <h2 style={{
                                        fontSize: 22, fontWeight: 900, color: NAVY,
                                        margin: isCurrent ? '0 0 6px' : '16px 0 6px',
                                    }}>
                                        {plan.name}
                                    </h2>

                                    {/* Price */}
                                    <div style={{ marginBottom: 12 }}>
                                        <span style={{
                                            fontSize: isFreePrice ? 28 : 32,
                                            fontWeight: 900,
                                            color: isFreePrice ? '#10b981' : TEAL,
                                            lineHeight: 1,
                                        }}>
                                            {isFreePrice ? 'Gratuit' : Number(plan.price).toLocaleString('fr-FR')}
                                        </span>
                                        {!isFreePrice && (
                                            <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500, marginLeft: 4 }}>
                                                FCFA/mois
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {plan.description && (
                                        <p style={{
                                            fontSize: 13, color: '#6b7280', lineHeight: 1.6,
                                            margin: '0 0 20px',
                                        }}>
                                            {plan.description}
                                        </p>
                                    )}

                                    {/* Divider */}
                                    <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0 20px' }} />

                                    {/* Features */}
                                    <ul style={{
                                        listStyle: 'none', padding: 0, margin: '0 0 28px',
                                        display: 'flex', flexDirection: 'column', gap: 10,
                                        flex: 1,
                                    }}>
                                        {(plan.features || []).map((feat, fi) => (
                                            <li key={fi} style={{
                                                display: 'flex', alignItems: 'flex-start', gap: 10,
                                                fontSize: 13, color: '#374151', lineHeight: 1.5,
                                            }}>
                                                <i className="fas fa-check-circle" style={{
                                                    color: '#10b981', fontSize: 15,
                                                    flexShrink: 0, marginTop: 1,
                                                }}></i>
                                                {feat}
                                            </li>
                                        ))}
                                        {(!plan.features || plan.features.length === 0) && (
                                            <li style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                                                Acces de base a la plateforme
                                            </li>
                                        )}
                                    </ul>

                                    {/* CTA button */}
                                    {btnLabel !== null && (
                                        <button
                                            disabled={btnDisabled}
                                            onClick={() => {
                                                if (btnDisabled) return;
                                                if (!user) {
                                                    window.location.href = '/inscription';
                                                    return;
                                                }
                                                setModalPlan(plan);
                                            }}
                                            style={{
                                                width: '100%', padding: '13px 20px',
                                                borderRadius: 12, border: 'none',
                                                background: btnBg,
                                                color: 'white', fontWeight: 700, fontSize: 14,
                                                cursor: btnDisabled ? 'not-allowed' : 'pointer',
                                                boxShadow: btnShadow,
                                                transition: 'all .2s',
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', gap: 8,
                                                opacity: btnDisabled ? 0.75 : 1,
                                            }}
                                            onMouseEnter={e => {
                                                if (!btnDisabled) {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = isLastPlan
                                                        ? '0 8px 24px rgba(27,42,74,0.4)'
                                                        : '0 8px 24px rgba(91,188,180,0.45)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!btnDisabled) {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = btnShadow;
                                                }
                                            }}
                                        >
                                            {isCurrent
                                                ? <><i className="fas fa-check"></i> {btnLabel}</>
                                                : !user
                                                    ? <><i className="fas fa-user-plus"></i> {btnLabel}</>
                                                    : <><i className="fas fa-bolt"></i> {btnLabel}</>
                                            }
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── CURRENT SUBSCRIPTION SECTION (auth only) ── */}
            {user && (
                <section style={{ ...W, marginTop: 56 }}>
                    <h2 style={{
                        fontSize: 20, fontWeight: 800, color: NAVY,
                        margin: '0 0 20px',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <i className="fas fa-id-card" style={{ color: TEAL, fontSize: 18 }}></i>
                        Mon abonnement
                    </h2>

                    {loadingSub ? (
                        <div style={{
                            background: 'white', borderRadius: 20, padding: 40,
                            textAlign: 'center', color: '#9ca3af',
                            border: '1px solid #f0f0f0',
                        }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: TEAL, marginBottom: 12 }}></i>
                            <p style={{ fontSize: 14 }}>Chargement...</p>
                        </div>
                    ) : (
                        <div style={{
                            background: 'white', borderRadius: 20,
                            border: `1px solid ${isFree ? '#f0f0f0' : TEAL + '40'}`,
                            boxShadow: isFree
                                ? '0 2px 12px rgba(0,0,0,0.05)'
                                : `0 8px 32px rgba(91,188,180,0.12)`,
                            padding: '28px 32px',
                            display: 'flex', flexDirection: 'column', gap: 24,
                        }}>
                            {/* Top row: plan info + status */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                        Plan actuel
                                    </div>
                                    <h3 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: '0 0 6px' }}>
                                        {subscription?.plan?.name || 'Gratuit'}
                                    </h3>
                                    {subscription?.expires_at && (
                                        <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <i className="fas fa-calendar-alt" style={{ color: TEAL, fontSize: 12 }}></i>
                                            Expire le {new Date(subscription.expires_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'long', year: 'numeric',
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Status badge */}
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '8px 18px', borderRadius: 99,
                                    background: subscription?.status === 'active' ? '#d1fae5' : '#fee2e2',
                                    color: subscription?.status === 'active' ? '#059669' : '#dc2626',
                                    fontWeight: 700, fontSize: 13,
                                }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: subscription?.status === 'active' ? '#10b981' : '#ef4444',
                                        display: 'inline-block',
                                    }}></span>
                                    {subscription?.status === 'active' ? 'Actif' : subscription?.status || 'Inactif'}
                                </div>
                            </div>

                            {/* Usage stats */}
                            {usage && (
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <i className="fas fa-chart-bar" style={{ color: TEAL, fontSize: 13 }}></i>
                                        Utilisation
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>

                                        {/* Messages IA */}
                                        {usage.messages !== undefined && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                        <i className="fas fa-robot" style={{ color: TEAL, fontSize: 12 }}></i>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Messages IA</span>
                                                    </div>
                                                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                                                        {usage.messages?.used ?? 0}/{usage.messages?.limit === -1 ? '∞' : (usage.messages?.limit ?? '—')} aujourd&apos;hui
                                                    </span>
                                                </div>
                                                <ProgressBar
                                                    value={usage.messages?.used ?? 0}
                                                    max={usage.messages?.limit === -1 ? 0 : (usage.messages?.limit ?? 0)}
                                                />
                                            </div>
                                        )}

                                        {/* Fiches */}
                                        {usage.fiches !== undefined && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                        <i className="fas fa-file-alt" style={{ color: TEAL, fontSize: 12 }}></i>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Fiches</span>
                                                    </div>
                                                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                                                        {usage.fiches?.used ?? 0}/{usage.fiches?.limit === -1 ? '∞' : (usage.fiches?.limit ?? '—')} ce mois
                                                    </span>
                                                </div>
                                                <ProgressBar
                                                    value={usage.fiches?.used ?? 0}
                                                    max={usage.fiches?.limit === -1 ? 0 : (usage.fiches?.limit ?? 0)}
                                                />
                                            </div>
                                        )}

                                        {/* Simulations */}
                                        {usage.simulations !== undefined && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                        <i className="fas fa-flask" style={{ color: TEAL, fontSize: 12 }}></i>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Simulations</span>
                                                    </div>
                                                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                                                        {usage.simulations?.used ?? 0}/{usage.simulations?.limit === -1 ? '∞' : (usage.simulations?.limit ?? '—')} ce mois
                                                    </span>
                                                </div>
                                                <ProgressBar
                                                    value={usage.simulations?.used ?? 0}
                                                    max={usage.simulations?.limit === -1 ? 0 : (usage.simulations?.limit ?? 0)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cancel button (paid plans only) */}
                            {!isFree && subscription?.status === 'active' && (
                                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                        style={{
                                            background: 'none', border: 'none',
                                            color: cancelling ? '#9ca3af' : '#ef4444',
                                            fontWeight: 600, fontSize: 13,
                                            cursor: cancelling ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 7,
                                            padding: 0, transition: 'opacity .15s',
                                        }}
                                        onMouseEnter={e => { if (!cancelling) e.currentTarget.style.opacity = '0.75'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                    >
                                        {cancelling
                                            ? <><i className="fas fa-spinner fa-spin"></i> Annulation...</>
                                            : <><i className="fas fa-times-circle"></i> Annuler l&apos;abonnement</>
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* ── FAQ / reassurance strip ── */}
            <section style={{ ...W, marginTop: 64 }}>
                <div style={{
                    background: `linear-gradient(135deg, ${NAVY} 0%, #243758 100%)`,
                    borderRadius: 20, padding: '40px 40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 24, flexWrap: 'wrap',
                }}>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>
                            Des questions sur nos offres ?
                        </h3>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 400 }}>
                            Contactez-nous pour obtenir plus d&apos;informations ou un devis personnalise pour votre etablissement.
                        </p>
                    </div>
                    <a
                        href="mailto:contact@insam-ia.com"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: TEAL, color: 'white',
                            padding: '13px 26px', borderRadius: 50,
                            fontWeight: 700, fontSize: 14, textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(91,188,180,0.35)',
                            flexShrink: 0, transition: 'all .2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <i className="fas fa-envelope"></i>
                        Nous contacter
                    </a>
                </div>
            </section>

            {/* ── SUBSCRIBE MODAL ── */}
            {modalPlan && (
                <SubscribeModal
                    plan={modalPlan}
                    onClose={() => setModalPlan(null)}
                    onSuccess={() => {
                        setModalPlan(null);
                        fetchSubscription();
                    }}
                />
            )}
        </div>
    );
}
