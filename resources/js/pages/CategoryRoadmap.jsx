import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

const W = { maxWidth: 900, margin: '0 auto', padding: '0 24px' };

const LEVEL_COLORS = {
    Debutant:      { bg: '#dcfce7', color: '#16a34a', label: 'Debutant' },
    Intermediaire: { bg: '#fef9c3', color: '#ca8a04', label: 'Intermediaire' },
    Avance:        { bg: '#ffedd5', color: '#ea580c', label: 'Avance' },
    Expert:        { bg: '#ede9fe', color: '#7c3aed', label: 'Expert' },
};

function levelStyle(level) {
    const key = Object.keys(LEVEL_COLORS).find(k => k.toLowerCase() === (level || '').toLowerCase()) || 'Debutant';
    return LEVEL_COLORS[key];
}

function StepCard({ step, index, total }) {
    const lvl = levelStyle(step.level);
    const isLast = index === total - 1;

    return (
        <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
            {/* Left: circle + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 56 }}>
                <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5BBCB4, #1B2A4A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 16,
                    boxShadow: '0 4px 14px rgba(91,188,180,0.35)',
                    flexShrink: 0,
                    zIndex: 1,
                    position: 'relative',
                }}>
                    {index + 1}
                </div>
                {!isLast && (
                    <div style={{
                        width: 2,
                        flex: 1,
                        minHeight: 32,
                        background: 'linear-gradient(to bottom, #5BBCB4, #5BBCB430)',
                        marginTop: 0,
                    }} />
                )}
            </div>

            {/* Right: card */}
            <div style={{
                flex: 1,
                background: 'white',
                borderRadius: 16,
                padding: '24px 28px',
                marginLeft: 20,
                marginBottom: isLast ? 0 : 28,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f0f4f8',
                transition: 'box-shadow .2s',
            }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(91,188,180,0.14)'; e.currentTarget.style.borderColor = '#5BBCB4'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#f0f4f8'; }}
            >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {step.icon && (
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: '#e8f8f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#5BBCB4',
                                fontSize: 17,
                                flexShrink: 0,
                            }}>
                                <i className={step.icon}></i>
                            </div>
                        )}
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1B2A4A', margin: 0 }}>{step.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 20,
                            background: lvl.bg,
                            color: lvl.color,
                            letterSpacing: 0.3,
                        }}>
                            {lvl.label}
                        </span>
                        {step.duration && (
                            <span style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: 20,
                                background: '#f3f4f6',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                            }}>
                                <i className="fas fa-clock" style={{ fontSize: 10 }}></i>
                                {step.duration}
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                {step.description && (
                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75, marginTop: 14, marginBottom: 0 }}>
                        {step.description}
                    </p>
                )}

                {/* Skills tags */}
                {step.skills && step.skills.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                        {(Array.isArray(step.skills) ? step.skills : step.skills.split(','))
                            .map(s => s.trim()).filter(Boolean).map((skill, i) => (
                            <span key={i} style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#e8f8f5',
                                color: '#5BBCB4',
                                border: '1px solid #c7ede9',
                            }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CategoryRoadmap() {
    const { id } = useParams();
    const [category, setCategory] = useState(null);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([
            api.get(`/api/public/categories/${id}`),
            api.get(`/api/public/categories/${id}/roadmap`),
        ])
            .then(([catRes, roadmapRes]) => {
                setCategory(catRes.data.category || catRes.data.data || catRes.data);
                const raw = roadmapRes.data.roadmap || roadmapRes.data.data || roadmapRes.data || [];
                setSteps(Array.isArray(raw) ? raw : raw.steps || []);
            })
            .catch(() => setError('Impossible de charger le parcours.'))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>

            {/* === HERO BANNER === */}
            <section style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #263d6b 100%)', padding: '44px 0 36px' }}>
                <div style={W}>
                    {/* Back link */}
                    <Link
                        to={`/formations/${id}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            color: 'rgba(255,255,255,0.65)',
                            textDecoration: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 22,
                            transition: 'color .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#5BBCB4'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                    >
                        <i className="fas fa-arrow-left"></i>
                        Retour a la formation
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        {category?.icon && (
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: 14,
                                background: 'rgba(91,188,180,0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                color: '#5BBCB4',
                                flexShrink: 0,
                            }}>
                                <i className={category.icon}></i>
                            </div>
                        )}
                        <div>
                            <p style={{ color: '#5BBCB4', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                                {category?.name || 'Formation'}
                            </p>
                            <h1 style={{ fontSize: 30, fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.2 }}>
                                Parcours de formation
                            </h1>
                            {category?.description && (
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 8, maxWidth: 580 }}>
                                    {category.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Progress pill */}
                    {steps.length > 0 && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 22,
                            background: 'rgba(91,188,180,0.15)',
                            border: '1px solid rgba(91,188,180,0.3)',
                            borderRadius: 50,
                            padding: '7px 18px',
                        }}>
                            <i className="fas fa-route" style={{ color: '#5BBCB4', fontSize: 13 }}></i>
                            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>
                                {steps.length} etape{steps.length > 1 ? 's' : ''} dans ce parcours
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* === TIMELINE === */}
            <section style={{ padding: '52px 0 72px' }}>
                <div style={W}>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                border: '3px solid #e5e7eb',
                                borderTopColor: '#5BBCB4',
                                animation: 'spin 0.8s linear infinite',
                                margin: '0 auto 16px',
                            }} />
                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement du parcours...</p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}

                    {!loading && error && (
                        <div style={{
                            background: '#fff5f5',
                            border: '1px solid #fecaca',
                            borderRadius: 12,
                            padding: '24px 28px',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}>
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    {!loading && !error && steps.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '72px 0' }}>
                            <div style={{
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                background: '#e8f8f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                fontSize: 28,
                                color: '#5BBCB4',
                            }}>
                                <i className="fas fa-route"></i>
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>
                                Parcours en preparation
                            </h3>
                            <p style={{ color: '#9ca3af', fontSize: 14 }}>
                                Le parcours de formation sera disponible prochainement.
                            </p>
                        </div>
                    )}

                    {!loading && !error && steps.length > 0 && (
                        <div>
                            {/* Section heading */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
                                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                                    ETAPES DU PARCOURS
                                </span>
                                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                            </div>

                            {/* Steps */}
                            <div>
                                {steps.map((step, i) => (
                                    <StepCard key={step.id || i} step={step} index={i} total={steps.length} />
                                ))}
                            </div>

                            {/* Completion badge */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 36, gap: 12 }}>
                                <div style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #5BBCB4, #3da89e)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: 22,
                                    boxShadow: '0 6px 20px rgba(91,188,180,0.4)',
                                }}>
                                    <i className="fas fa-flag-checkered"></i>
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#5BBCB4' }}>Fin du parcours</p>
                                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', maxWidth: 400 }}>
                                    Vous avez parcouru toutes les etapes de cette formation. Bonne chance !
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
