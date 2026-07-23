import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api';

const TEAL = '#5BBCB4';
const NAVY = '#1B2A4A';
const W = { maxWidth: 900, margin: '0 auto', padding: '0 24px' };

function InfoCard({ icon, title, color, bg, children }) {
    return (
        <div style={{ background: 'white', borderRadius: 18, padding: '28px 26px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 16, flexShrink: 0 }}>
                    <i className={icon}></i>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

function BulletList({ items, icon = 'fas fa-check-circle', color = TEAL }) {
    if (!items || items.length === 0) return null;
    return (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
                    <i className={icon} style={{ color, fontSize: 13, marginTop: 4, flexShrink: 0 }}></i>
                    {item}
                </li>
            ))}
        </ul>
    );
}

function TagList({ items, color, bg, border }) {
    if (!items || items.length === 0) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map((item, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: bg, color, border: `1px solid ${border}` }}>{item}</span>
            ))}
        </div>
    );
}

const LEVEL_COLORS = {
    Debutant:      { bg: '#dcfce7', color: '#16a34a', label: 'Debutant' },
    Intermediaire: { bg: '#fef9c3', color: '#ca8a04', label: 'Intermediaire' },
    Avance:        { bg: '#ffedd5', color: '#ea580c', label: 'Avance' },
    Expert:        { bg: '#ede9fe', color: '#7c3aed', label: 'Expert' },
};

export default function RoadmapStepDetail() {
    const { id } = useParams();
    const [step, setStep] = useState(null);
    const [siblings, setSiblings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        setAiLoading(false);
        api.get(`/api/public/roadmap-steps/${id}`)
            .then(res => {
                const s = res.data.step || res.data.data || res.data;
                setStep(s);

                if (!s.ai_details) {
                    setAiLoading(true);
                }

                if (s.category_id) {
                    api.get(`/api/public/categories/${s.category_id}/roadmap`)
                        .then(sibRes => {
                            const all = sibRes.data.roadmap || sibRes.data.data || [];
                            setSiblings(all.filter(x => x.id !== s.id));
                        })
                        .catch(() => {});
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    // Poll for AI details if being generated
    useEffect(() => {
        if (!aiLoading || !step) return;
        const timer = setTimeout(() => {
            api.get(`/api/public/roadmap-steps/${id}`)
                .then(res => {
                    const s = res.data.step || res.data.data || res.data;
                    if (s.ai_details) {
                        setStep(s);
                        setAiLoading(false);
                    }
                })
                .catch(() => {});
        }, 3000);
        return () => clearTimeout(timer);
    }, [aiLoading, step, id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: TEAL, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }}></div>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>Chargement...</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!step) {
        return (
            <div style={{ ...W, padding: '80px 24px', textAlign: 'center' }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }}></i>
                <p style={{ color: '#9ca3af', fontSize: 16 }}>Etape introuvable.</p>
                <Link to="/formations" style={{ color: TEAL, fontWeight: 600, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>&larr; Retour aux formations</Link>
            </div>
        );
    }

    const cat = step.category;
    const ai = step.ai_details || {};
    const lvlKey = Object.keys(LEVEL_COLORS).find(k => k.toLowerCase() === (step.level || '').toLowerCase()) || 'Debutant';
    const lvl = LEVEL_COLORS[lvlKey];

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
                @media(max-width:768px) {
                    .step-hero-flex { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
                    .step-grid2 { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Hero */}
            <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #263d6b 50%, ${TEAL} 100%)`, padding: '44px 0 40px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: '50%', background: `${TEAL}20`, pointerEvents: 'none' }}></div>
                <div style={W}>
                    {/* Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                        <Link to="/formations" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>Formations</Link>
                        <i className="fas fa-chevron-right" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}></i>
                        {cat && (
                            <>
                                <Link to={`/formations/${cat.id}`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>{cat.name}</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}></i>
                                <Link to={`/formations/${cat.id}/roadmap`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>Parcours</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}></i>
                            </>
                        )}
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{step.title}</span>
                    </div>

                    <div className="step-hero-flex" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 20,
                            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, color: 'white', flexShrink: 0,
                        }}>
                            {step.icon ? <i className={step.icon}></i> : <span style={{ fontWeight: 800 }}>{step.step_number}</span>}
                        </div>
                        <div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: lvl.bg, color: lvl.color }}>
                                    {lvl.label}
                                </span>
                                {step.duration && (
                                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                                        <i className="fas fa-clock" style={{ marginRight: 4 }}></i>{step.duration}
                                    </span>
                                )}
                                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                                    Etape {step.step_number}
                                </span>
                            </div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.3 }}>
                                {step.title}
                            </h1>
                            {step.description && (
                                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 10, maxWidth: 550, lineHeight: 1.6 }}>
                                    {step.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section style={{ padding: '36px 0 72px' }}>
                <div style={W}>

                    {/* AI Loading */}
                    {aiLoading && (
                        <div style={{
                            background: 'white', borderRadius: 18, padding: '40px 28px', border: '1px solid #f0f0f0',
                            textAlign: 'center', marginBottom: 24,
                        }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f8f5', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-robot" style={{ fontSize: 24, color: TEAL, animation: 'pulse 1.5s ease infinite' }}></i>
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>L'IA genere les details...</h3>
                            <p style={{ color: '#9ca3af', fontSize: 13 }}>Cela peut prendre quelques secondes.</p>
                        </div>
                    )}

                    {/* Resume */}
                    {ai.resume && (
                        <div style={{
                            background: `linear-gradient(135deg, #e8f8f5, #f0fdf9)`,
                            border: `1.5px solid ${TEAL}40`,
                            borderRadius: 14, padding: '18px 22px', marginBottom: 24,
                            display: 'flex', gap: 14, alignItems: 'flex-start',
                        }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16 }}>
                                <i className="fas fa-lightbulb"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Resume</div>
                                <p style={{ fontSize: 14, color: '#1e4040', lineHeight: 1.65, margin: 0 }}>{ai.resume}</p>
                            </div>
                        </div>
                    )}

                    {/* Grid: Objectifs + Competences */}
                    {(ai.objectifs || ai.competences_acquises) && (
                        <div className="step-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                            {ai.objectifs && (
                                <InfoCard icon="fas fa-bullseye" title="Objectifs d'apprentissage" color="#3b82f6" bg="#eff6ff">
                                    <BulletList items={ai.objectifs} icon="fas fa-bullseye" color="#3b82f6" />
                                </InfoCard>
                            )}
                            {ai.competences_acquises && (
                                <InfoCard icon="fas fa-trophy" title="Competences acquises" color={TEAL} bg="#e8f8f5">
                                    <TagList items={ai.competences_acquises} color={TEAL} bg="#e8f8f5" border="#c7ede9" />
                                </InfoCard>
                            )}
                        </div>
                    )}

                    {/* Contenu detaille */}
                    {ai.contenu_detaille && ai.contenu_detaille.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <InfoCard icon="fas fa-book-open" title="Contenu detaille" color="#7c3aed" bg="#ede9fe">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {ai.contenu_detaille.map((mod, i) => (
                                        <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: i % 2 === 0 ? '#faf5ff' : '#f8fafb', border: '1px solid #f0f0f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                                <span style={{
                                                    width: 24, height: 24, borderRadius: '50%', background: '#7c3aed', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0,
                                                }}>{i + 1}</span>
                                                <h4 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0 }}>{mod.titre}</h4>
                                            </div>
                                            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0, paddingLeft: 34 }}>{mod.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        </div>
                    )}

                    {/* Grid: Prerequis + Ressources */}
                    {(ai.prerequis || ai.ressources) && (
                        <div className="step-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                            {ai.prerequis && (
                                <InfoCard icon="fas fa-lock-open" title="Prerequis" color="#ea580c" bg="#ffedd5">
                                    <BulletList items={ai.prerequis} icon="fas fa-arrow-right" color="#ea580c" />
                                </InfoCard>
                            )}
                            {ai.ressources && (
                                <InfoCard icon="fas fa-link" title="Ressources recommandees" color="#0891b2" bg="#ecfeff">
                                    <BulletList
                                        items={ai.ressources.map(r => typeof r === 'string' ? r : `${r.type || r.titre || ''}${r.exemples ? ' — ' + (Array.isArray(r.exemples) ? r.exemples.join(', ') : r.exemples) : r.description ? ' — ' + r.description : ''}`)}
                                        icon="fas fa-external-link-alt" color="#0891b2"
                                    />
                                </InfoCard>
                            )}
                        </div>
                    )}

                    {/* Projets pratiques */}
                    {ai.projets_pratiques && (
                        <div style={{ marginBottom: 24 }}>
                            <InfoCard icon="fas fa-hammer" title="Projets pratiques" color="#16a34a" bg="#dcfce7">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {ai.projets_pratiques.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                                                {i + 1}
                                            </div>
                                            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        </div>
                    )}

                    {/* Evaluation + Conseil */}
                    {(ai.evaluation || ai.conseil) && (
                        <div className="step-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                            {ai.evaluation && (
                                <InfoCard icon="fas fa-clipboard-check" title="Evaluation" color="#ca8a04" bg="#fef9c3">
                                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{ai.evaluation}</p>
                                </InfoCard>
                            )}
                            {ai.conseil && (
                                <InfoCard icon="fas fa-lightbulb" title="Conseil" color="#F5A623" bg="#fff8ec">
                                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{ai.conseil}</p>
                                </InfoCard>
                            )}
                        </div>
                    )}

                    {/* Skills */}
                    {step.skills && (
                        <div style={{ marginBottom: 24 }}>
                            <InfoCard icon="fas fa-code" title="Competences cles" color={TEAL} bg="#e8f8f5">
                                <TagList
                                    items={(Array.isArray(step.skills) ? step.skills : step.skills.split(',')).map(s => s.trim()).filter(Boolean)}
                                    color={TEAL} bg="#e8f8f5" border="#c7ede9"
                                />
                            </InfoCard>
                        </div>
                    )}

                    {/* Other steps */}
                    {siblings.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>
                                <i className="fas fa-route" style={{ color: TEAL, marginRight: 8 }}></i>
                                Autres etapes du parcours
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                                {siblings.map(s => {
                                    const sLvl = LEVEL_COLORS[Object.keys(LEVEL_COLORS).find(k => k.toLowerCase() === (s.level || '').toLowerCase()) || 'Debutant'];
                                    return (
                                        <Link key={s.id} to={`/roadmap/${s.id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                background: 'white', borderRadius: 14, padding: '16px 18px',
                                                border: '1px solid #f0f0f0', transition: 'all .2s', cursor: 'pointer',
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 4px 16px ${TEAL}15`; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 800 }}>
                                                        {s.step_number}
                                                    </div>
                                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, flex: 1 }}>{s.title}</h4>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sLvl.bg, color: sLvl.color }}>{sLvl.label}</span>
                                                    {s.duration && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>{s.duration}</span>}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
