import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api';

const W = { maxWidth: 900, margin: '0 auto', padding: '0 24px' };

function InfoCard({ icon, title, color, bg, children }) {
    return (
        <div style={{ background: 'white', borderRadius: 18, padding: '28px 26px', border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 16, flexShrink: 0 }}>
                    <i className={icon}></i>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2A4A', margin: 0 }}>{title}</h3>
            </div>
            {children}
        </div>
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

function BulletList({ items }) {
    if (!items || items.length === 0) return null;
    return (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
                    <i className="fas fa-check-circle" style={{ color: '#5BBCB4', fontSize: 13, marginTop: 4, flexShrink: 0 }}></i>
                    {item}
                </li>
            ))}
        </ul>
    );
}

export default function DeboucheDetail() {
    const { id } = useParams();
    const [debouche, setDebouche] = useState(null);
    const [siblings, setSiblings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        setAiLoading(false);
        api.get(`/api/public/debouches/${id}`)
            .then(res => {
                const d = res.data.debouche || res.data.data || res.data;
                setDebouche(d);

                // If no ai_details yet, show a loading state for AI
                if (!d.ai_details) {
                    setAiLoading(true);
                }

                if (d.category_id) {
                    api.get(`/api/public/categories/${d.category_id}/debouches`)
                        .then(sibRes => {
                            const all = sibRes.data.debouches || sibRes.data.data || [];
                            setSiblings(all.filter(s => s.id !== d.id));
                        })
                        .catch(() => {});
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    // Poll for AI details if they were being generated
    useEffect(() => {
        if (!aiLoading || !debouche) return;

        const timer = setTimeout(() => {
            api.get(`/api/public/debouches/${id}`)
                .then(res => {
                    const d = res.data.debouche || res.data.data || res.data;
                    if (d.ai_details) {
                        setDebouche(d);
                        setAiLoading(false);
                    }
                })
                .catch(() => {});
        }, 3000);

        return () => clearTimeout(timer);
    }, [aiLoading, debouche, id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid #e5e7eb', borderTopColor: '#E74C3C', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }}></div>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>Chargement...</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!debouche) {
        return (
            <div style={{ ...W, padding: '80px 24px', textAlign: 'center' }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }}></i>
                <p style={{ color: '#9ca3af', fontSize: 16 }}>Debouche introuvable.</p>
                <Link to="/formations" style={{ color: '#5BBCB4', fontWeight: 600, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>&larr; Retour aux formations</Link>
            </div>
        );
    }

    const cat = debouche.category;
    const ai = debouche.ai_details || {};

    return (
        <div style={{ background: '#F8FAFB', minHeight: '100vh' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
                @media(max-width:768px) {
                    .deb-hero-flex { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
                    .deb-hero-icon { width: 64px !important; height: 64px !important; font-size: 26px !important; }
                    .deb-hero-title { font-size: 24px !important; }
                    .deb-siblings-grid { grid-template-columns: 1fr !important; }
                    .deb-grid2 { grid-template-columns: 1fr !important; }
                    .deb-salary-row { flex-direction: column !important; }
                }
            `}</style>

            {/* Hero */}
            <section style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #4a2040 50%, #E74C3C 100%)', padding: '44px 0 40px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: '50%', background: 'rgba(231,76,60,0.12)', pointerEvents: 'none' }}></div>
                <div style={W}>
                    {/* Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                        <Link to="/formations" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>Formations</Link>
                        <i className="fas fa-chevron-right" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}></i>
                        {cat && (
                            <>
                                <Link to={`/formations/${cat.id}`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>{cat.name}</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}></i>
                            </>
                        )}
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{debouche.title}</span>
                    </div>

                    <div className="deb-hero-flex" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div className="deb-hero-icon" style={{
                            width: 80, height: 80, borderRadius: 20,
                            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 32, flexShrink: 0,
                        }}>
                            <i className={debouche.icon || 'fas fa-briefcase'}></i>
                        </div>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#E74C3C', textTransform: 'uppercase', background: 'rgba(231,76,60,0.15)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(231,76,60,0.3)', display: 'inline-block', marginBottom: 10 }}>
                                Debouche professionnel
                            </span>
                            <h1 className="deb-hero-title" style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: '0 0 8px', lineHeight: 1.2 }}>
                                {debouche.title}
                            </h1>
                            {cat && (
                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                                    <i className="fas fa-graduation-cap" style={{ marginRight: 6 }}></i>
                                    {cat.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Loading indicator */}
            {aiLoading && (
                <section style={{ padding: '32px 0 0' }}>
                    <div style={W}>
                        <div style={{ background: 'white', borderRadius: 18, padding: '32px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#E74C3C', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }}></div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#1B2A4A', marginBottom: 6 }}>Generation de la fiche metier en cours...</p>
                            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>L'IA analyse et prepare les details de ce metier</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Resume / Description */}
            <section style={{ padding: '32px 0 0' }}>
                <div style={W}>
                    <InfoCard icon="fas fa-info-circle" title="Description du metier" color="#E74C3C" bg="#fef2f2">
                        <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.85, margin: 0 }}>
                            {ai.resume || debouche.description || 'Aucune description disponible.'}
                        </p>
                    </InfoCard>
                </div>
            </section>

            {/* Missions & Competences */}
            {(ai.missions || ai.competences) && (
                <section style={{ padding: '20px 0 0' }}>
                    <div style={W}>
                        <div className="deb-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            {ai.missions && (
                                <InfoCard icon="fas fa-tasks" title="Missions principales" color="#3B82F6" bg="#eff6ff">
                                    <BulletList items={ai.missions} />
                                </InfoCard>
                            )}
                            {ai.competences && (
                                <InfoCard icon="fas fa-star" title="Competences requises" color="#F59E0B" bg="#fffbeb">
                                    <TagList items={ai.competences} color="#92400e" bg="#fef3c7" border="#fde68a" />
                                </InfoCard>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Salaire */}
            {(ai.salaire_debutant || ai.salaire_senior) && (
                <section style={{ padding: '20px 0 0' }}>
                    <div style={W}>
                        <InfoCard icon="fas fa-money-bill-wave" title="Remuneration" color="#10B981" bg="#ecfdf5">
                            <div className="deb-salary-row" style={{ display: 'flex', gap: 16 }}>
                                {ai.salaire_debutant && (
                                    <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 14, padding: '18px 20px', border: '1px solid #bbf7d0' }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Debutant</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{ai.salaire_debutant}</div>
                                    </div>
                                )}
                                {ai.salaire_senior && (
                                    <div style={{ flex: 1, background: '#ecfdf5', borderRadius: 14, padding: '18px 20px', border: '1px solid #a7f3d0' }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Senior / Experimente</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{ai.salaire_senior}</div>
                                    </div>
                                )}
                            </div>
                        </InfoCard>
                    </div>
                </section>
            )}

            {/* Outils & Secteurs */}
            {(ai.outils || ai.secteurs) && (
                <section style={{ padding: '20px 0 0' }}>
                    <div style={W}>
                        <div className="deb-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            {ai.outils && (
                                <InfoCard icon="fas fa-tools" title="Outils & Technologies" color="#8B5CF6" bg="#f5f3ff">
                                    <TagList items={ai.outils} color="#6d28d9" bg="#ede9fe" border="#ddd6fe" />
                                </InfoCard>
                            )}
                            {ai.secteurs && (
                                <InfoCard icon="fas fa-building" title="Secteurs d'activite" color="#06B6D4" bg="#ecfeff">
                                    <BulletList items={ai.secteurs} />
                                </InfoCard>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Formations & Evolution */}
            {(ai.formations_requises || ai.evolution) && (
                <section style={{ padding: '20px 0 0' }}>
                    <div style={W}>
                        <div className="deb-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            {ai.formations_requises && (
                                <InfoCard icon="fas fa-graduation-cap" title="Formations recommandees" color="#EC4899" bg="#fdf2f8">
                                    <BulletList items={ai.formations_requises} />
                                </InfoCard>
                            )}
                            {ai.evolution && (
                                <InfoCard icon="fas fa-chart-line" title="Evolution de carriere" color="#F97316" bg="#fff7ed">
                                    <BulletList items={ai.evolution} />
                                </InfoCard>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Conseil */}
            {ai.conseil && (
                <section style={{ padding: '20px 0 0' }}>
                    <div style={W}>
                        <div style={{ background: 'linear-gradient(135deg, #1B2A4A, #2d4270)', borderRadius: 18, padding: '28px 28px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(91,188,180,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5BBCB4', fontSize: 18, flexShrink: 0 }}>
                                <i className="fas fa-lightbulb"></i>
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#5BBCB4', margin: '0 0 8px' }}>Conseil pratique</h3>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, margin: 0 }}>{ai.conseil}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Related formation CTA */}
            {cat && (
                <section style={{ padding: '24px 0 20px' }}>
                    <div style={W}>
                        <div style={{ background: 'white', borderRadius: 18, padding: '24px 28px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2A4A', margin: '0 0 4px' }}>Formation associee</h3>
                                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{cat.name} - Consultez le parcours et les videos TP</p>
                            </div>
                            <Link to={`/formations/${cat.id}`} style={{
                                background: '#5BBCB4', color: 'white', padding: '10px 24px', borderRadius: 50,
                                fontWeight: 600, textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <i className="fas fa-arrow-right"></i>
                                Voir la formation
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Other debouches */}
            {siblings.length > 0 && (
                <section style={{ padding: '12px 0 60px' }}>
                    <div style={W}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B2A4A', marginBottom: 16 }}>Autres debouches de cette formation</h2>
                        <div className="deb-siblings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                            {siblings.map(s => (
                                <Link
                                    key={s.id}
                                    to={`/debouche/${s.id}`}
                                    style={{
                                        background: 'white', borderRadius: 14, padding: '18px 16px',
                                        border: '1px solid #f0f0f0', textDecoration: 'none',
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        transition: 'all .2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(231,76,60,0.1)'; e.currentTarget.style.borderColor = '#E74C3C40'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                                >
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#E74C3C', flexShrink: 0 }}>
                                        <i className={s.icon || 'fas fa-briefcase'}></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1B2A4A', margin: 0 }}>{s.title}</h4>
                                        {s.description && (
                                            <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{s.description}</p>
                                        )}
                                    </div>
                                    <i className="fas fa-chevron-right" style={{ fontSize: 11, color: '#d1d5db' }}></i>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
